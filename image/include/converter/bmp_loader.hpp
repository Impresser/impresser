#pragma once
#include "types.hpp"
#include <string>
#include <vector>

namespace conv {
	bool LoadBmp24ToRGB(const std::string& path, ImageInfo& info, std::vector<uint8_t>& rgb);
}
