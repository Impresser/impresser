#include "converter/encoder.hpp"
#include "converter/log.hpp"
#include "converter/types.hpp"

#include <tiffio.h>
#include <vector>
#include <string>
#include <stdexcept>
#include <algorithm>
#include <chrono>

using namespace conv;

// rowsPerStrip 자동 결정
static inline unsigned int snapToPreferred(unsigned int r) {
    static const unsigned int kPrefs[] = { 16, 24, 32 };
    unsigned int best = kPrefs[0];
    unsigned int bestDiff = (r > best ? r - best : best - r);
    for (unsigned int v : kPrefs) {
        unsigned int d = (r > v ? r - v : v - r);
        if (d < bestDiff) { best = v; bestDiff = d; }
    }
    return best;
}

static inline unsigned int pickRowsPerStrip(uint32_t width, uint32_t height) {
    const unsigned int targetStrips = 1000; // 중앙값
    unsigned int rps = (height + targetStrips - 1) / targetStrips;
    if (rps == 0) rps = 1;
    rps = std::max(16u, std::min(64u, rps));
    rps = snapToPreferred(rps);
    return rps;
}

class LibTiffEncoder final : public IEncoder {
public:
    const char* name() const override { return "libTIFF(CPU)"; }

    EncodeResult encode(const ImageInfo& info,
        const std::vector<uint8_t>& rgb,
        const std::string& outPath,
        const TiffOptions& opt) override
    {
        EncodeResult encodeResult{};

        using Clock = std::chrono::steady_clock;
        auto t0 = Clock::now();

        if (info.channels != 3 || info.bitsPerSample != 8)
            throw std::runtime_error("Only RGB24 (3x8bit) supported.");

        const size_t expected = static_cast<size_t>(info.width) * info.height * 3;
        if (rgb.size() != expected)
            throw std::runtime_error("RGB buffer size mismatch.");

        const unsigned int width = (unsigned int)info.width;
        const unsigned int height = (unsigned int)info.height;
        const unsigned int pixelSize = 3;  // RGB24

        unsigned int rowsPerStrip = opt.rowsPerStrip.has_value() && opt.rowsPerStrip.value() > 0
            ? (unsigned int)opt.rowsPerStrip.value()
            : pickRowsPerStrip(info.width, info.height);
        rowsPerStrip = std::max(1u, std::min(rowsPerStrip, height));

        const int maxAttempts = 4;
        bool encoded = false;
        std::string lastErr;

        for (int attempt = 0; attempt < maxAttempts && !encoded; ++attempt) {
            TIFF* tif = TIFFOpen(outPath.c_str(), "w");
            if (!tif) {
                lastErr = "Cannot open TIFF file: " + outPath;
                if (attempt < maxAttempts - 1)
                    rowsPerStrip = std::max(1u, rowsPerStrip / 2);
                continue;
            }

            TIFFSetField(tif, TIFFTAG_IMAGEWIDTH, info.width);
            TIFFSetField(tif, TIFFTAG_IMAGELENGTH, info.height);
            TIFFSetField(tif, TIFFTAG_SAMPLESPERPIXEL, info.channels);
            TIFFSetField(tif, TIFFTAG_BITSPERSAMPLE, info.bitsPerSample);
            TIFFSetField(tif, TIFFTAG_ROWSPERSTRIP, rowsPerStrip);
            TIFFSetField(tif, TIFFTAG_ORIENTATION, ORIENTATION_TOPLEFT);
            TIFFSetField(tif, TIFFTAG_PLANARCONFIG, PLANARCONFIG_CONTIG);
            TIFFSetField(tif, TIFFTAG_PHOTOMETRIC, PHOTOMETRIC_RGB);

            // 압축 설정
            switch (opt.compression) {
            case Compression::LZW:
                TIFFSetField(tif, TIFFTAG_COMPRESSION, COMPRESSION_LZW);
                TIFFSetField(tif, TIFFTAG_PREDICTOR, 2);
                LOGI("[libtiff] Using LZW compression");
                break;
            case Compression::Deflate:
                TIFFSetField(tif, TIFFTAG_COMPRESSION, COMPRESSION_ADOBE_DEFLATE);
                TIFFSetField(tif, TIFFTAG_PREDICTOR, 2);
                LOGI("[libtiff] Using Deflate compression");
                break;
            case Compression::PackBits:
                TIFFSetField(tif, TIFFTAG_COMPRESSION, COMPRESSION_PACKBITS);
                LOGI("[libtiff] Using PackBits compression");
                break;
            case Compression::None:
            default:
                TIFFSetField(tif, TIFFTAG_COMPRESSION, COMPRESSION_NONE);
                LOGI("[libtiff] Using no compression");
                break;
            }

            // 스트립 단위로 쓰기
            tsize_t stripSize = TIFFStripSize(tif);
            tstrip_t numStrips = TIFFNumberOfStrips(tif);
            bool stripError = false;

            for (tstrip_t s = 0; s < numStrips; ++s) {
                size_t offset = static_cast<size_t>(s) * static_cast<size_t>(stripSize);
                size_t size = std::clamp(
                    static_cast<size_t>(expected - offset),
                    static_cast<size_t>(0),
                    static_cast<size_t>(stripSize)
                );

                if (TIFFWriteEncodedStrip(tif, s, (tdata_t)(rgb.data() + offset), size) == -1) {
                    lastErr = "Failed to write strip " + std::to_string(s);
                    stripError = true;
                    break;
                }
            }

            TIFFClose(tif);

            if (stripError) {
                if (attempt < maxAttempts - 1)
                    rowsPerStrip = std::max(1u, rowsPerStrip / 2);
                continue;
            }

            encoded = true;
            break;
        }

        if (!encoded) {
            throw std::runtime_error("libTIFF encoding failed after retries: " + lastErr);
        }

        auto t1 = Clock::now();
        std::chrono::duration<double> dt = t1 - t0;
        const double encodeTimeSec = dt.count();

        // 평균 속도 계산 (RGB24 입력 바이트 / 인코딩 시간)
        const size_t inputBytes =
            static_cast<size_t>(info.width) *
            static_cast<size_t>(info.height) * 3ull;
        const double mb = static_cast<double>(inputBytes) / (1024.0 * 1024.0);
        const double avgMBps = (encodeTimeSec > 0.0) ? (mb / encodeTimeSec) : 0.0;

        encodeResult.speed.avgMBps = avgMBps;
        encodeResult.speed.minMBps = avgMBps;
        encodeResult.speed.maxMBps = avgMBps;

        return encodeResult;
    }
};

namespace conv {
    std::unique_ptr<IEncoder> MakeLibTiffEncoder() {
        return std::make_unique<LibTiffEncoder>();
    }
}
