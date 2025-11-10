#pragma once
#include <string>

namespace conv {

    class IHmacSigner {
    public:
        virtual ~IHmacSigner() = default;
        virtual std::string sign(const std::string& payload) = 0;
    };

}
