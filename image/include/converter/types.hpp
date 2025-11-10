#pragma once
#include <cstdint>
#include <optional>
#include <string>

namespace conv {

    enum class Compression {
        None,
        LZW,
        Deflate,
        Packbits
    };

    struct TiffOptions {
        Compression  compression{ Compression::None };
        bool         bigtiff{ false };
        uint32_t     tileSize{ 0 };
        std::optional<uint32_t> rowsPerStrip;
    };

    struct ImageInfo {
        int32_t  width{ 0 };
        int32_t  height{ 0 };
        int32_t  channels{ 3 };
        int32_t  bitsPerSample{ 8 };
    };

    struct ConvertRequest {
        std::string inputPath;
        std::string outputPath;
        TiffOptions options;
    };

}
