#pragma once
#include <string>
#include <vector>
#include <optional>
#include <memory>

namespace conv {
    struct HttpRange { size_t offset; size_t length; };

    class IHttpIO {
    public:
        virtual ~IHttpIO() = default;
        virtual bool downloadToFile(const std::string& url, const std::string& localPath) = 0;
        virtual bool uploadFromFile(const std::string& localPath, const std::string& url) = 0;
        virtual bool uploadFromFileParallel(const std::string& filePath,
            const std::string& presignedUrl,
            int threadCount = 4) {
            return false;
        }
        virtual std::optional<std::vector<uint8_t>> getRange(const std::string& url, HttpRange r) = 0;
        virtual bool postJson(
            const std::string& url,
            const std::string& jsonBody,
            const std::vector<std::pair<std::string, std::string>>& headers,
            int* httpStatus,
            std::string* responseBody
        ) = 0;
        virtual bool putBinaryWithRespHeaders(const std::string& url,
            const char* data, size_t size,
            int* httpCode,
            std::string* respBody,
            std::vector<std::pair<std::string, std::string>>* respHeaders) = 0;
        virtual bool uploadFileWithMultipartUrls(
            const std::string& filePath,
            const std::vector<std::string>& partUploadUrls,
            std::vector<std::pair<int, std::string>>& outParts
        ) {
            return false;
        }
    };

    std::unique_ptr<IHttpIO> MakeHttpIO();
}
