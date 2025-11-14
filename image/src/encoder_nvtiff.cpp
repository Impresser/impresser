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
#include <nvml.h>
#include <thread>
#include <atomic>

using namespace conv;

struct NvmlSampler {
    std::atomic<bool> running{ false };
    std::thread th;
    std::vector<unsigned> samples;

    ~NvmlSampler() {
        if (running.load()) {
            running.store(false);
            if (th.joinable()) th.join();
            nvmlShutdown();
        }
    }

    bool start(int deviceIndex = 0, int intervalMs = 100) {
        if (running.load()) return true;
        if (nvmlInit_v2() != NVML_SUCCESS) return false;
        nvmlDevice_t dev{};
        if (nvmlDeviceGetHandleByIndex_v2(deviceIndex, &dev) != NVML_SUCCESS) { nvmlShutdown(); return false; }
        running.store(true);
        th = std::thread([this, dev, intervalMs] {
            while (running.load()) {
                nvmlUtilization_t u{};
                if (nvmlDeviceGetUtilizationRates(dev, &u) == NVML_SUCCESS) {
                    samples.push_back((unsigned)u.gpu);
                }
                std::this_thread::sleep_for(std::chrono::milliseconds(intervalMs));
            }
            });
        return true;
    }

    double stopAndAverage() {
        if (running.load()) {
            running.store(false);
            if (th.joinable()) th.join();
            nvmlShutdown();
        }
        if (samples.empty()) return 0.0;
        double sum = 0.0;
        for (auto v : samples) sum += (double)v;
        return sum / (double)samples.size();
    }
};

static inline void ck(cudaError_t e, const char* msg) {
    if (e != cudaSuccess) throw std::runtime_error(std::string(msg) + ": " + cudaGetErrorString(e));
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

    EncodeResult encode(const ImageInfo& info,
        const std::vector<uint8_t>& rgb,
        const std::string& outPath,
        const TiffOptions& opt) override
    {
        nvtiffEncoder_t           encoder = nullptr;
        nvtiffEncodeParams_t      params = nullptr;

        uint8_t* d_img = nullptr;
        bool pinned = false;

        cudaStream_t stream = nullptr;
        cudaEvent_t evStart = nullptr, evStop = nullptr;

        NvmlSampler sampler;

        auto cleanup = [&]() {
            if (params) { nvtiffEncodeParamsDestroy(params, stream); params = nullptr; }
            if (encoder) { nvtiffEncoderDestroy(encoder, stream);     encoder = nullptr; }

            if (d_img) { cudaFree(d_img); d_img = nullptr; }

            if (evStart) { cudaEventDestroy(evStart); evStart = nullptr; }
            if (evStop) { cudaEventDestroy(evStop);  evStop = nullptr; }
            if (stream) { cudaStreamDestroy(stream); stream = nullptr; }

            if (pinned) {
                cudaHostUnregister((void*)rgb.data());
                pinned = false;
            }
            };

        try {
            // 0) 입력 검증
            if (info.channels != 3 || info.bitsPerSample != 8)
                throw std::runtime_error("Only RGB24 (3x8bit) supported.");
            const std::size_t expected = (std::size_t)info.width * (std::size_t)info.height * 3;
            if (rgb.size() != expected)
                throw std::runtime_error("RGB buffer size mismatch.");

            // LZW만 사용 가능
            if (opt.compression != Compression::LZW)
                throw std::runtime_error("nvTIFF path supports only LZW.");

            // 1) CUDA 디바이스 준비 + 스트림
            int devCount = 0;
            ck(cudaGetDeviceCount(&devCount), "cudaGetDeviceCount");
            if (devCount <= 0) throw std::runtime_error("No CUDA device");
            ck(cudaSetDevice(0), "cudaSetDevice(0)");
            ck(cudaFree(0), "cuda warmup");

            ck(cudaStreamCreateWithFlags(&stream, cudaStreamNonBlocking), "cudaStreamCreate");

            // 2) H2D 업로드 (pinned + async)
            ck(cudaMalloc(&d_img, expected), "cudaMalloc(d_img)");
            if (!rgb.empty()) {
                if (cudaHostRegister((void*)rgb.data(), rgb.size(), cudaHostRegisterPortable) == cudaSuccess)
                    pinned = true;
            }
            ck(cudaMemcpyAsync(d_img, rgb.data(), expected, cudaMemcpyHostToDevice, stream), "H2D async");
            ck(cudaStreamSynchronize(stream), "sync after H2D");
            if (pinned) { cudaHostUnregister((void*)rgb.data()); pinned = false; }

            // GPU 성능 측정 시작
            ck(cudaEventCreate(&evStart), "eventCreate start");
            ck(cudaEventCreate(&evStop), "eventCreate stop");
            ck(cudaEventRecord(evStart, stream), "eventRecord start");

            sampler.start(0 /*deviceIndex*/, 100 /*ms*/);

            // 3) rowsPerStrip 계산
            const unsigned int width = (unsigned int)info.width;
            const unsigned int height = (unsigned int)info.height;
            const unsigned int pixelSize = 3;  // RGB24

            unsigned int rowsPerStrip = opt.rowsPerStrip.has_value() && opt.rowsPerStrip.value() > 0
                ? (unsigned int)opt.rowsPerStrip.value()
                : pickRowsPerStrip(info.width, info.height);
            rowsPerStrip = std::max(1u, std::min(rowsPerStrip, height));

            LOGI("[nvTIFF] rowsPerStrip=" << rowsPerStrip);

            // 4) 인코딩: 실패 시 rowsPerStrip을 절반으로 줄이며 재시도
            const int kMaxAttempts = 4;
            bool encoded = false;
            std::string lastErr;

            for (int attempt = 0; attempt < kMaxAttempts && !encoded; ++attempt) {
                // 이전 자원 해제
                if (params) { nvtiffEncodeParamsDestroy(params, stream); params = nullptr; }
                if (encoder) { nvtiffEncoderDestroy(encoder, stream);     encoder = nullptr; }

                // 컨텍스트 & 파라미터 생성
                auto st = nvtiffEncoderCreate(&encoder, nullptr, nullptr, stream);
                bool failed = false;

                if (st != NVTIFF_STATUS_SUCCESS) {
                    lastErr = "nvtiffEncoderCreate failed";
                    failed = true;
                }

                if (!failed) {
                    st = nvtiffEncodeParamsCreate(&params);
                    if (st != NVTIFF_STATUS_SUCCESS) {
                        lastErr = "nvtiffEncodeParamsCreate failed";
                        failed = true;
                    }
                }

                nvtiffImageInfo_t img{};
                nvtiffImageGeometry_t geom{};
                unsigned char* images_d[1] = { d_img };

                if (!failed) {
                    img.image_width = width;
                    img.image_height = height;
                    img.samples_per_pixel = 3;
                    img.bits_per_sample[0] = 8;
                    img.bits_per_sample[1] = 8;
                    img.bits_per_sample[2] = 8;
                    img.photometric_int = NVTIFF_PHOTOMETRIC_RGB;
                    img.compression = NVTIFF_COMPRESSION_LZW;

                    st = nvtiffEncodeParamsSetImageInfo(params, &img);
                    if (st != NVTIFF_STATUS_SUCCESS) { lastErr = "nvtiffEncodeParamsSetImageInfo failed"; failed = true; }
                }

                if (!failed) {
                    geom.strile_height = rowsPerStrip;
                    st = nvtiffEncodeParamsSetImageGeometry(params, &geom);
                    if (st != NVTIFF_STATUS_SUCCESS) { lastErr = "nvtiffEncodeParamsSetImageGeometry failed"; failed = true; }
                }

                if (!failed) {
                    st = nvtiffEncodeParamsSetInputs(params, images_d, 1);
                    if (st != NVTIFF_STATUS_SUCCESS) { lastErr = "nvtiffEncodeParamsSetInputs failed"; failed = true; }
                }

                if (!failed) {
                    st = nvtiffEncode(encoder, &params, 1, stream);
                    if (st != NVTIFF_STATUS_SUCCESS) { lastErr = "nvtiffEncode failed"; failed = true; }
                }

                if (!failed) {
                    st = nvtiffEncodeFinalize(encoder, &params, 1, stream);
                    if (st != NVTIFF_STATUS_SUCCESS) { lastErr = "nvtiffEncodeFinalize failed"; failed = true; }
                    ck(cudaStreamSynchronize(stream), "sync after finalize");
                }

                if (!failed) {
                    st = nvtiffWriteTiffFile(encoder, &params, 1, outPath.c_str(), stream);
                    if (st != NVTIFF_STATUS_SUCCESS) { lastErr = "nvtiffWriteTiffFile failed"; failed = true; }
                }

                if (!failed) {
                    encoded = true;
                    break;
                }

                if (attempt < kMaxAttempts - 1) {
                    unsigned int next = std::max(1u, rowsPerStrip / 2);
                    LOGW(std::string("[nvTIFF] retry with smaller rowsPerStrip: ")
                        + std::to_string(rowsPerStrip) + " -> " + std::to_string(next));
                    rowsPerStrip = next;
                }
            }

            // 5) 결과 / 정리
            if (!encoded) {
                throw std::runtime_error(std::string("nvTIFF encoding failed after retries: ") + lastErr);
            }

            // GPU 성능 측정 종료
            ck(cudaEventRecord(evStop, stream), "eventRecord stop");
            ck(cudaEventSynchronize(evStop), "eventSync stop");

            // 평균 이용률
            double avgUtil = sampler.stopAndAverage();

            // 평균 속도 계산 (RGB24 입력 바이트 / 인코딩 시간)
            float ms = 0.0f;
            ck(cudaEventElapsedTime(&ms, evStart, evStop), "eventElapsed");
            const double encodeTimeSec = static_cast<double>(ms) / 1000.0;
            const size_t inputBytes = static_cast<size_t>(info.width) * static_cast<size_t>(info.height) * 3ull;
            const double mb = static_cast<double>(inputBytes) / (1024.0 * 1024.0);
            const double avgMBps = (encodeTimeSec > 0.0) ? (mb / encodeTimeSec) : 0.0;

            // 성공 경로 정리
            cleanup();

            EncodeResult encodeResult{};
            encodeResult.gpu.avgUtil = avgUtil;
            encodeResult.speed.avgMBps = avgMBps;
            encodeResult.speed.minMBps = avgMBps;
            encodeResult.speed.maxMBps = avgMBps;

            return encodeResult;
        }
        catch (...) {
            cleanup();
            throw;
        }
    }
};

namespace conv {
    std::unique_ptr<IEncoder> MakeNvTiffEncoder() {
        return std::make_unique<NvTiffEncoder>();
    }
}
