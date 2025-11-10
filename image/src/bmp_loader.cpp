#include "converter/bmp_loader.hpp"
#include "converter/log.hpp"
#include <cstdio>
#include <vector>
#include <cstring>
#include <stdexcept>

#pragma pack(push,1)
struct BMPHeader {
    uint16_t bfType;
    uint32_t bfSize;
    uint16_t bfReserved1;
    uint16_t bfReserved2;
    uint32_t bfOffBits;
};

struct BMPInfoHeader {
    uint32_t biSize;
    int32_t  biWidth;
    int32_t  biHeight;
    uint16_t biPlanes;
    uint16_t biBitCount;
    uint32_t biCompression;
    uint32_t biSizeImage;
    int32_t  biXPelsPerMeter;
    int32_t  biYPelsPerMeter;
    uint32_t biClrUsed;
    uint32_t biClrImportant;
};
#pragma pack(pop)

namespace conv {

    bool LoadBmp24ToRGB(const std::string& path, ImageInfo& info, std::vector<uint8_t>& rgb) {
        FILE* fp = fopen(path.c_str(), "rb");
        if (!fp) { LOGE("Open failed: " << path); return false; }

        BMPHeader bh{};
        if (fread(&bh, sizeof(bh), 1, fp) != 1 || bh.bfType != 0x4D42) {
            LOGE("Not a BMP file");
            fclose(fp);
            return false;
        }
        BMPInfoHeader ih{};
        if (fread(&ih, sizeof(ih), 1, fp) != 1) { fclose(fp); return false; }

        if (ih.biBitCount != 24 || ih.biCompression != 0) {
            LOGE("Only 24-bit uncompressed BMP supported");
            fclose(fp);
            return false;
        }

        const int w = ih.biWidth;
        const int h = (ih.biHeight > 0 ? ih.biHeight : -ih.biHeight);
        const bool bottomUp = (ih.biHeight > 0);

        const int rowStride = ((w * 3 + 3) & ~3);
        std::vector<unsigned char> raw(static_cast<size_t>(rowStride) * h);

        fseek(fp, static_cast<long>(bh.bfOffBits), SEEK_SET);
        if (fread(raw.data(), 1, raw.size(), fp) != raw.size()) {
            LOGE("Read pixel data failed");
            fclose(fp);
            return false;
        }
        fclose(fp);

        rgb.resize(static_cast<size_t>(w) * h * 3);

        for (int y = 0; y < h; ++y) {
            int srcY = bottomUp ? (h - 1 - y) : y;
            const unsigned char* src = raw.data() + static_cast<size_t>(srcY) * rowStride;
            unsigned char* dst = rgb.data() + static_cast<size_t>(y) * w * 3;
            // BGR -> RGB
            for (int x = 0; x < w; ++x) {
                dst[x * 3 + 0] = src[x * 3 + 2];
                dst[x * 3 + 1] = src[x * 3 + 1];
                dst[x * 3 + 2] = src[x * 3 + 0];
            }
        }

        info.width = w;
        info.height = h;
        info.channels = 3;
        info.bitsPerSample = 8;
        return true;
    }

}
