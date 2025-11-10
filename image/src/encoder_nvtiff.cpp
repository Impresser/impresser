#include "converter/encoder.hpp"
#include "converter/types.hpp"
#include "converter/log.hpp"

#include <cuda_runtime.h>
#include <stdexcept>
#include <string>
#include <cstring>
#include <vector>
#include <chrono>
#include <algorithm>

#include <nvtiff.h>

using namespace conv;

static inline void ck(cudaError_t e, const char* msg) {
    if (e != cudaSuccess) throw std::runtime_error(std::string(msg) + ": " + cudaGetErrorString(e));
}

static inline void LOGI_STEP(const char* m) {
    using namespace std::chrono;
    static auto t0 = high_resolution_clock::now();
    auto t = duration<double>(high_resolution_clock::now() - t0).count();
    LOGI(std::string("[STEP] ") + m + "  t=" + std::to_string(t) + "s");
}

// rowsPerStrip 자동 결정
static inline unsigned int snapToPreferred(unsigned int r) {
    static const unsigned int kPrefs[] = { 16, 24, 32, 48, 64 };
    unsigned int best = kPrefs[0];
    unsigned int bestDiff = (r > best ? r - best : best - r);
    for (unsigned int v : kPrefs) {
        unsigned int d = (r > v ? r - v : v - r);
        if (d < bestDiff) { best = v; bestDiff = d; }
    }
    return best;
}

static inline unsigned int pickRowsPerStrip(uint32_t width, uint32_t height) {
    // 1) "스트립 개수"를 기준으로 rps를 잡는다.
    const unsigned int targetStrips = 1000; // 중앙값
    unsigned int rps = (height + targetStrips - 1) / targetStrips; // ceil(height / targetStrips)
    if (rps == 0) rps = 1;

    // 2) 안전 클램프 (너무 커지지 않도록)
    if (rps < 16u) rps = 16u;
    if (rps > 64u) rps = 64u;

    // 3) 스냅 (16/24/32/48/64 중 가장 가까운 값)
    rps = snapToPreferred(rps);

    return rps;
}

class NvTiffEncoder final : public IEncoder {
public:
    const char* name() const override { return "nvTIFF(low-level)"; }

    bool encode(const ImageInfo& info,
        const std::vector<uint8_t>& rgb,
        const std::string& outPath,
        const TiffOptions& opt) override
    {
        try {
            LOGI_STEP("begin encode (low-level)");

            // 0) 입력 검증
            if (info.channels != 3 || info.bitsPerSample != 8)
                throw std::runtime_error("Only RGB24 (3x8bit) supported.");
            const std::size_t expected = (std::size_t)info.width * (std::size_t)info.height * 3;
            if (rgb.size() != expected)
                throw std::runtime_error("RGB buffer size mismatch.");

            // nvTIFF v0.5 LL 경로는 사실상 LZW만 현실적으로 사용 가능
            if (opt.compression == Compression::Deflate)
                throw std::runtime_error("nvTIFF v0.5 does NOT support DEFLATE here. Use libtiff path.");
            if (opt.compression == Compression::None)
                throw std::runtime_error("nvTIFF v0.5 low-level encoder handles LZW only (NONE not supported).");

            // 1) CUDA 디바이스 준비 + 스트림
            int devCount = 0;
            ck(cudaGetDeviceCount(&devCount), "cudaGetDeviceCount");
            if (devCount <= 0) throw std::runtime_error("No CUDA device");
            ck(cudaSetDevice(0), "cudaSetDevice(0)");
            ck(cudaFree(0), "cuda warmup");

            cudaStream_t stream{};
            ck(cudaStreamCreateWithFlags(&stream, cudaStreamNonBlocking), "cudaStreamCreate");
            LOGI_STEP("cuda device ready");

            // 2) H2D 업로드 (pinned + async)
            uint8_t* d_img = nullptr;
            ck(cudaMalloc(&d_img, expected), "cudaMalloc(d_img)");

            bool pinned = false;
            if (!rgb.empty()) {
                if (cudaHostRegister((void*)rgb.data(), rgb.size(), cudaHostRegisterPortable) == cudaSuccess)
                    pinned = true;
            }
            ck(cudaMemcpyAsync(d_img, rgb.data(), expected, cudaMemcpyHostToDevice, stream), "H2D async");
            ck(cudaStreamSynchronize(stream), "sync after H2D");
            if (pinned) cudaHostUnregister((void*)rgb.data());
            LOGI_STEP("H2D done");

            // 3) rowsPerStrip 계산
            const unsigned int width = (unsigned int)info.width;
            const unsigned int height = (unsigned int)info.height;
            const unsigned int pixelSize = 3;  // RGB24
            const unsigned long long bytesPerRow = (unsigned long long)width * pixelSize;

            unsigned int rowsPerStrip = opt.rowsPerStrip.has_value() && opt.rowsPerStrip.value() > 0
                ? (unsigned int)opt.rowsPerStrip.value()
                : pickRowsPerStrip(info.width, info.height);
            rowsPerStrip = std::max(1u, std::min(rowsPerStrip, height));

            LOGI("[nvTIFF] rowsPerStrip=" << rowsPerStrip);

            // 4) 인코딩: 실패 시 rowsPerStrip을 절반으로 줄이며 재시도
            const int kMaxAttempts = 4;
            bool encoded = false;
            std::string lastErr;

            nvTiffEncodeCtx_t* ctx = nullptr;
            unsigned long long* stripSize_d = nullptr;
            unsigned long long* stripOffs_d = nullptr;
            unsigned char* stripData_d = nullptr;

            std::vector<unsigned long long> stripSize_h;
            std::vector<unsigned long long> stripOffs_h;
            std::vector<unsigned char>      stripData_h;

            unsigned char* images_d[1];

            for (int attempt = 0; attempt < kMaxAttempts && !encoded; ++attempt) {
                const unsigned int stripsPerImageMax = (height + rowsPerStrip - 1) / rowsPerStrip;
                const unsigned long long stripAllocSize = (unsigned long long)rowsPerStrip * bytesPerRow;
                const unsigned long long totalStrips = (unsigned long long)stripsPerImageMax * 1ull;
                const unsigned long long totalAllocSize = stripAllocSize * totalStrips;

                LOGI("[nvTIFF] attempt=" << (attempt + 1)
                    << " rowsPerStrip=" << rowsPerStrip
                    << " stripsPerImageMax=" << stripsPerImageMax
                    << " stripAllocSize=" << stripAllocSize
                    << " totalAllocSize=" << totalAllocSize);

                // 이전 자원 해제
                if (ctx) { nvTiffEncodeCtxDestroy(ctx); ctx = nullptr; }
                if (stripData_d) { cudaFree(stripData_d); stripData_d = nullptr; }
                if (stripSize_d) { cudaFree(stripSize_d); stripSize_d = nullptr; }
                if (stripOffs_d) { cudaFree(stripOffs_d); stripOffs_d = nullptr; }

                // 컨텍스트 & 버퍼 할당
                ctx = nvTiffEncodeCtxCreate(/*device*/0, /*nImages*/1, stripsPerImageMax, /*flags*/0);
                if (!ctx) {
                    lastErr = "nvTiffEncodeCtxCreate returned null";
                    goto FAIL_AND_REDUCE;
                }
                ck(cudaMalloc(&stripSize_d, sizeof(unsigned long long) * totalStrips), "cudaMalloc(stripSize_d)");
                ck(cudaMalloc(&stripOffs_d, sizeof(unsigned long long) * totalStrips), "cudaMalloc(stripOffs_d)");
                ck(cudaMalloc(&stripData_d, totalAllocSize), "cudaMalloc(stripData_d)");

                // 입력
                images_d[0] = d_img;

                // 인코딩(LZW)
                {
                    LOGI_STEP("nvTiffEncode begin");
                    int rc = nvTiffEncode(
                        ctx,
                        /*nrow*/          height,
                        /*ncol*/          width,
                        /*pixelSize*/     pixelSize,
                        /*rowsPerStrip*/  rowsPerStrip,
                        /*nImages*/       1,
                        /*images_d*/      images_d,
                        /*stripAllocSize*/stripAllocSize,
                        /*stripSize_d*/   stripSize_d,
                        /*stripOffs_d*/   stripOffs_d,
                        /*stripData_d*/   stripData_d,
                        /*stream*/        stream
                    );
                    if (rc != NVTIFF_ENCODE_SUCCESS) {
                        lastErr = std::string("nvTiffEncode failed rc=") + std::to_string(rc);
                        LOGW(lastErr);
                        goto FAIL_AND_REDUCE;
                    }
                    LOGI_STEP("nvTiffEncode done");
                }

                {
                    int rc = nvTiffEncodeFinalize(ctx, stream);
                    if (rc != NVTIFF_ENCODE_SUCCESS) {
                        lastErr = std::string("nvTiffEncodeFinalize failed rc=") + std::to_string(rc);
                        LOGW(lastErr);
                        goto FAIL_AND_REDUCE;
                    }
                    ck(cudaStreamSynchronize(stream), "sync after finalize");
                    LOGI_STEP("nvTiffEncodeFinalize done");
                }

                // strip 메타 D2H
                {
                    const unsigned int stripsActual = (height + rowsPerStrip - 1) / rowsPerStrip;
                    const unsigned long long totalStrips = (unsigned long long)stripsActual;

                    stripSize_h.resize(totalStrips);
                    stripOffs_h.resize(totalStrips);
                    ck(cudaMemcpy(stripSize_h.data(), stripSize_d,
                        sizeof(unsigned long long) * totalStrips,
                        cudaMemcpyDeviceToHost), "D2H stripSize");
                    ck(cudaMemcpy(stripOffs_h.data(), stripOffs_d,
                        sizeof(unsigned long long) * totalStrips,
                        cudaMemcpyDeviceToHost), "D2H stripOffs");

                    // 실제 사용 바이트(offs+size 최대값)
                    unsigned long long usedBytes = 0ull;
                    for (unsigned int i = 0; i < stripsActual; ++i)
                        usedBytes = std::max(usedBytes, stripOffs_h[i] + stripSize_h[i]);

                    stripData_h.resize((size_t)usedBytes);
                    ck(cudaMemcpy(stripData_h.data(), stripData_d, usedBytes, cudaMemcpyDeviceToHost),
                        "D2H stripData");
                    LOGI("[nvTIFF] usedBytes=" << usedBytes);
                }

                // 파일 쓰기
                {
                    unsigned short bitsPerSample[3] = { 8,8,8 };
                    unsigned short sampleFormat = NVTIFF_SAMPLEFORMAT_UINT;

                    int wr = nvTiffWriteFile(
                        outPath.c_str(),
                        VER_REG_TIFF,
                        /*nImages*/      1,
                        /*nrow*/         height,
                        /*ncol*/         width,
                        /*rowsPerStrip*/ rowsPerStrip,
                        /*samples*/      3,
                        bitsPerSample,
                        NVTIFF_PHOTOMETRIC_RGB,
                        NVTIFF_PLANARCONFIG_CONTIG,
                        stripSize_h.data(),
                        stripOffs_h.data(),
                        stripData_h.data(),
                        sampleFormat
                    );
                    if (wr != NVTIFF_WRITE_SUCCESS) {
                        lastErr = std::string("nvTiffWriteFile failed rc=") + std::to_string(wr);
                        LOGW(lastErr);
                        goto FAIL_AND_REDUCE;
                    }
                }

                encoded = true;
                break;

            FAIL_AND_REDUCE:
                if (attempt < kMaxAttempts - 1) {
                    unsigned int next = std::max(1u, rowsPerStrip / 2);
                    LOGW(std::string("[nvTIFF] retry with smaller rowsPerStrip: ")
                        + std::to_string(rowsPerStrip) + " -> " + std::to_string(next));
                    rowsPerStrip = next;
                }
            }

            // 5) 결과 / 정리
            if (!encoded) {
                if (ctx) nvTiffEncodeCtxDestroy(ctx);
                if (stripData_d) cudaFree(stripData_d);
                if (stripSize_d) cudaFree(stripSize_d);
                if (stripOffs_d) cudaFree(stripOffs_d);
                cudaFree(d_img);
                cudaStreamDestroy(stream);
                throw std::runtime_error(std::string("nvTIFF encoding failed after retries: ") + lastErr);
            }

            // 성공 경로 정리
            if (ctx) nvTiffEncodeCtxDestroy(ctx);
            if (stripData_d) cudaFree(stripData_d);
            if (stripSize_d) cudaFree(stripSize_d);
            if (stripOffs_d) cudaFree(stripOffs_d);
            cudaFree(d_img);
            cudaStreamDestroy(stream);

            LOGI_STEP("cleanup done (success)");
            return true;
        }
        catch (const std::exception& ex) {
            LOGE(ex.what());
            return false;
        }
    }
};

namespace conv {
    std::unique_ptr<IEncoder> MakeNvTiffEncoder() {
        return std::make_unique<NvTiffEncoder>();
    }
}
