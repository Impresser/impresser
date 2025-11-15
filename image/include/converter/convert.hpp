#pragma once

#include <string>
#include <vector>
#include <thread>
#include <atomic>
#include <SimpleAmqpClient/SimpleAmqpClient.h>

#include "converter/types.hpp"

namespace conv {

    struct ImageInfo;
    struct EncodeResult;

}

class ConvertWorker {
public:
    ConvertWorker();
    ~ConvertWorker();

    void start();
    void stop();

private:
    void consumeQueue(
        const std::string& queueName,
        const std::string& exchangeName,
        const std::string& bindingKey);
    void processMessage(const std::string& body);
    void sendCallback(
        const std::string& convertUuid,
        const std::string& authScheme,
        const std::string& accessToken,
        double encodeSec,
        std::uintmax_t tiffVolume,
        const conv::ImageInfo& info,
        const conv::EncodeResult& encodeResult);

private:
    std::string host_;
    int port_;
    std::string username_;
    std::string password_;
    std::atomic<bool> running_;
    std::vector<std::thread> workers_;
};
