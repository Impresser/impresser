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
        virtual std::optional<std::vector<uint8_t>> getRange(const std::string& url, HttpRange r) = 0;
        virtual bool postJson(
            const std::string& url,
            const std::string& jsonBody,
            const std::vector<std::pair<std::string, std::string>>& headers,
            int* httpStatus,
            std::string* responseBody
        ) = 0;
    };

    std::unique_ptr<IHttpIO> MakeHttpIO();
}
