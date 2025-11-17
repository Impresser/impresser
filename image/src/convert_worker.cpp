#include "converter/bmp_loader.hpp"
#include "converter/encoder_factory.hpp"
#include "converter/http_io.hpp"
#include "converter/log.hpp"
#include "converter/convert.hpp"
#include "converter/stopwatch.hpp"
#include "converter/types.hpp"

#include "../vendor/httplib.h"
#include "../vendor/json.hpp"

#include <filesystem>
#include <iostream>
#include <vector>
#include <thread>
#include <atomic>
#include <cctype>

using namespace conv;
using json = nlohmann::json;
using Clock = std::chrono::steady_clock;

ConvertWorker::ConvertWorker() : running_(false) {
    const char* host_env = std::getenv("RABBITMQ_HOST");
    const char* port_env = std::getenv("RABBITMQ_PORT");
    const char* user_env = std::getenv("RABBITMQ_USER");
    const char* password_env = std::getenv("RABBITMQ_PASSWORD");

    host_ = host_env ? host_env : "localhost";
    username_ = user_env ? user_env : "guest";
    password_ = password_env ? password_env : "guest";

    if (port_env) {
        try {
            port_ = std::stoi(port_env);
        }
        catch (...) {
            LOGW("[worker] Invalid RABBITMQ_PORT value, using default 5672");
            port_ = 5672;
        }
    }
    else {
        port_ = 5672;
    }
}

ConvertWorker::~ConvertWorker() {
    stop();
}

void ConvertWorker::start() {
    running_ = true;

    const int shardCount = 32;
    for (int i = 0; i < shardCount; ++i) {
        std::string queueName = "compress.shard." + std::to_string(i);
        std::string exchange = "compress.direct";
        std::string bindingKey = queueName; 

        workers_.emplace_back([this, queueName, exchange, bindingKey]() {
            consumeQueue(queueName, exchange, bindingKey);
            });
    }

    const int inkjetCount = 10; 
    for (int i = 1; i <= inkjetCount; ++i) {
        std::string queueName = "inkjet-" + std::to_string(i) + ".print.q";
        std::string exchange = "print.direct";
        std::string bindingKey = "inkjet-" + std::to_string(i);

        workers_.emplace_back([this, queueName, exchange, bindingKey]() {
            consumeQueue(queueName, exchange, bindingKey);
            });
    }
}

void ConvertWorker::stop() {
    running_ = false;
    for (auto& t : workers_) if (t.joinable()) t.join();
}

void ConvertWorker::consumeQueue(const std::string& queueName,
    const std::string& exchangeName,
    const std::string& bindingKey) {
    while (running_) {
        try {
            auto channel = AmqpClient::Channel::Create(host_, port_, username_, password_);

            channel->DeclareExchange(
                exchangeName,
                AmqpClient::Channel::EXCHANGE_TYPE_DIRECT,
                true
            );

            channel->DeclareQueue(queueName, true, false, false, false);
            channel->BindQueue(queueName, exchangeName, bindingKey);

            std::string consumerTag =
                channel->BasicConsume(queueName, "", false, false, false, {});

            std::cerr << "[worker] start consume queue=" << queueName
                << " exchange=" << exchangeName
                << " bindingKey=" << bindingKey << std::endl;

            while (running_) {
                AmqpClient::Envelope::ptr_t envelope;

                bool got = false;
                try {
                    got = channel->BasicConsumeMessage(consumerTag, envelope, 1);
                }
                catch (const std::exception& ex) {
                    std::cerr << "[worker] BasicConsumeMessage error on queue "
                        << queueName << ": " << ex.what() << std::endl;
                    break;
                }

                if (!got) {
                    continue;
                }

                try {
                    processMessage(envelope->Message()->Body());
                    channel->BasicAck(envelope);
                }
                catch (const std::exception& ex) {
                    std::cerr << "[worker] processMessage error on queue "
                        << queueName << ": " << ex.what() << std::endl;
                    channel->BasicAck(envelope);
                }
            }

            try {
                channel->BasicCancel(consumerTag);
            }
            catch (...) {}
        }
        catch (const std::exception& e) {
            std::cerr << "[worker] Queue " << queueName
                << " error: " << e.what()
                << " (will retry)" << std::endl;
        }

        if (running_) {
            std::this_thread::sleep_for(std::chrono::seconds(3));
        }
    }

    std::cerr << "[worker] consumeQueue stopped for " << queueName << std::endl;
}

std::string to_upper(std::string s) {
    for (auto& ch : s) ch = static_cast<char>(std::toupper(static_cast<unsigned char>(ch)));
    return s;
}

bool post_with_backoff(conv::IHttpIO* io,
    const std::string& url,
    const std::string& body,
    std::vector<std::pair<std::string, std::string>>& headers) {
    int http = 0; std::string resp;
    for (int attempt = 0; attempt < 5; ++attempt) {
        if (io->postJson(url, body, headers, &http, &resp)) return true;
        const int ms = (1 << attempt) * 500;
        std::this_thread::sleep_for(std::chrono::milliseconds(ms));
    }
    LOGW("[worker] callback permanently failed");
    return false;
}

static Compression parseComp(const std::string& s) {
    if (s == "lzw" || s == "LZW") return Compression::LZW;
    if (s == "deflate" || s == "DEFLATE") return Compression::Deflate;
    if (s == "packbits" || s == "PACKBITS") return Compression::PackBits;
    return Compression::None;
}

void ConvertWorker::processMessage(const std::string& body) {
    auto io = conv::MakeHttpIO();
    std::string errMsg;
    try {
        json j = json::parse(body);

        std::string inputUrl = j.at("inputUrl");
        std::string outputUrl = j.at("outputUrl");
        std::string compressionType = j.value("compressionType", "lzw");
        std::string processingUnit = j.value("processingUnit", "GPU");
        int         rowsPerStrip = j.value("rowsPerStrip", 0);
        bool        bigtiff = j.value("bigtiff", false);
        std::string convertUuid = j.at("convertUuid");

        std::string authScheme, accessToken;
        if (j.contains("auth")) {
            authScheme = j["auth"].value("scheme", "");
            accessToken = j["auth"].value("accessToken", "");
        }

        const char* CB = std::getenv("CALLBACK_BASE_URL");
        if (!CB) {
            LOGW("[worker] CALLBACK_BASE_URL not set; worker cannot callback.");
        }
        const std::string callbackBase = CB ? std::string(CB) : std::string();

        const std::filesystem::path inPath = std::filesystem::temp_directory_path() / (convertUuid + "_in.bmp");
        const std::filesystem::path outPath = std::filesystem::temp_directory_path() / (convertUuid + "_out.tiff");

        std::vector<std::pair<std::string, std::string>> headers;
        if (!authScheme.empty() && !accessToken.empty()) {
            headers.emplace_back("Authorization", authScheme + " " + accessToken);
        }

        double encodeSec = 0.0;
        ImageInfo info{};
        EncodeResult encodeResult{};

        try {
            processingUnit = to_upper(processingUnit);

            // 1) 다운로드
            if (!io->downloadToFile(inputUrl, inPath.string())) {
                throw std::runtime_error("download failed");
            }

            // 2) BMP 로드
            std::vector<uint8_t> rgb;
            if (!LoadBmp24ToRGB(inPath.string(), info, rgb)) {
                throw std::runtime_error("BMP load failed");
            }

            // 3) 인코딩
            ConvertRequest creq{};
            creq.inputPath = inPath.string();
            creq.outputPath = outPath.string();
            creq.options.compression = parseComp(compressionType);
            if (rowsPerStrip > 0) creq.options.rowsPerStrip = rowsPerStrip;
            creq.options.bigtiff = bigtiff;

            std::unique_ptr<IEncoder> enc;
            if (processingUnit == "GPU") {
                enc = EncoderFactory::createNvTiffEncoder();
            }
            else if (processingUnit == "CPU") {
                enc = EncoderFactory::createLibTiffEncoder();
            }
            else {
                throw std::runtime_error("Invalid processingUnit: " + processingUnit);
            }

            Stopwatch encSw;
            encodeResult = enc->encode(info, rgb, creq.outputPath, creq.options);
            encodeSec = encSw.elapsed();

            LOGI("[encode] finished in " << encodeSec << "s");

            // 4) 업로드
            if (!io->uploadFromFile(outPath.string(), outputUrl)) {
                throw std::runtime_error("upload failed");
            }

            std::uintmax_t tiffVolume = std::filesystem::file_size(outPath);

            // 임시 파일 삭제
            std::filesystem::remove(inPath);
            std::filesystem::remove(outPath);

            // 5) 콜백 (성공)
            if (!callbackBase.empty()) {
                sendCallback(convertUuid, authScheme, accessToken,
                    encodeSec, tiffVolume, info, encodeResult);
            }
        }
        catch (const std::exception& ex) {
            errMsg = ex.what();
            LOGE("[worker] Job " << convertUuid << " failed: " << ex.what());

            if (!callbackBase.empty()) {
                const std::string callbackUrl = callbackBase + "/convert/" + convertUuid + "/complete";
                json body = {
                    {"isSuccess", false},
                    {"message",   errMsg}
                };
                post_with_backoff(io.get(), callbackUrl, body.dump(), headers);
            }

            // 임시 파일 정리
            std::error_code ec;
            std::filesystem::remove(inPath, ec);
            std::filesystem::remove(outPath, ec);
        }
    }
    catch (const std::exception& ex) {
        LOGE("[worker] Failed to process message: " << ex.what());
    }
}   

void ConvertWorker::sendCallback(
    const std::string& convertUuid,
    const std::string& authScheme,
    const std::string& accessToken,
    double encodeSec,
    std::uintmax_t tiffVolume,
    const ImageInfo& info,
    const EncodeResult& encodeResult) {

    const char* CB = std::getenv("CALLBACK_BASE_URL");
    if (!CB) {
        LOGW("[worker] CALLBACK_BASE_URL not set; worker cannot callback.");
        return;
    }

    const std::string callbackBase = std::string(CB);
    std::string callbackUrl = callbackBase + "/convert/" + convertUuid + "/complete";

    json callback = {
        {"isSuccess", true},
        {"message", "Compression conversion completed successfully."},
        {"compressionTime", encodeSec},
        {"tiffVolume",      tiffVolume},
        {"tiffWidth",       info.width},
        {"tiffHeight",      info.height},
        {"avgGpuUtilization", encodeResult.gpu.avgUtil},
        {"avgSpeed",  encodeResult.speed.avgMBps},
        {"maxSpeed",  encodeResult.speed.maxMBps},
        {"minSpeed",  encodeResult.speed.minMBps}
    };

    auto io = MakeHttpIO();
    std::vector<std::pair<std::string, std::string>> headers;
    if (!authScheme.empty() && !accessToken.empty()) {
        headers.emplace_back("Authorization", authScheme + " " + accessToken);
    }

    post_with_backoff(io.get(), callbackUrl, callback.dump(), headers);
    LOGI("[worker] Callback sent for convertUuid: " << convertUuid);
}
