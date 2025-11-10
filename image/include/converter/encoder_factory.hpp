#pragma once
#include "encoder.hpp"
#include <memory>

namespace conv {
    struct EncoderFactory {
        static std::unique_ptr<IEncoder> createDefault();
    };
}
