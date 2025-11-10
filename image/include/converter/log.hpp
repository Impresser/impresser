#pragma once
#include <iostream>

#define LOGI(x) do { std::cout  << "[INFO] "  << x << std::endl; } while(0)
#define LOGW(x) do { std::cout  << "[WARN] "  << x << std::endl; } while(0)
#define LOGE(x) do { std::cerr  << "[ERROR] " << x << std::endl; } while(0)
