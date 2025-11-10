#include "converter/encoder.hpp"
#include "converter/log.hpp"

using namespace conv;

class LibTiffEncoder : public IEncoder {
public:
    const char* name() const override { return "libTIFF"; }
    bool encode(const ImageInfo&, const std::vector<uint8_t>&,
        const std::string&, const TiffOptions&) override {
        LOGW("libTIFF encoder not implemented (stub).");
        return false;
    }
};

std::unique_ptr<IEncoder> MakeLibTiffEncoder() {
    return std::make_unique<LibTiffEncoder>();
}
