#pragma once
#include "types.hpp"
#include <memory>
#include <string>
#include <vector>

namespace conv {

    struct IEncoder {
        virtual ~IEncoder() = default;
        virtual const char* name() const = 0;
        virtual bool encode(const ImageInfo& info,
            const std::vector<uint8_t>& rgb,
            const std::string& outPath,
            const TiffOptions& opt) = 0;
    };

}
