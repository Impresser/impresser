#include "converter/encoder_factory.hpp"
#include "converter/encoder.hpp"
#include <memory>

using namespace conv;

namespace conv { 
    std::unique_ptr<IEncoder> MakeNvTiffEncoder(); 
    std::unique_ptr<IEncoder> MakeLibTiffEncoder();
}

std::unique_ptr<IEncoder> EncoderFactory::createNvTiffEncoder() {
    return MakeNvTiffEncoder();
}

std::unique_ptr<IEncoder> EncoderFactory::createLibTiffEncoder() {
    return MakeLibTiffEncoder();
}
