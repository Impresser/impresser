#pragma once
#include <string>
#include <atomic>
#include <mutex>
#include <condition_variable>
#include <queue>
#include <chrono>
#include <vector>
#include <cstdint>

namespace conv {

    struct GenerateJob {
        std::vector<std::string> partUploadUrls; 
        std::string uploadId;                    
        std::string objectName;                 

        std::string outputUrl;

        std::string generationUuid;

        uint32_t bmpWidth{ 0 };
        uint32_t bmpHeight{ 0 };
        uint64_t bmpVolume{ 0 };

        int redCountX{ 0 }, redCountY{ 0 }, redSizeX{ 0 }, redSizeY{ 0 }, redGapX{ 0 }, redGapY{ 0 };
        int greenCountX{ 0 }, greenCountY{ 0 }, greenSizeX{ 0 }, greenSizeY{ 0 }, greenGapX{ 0 }, greenGapY{ 0 };
        int blueCountX{ 0 }, blueCountY{ 0 }, blueSizeX{ 0 }, blueSizeY{ 0 }, blueGapX{ 0 }, blueGapY{ 0 };
        int rgGapX{ 0 }, rgGapY{ 0 }, gbGapX{ 0 }, gbGapY{ 0 };

        std::string authScheme;
        std::string accessToken;
    };

    void startGenerateWorkers(int count = 1);
    void stopGenerateWorkers();
    void enqueueGenerateJob(GenerateJob&& job);

}

