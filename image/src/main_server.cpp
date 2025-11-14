#include "converter/bmp_loader.hpp"
#include "converter/encoder_factory.hpp"
#include "converter/stopwatch.hpp"
#include "converter/log.hpp"
#include "converter/http_io.hpp"
#include "converter/convert.hpp"
#include "converter/generate_bmp.hpp"

#include "../vendor/httplib.h"
#include "../vendor/json.hpp"

#include <iostream>
#include <string>
#include <vector>
#include <filesystem>
#include <memory>
#include <queue>
#include <mutex>
#include <condition_variable>
#include <thread>
#include <atomic>
#include <chrono>
#include <optional>
#include <cctype>
#include <cmath>
#include <cuda_runtime.h>

using namespace conv;
using json = nlohmann::json;

static std::unique_ptr<ConvertWorker> g_amqpWorker;

namespace {
    std::mutex g_mtx;
    std::condition_variable g_cv;
    std::atomic<bool> g_shutdown{ false };

    bool post_with_backoff(conv::IHttpIO* io,
        const std::string& url,
        const std::string& body,
        const std::vector<std::pair<std::string, std::string>>& headers) {
        int http = 0; std::string resp;
        for (int attempt = 0; attempt < 5; ++attempt) {
            if (io->postJson(url, body, headers, &http, &resp)) return true;
            const int ms = (1 << attempt) * 500;
            std::this_thread::sleep_for(std::chrono::milliseconds(ms));
        }
        LOGW("callback permanently failed");
        return false;
    }

    inline std::string to_upper(std::string s) {
        for (auto& ch : s) ch = static_cast<char>(std::toupper(static_cast<unsigned char>(ch)));
        return s;
    }
}

static Compression parseComp(const std::string& s) {
    if (s == "lzw" || s == "LZW") return Compression::LZW;
    if (s == "deflate" || s == "DEFLATE") return Compression::Deflate;
    if (s == "packbits" || s == "PACKBITS") return Compression::PackBits;
    return Compression::None;
}

static bool fileExists(const std::string& p) {
    std::error_code ec;
    return std::filesystem::exists(p, ec);
}

static int runServer(int port) {
    g_amqpWorker = std::make_unique<ConvertWorker>();
    g_amqpWorker->start();
    conv::startGenerateWorkers(1);

    httplib::Server svr;

    svr.Get("/healthz", [](const httplib::Request&, httplib::Response& res) {
        res.set_content("ok", "text/plain");
        });

    svr.Post("/generate", [](const httplib::Request& req, httplib::Response& res) {
        LOGI("req.body.size=" << req.body.size());
        try {
            json j = json::parse(req.body);
            LOGI("parsed json keys=" << j.size());

            conv::GenerateJob job;
            // 새로운 멀티파트 필드(프론트->백->C++ 경로)
            if (j.contains("partUploadUrls")) {
                job.partUploadUrls = j.at("partUploadUrls").get<std::vector<std::string>>();
                job.uploadId = j.at("uploadId").get<std::string>();
                job.objectName = j.at("objectName").get<std::string>();
            }

            // 구버전 단일 업로드 호환(옵션)
            if (j.contains("outputUrl")) {
                job.outputUrl = j.at("outputUrl").get<std::string>();
            }

            job.generationUuid = j.at("generationUuid").get<std::string>();
            job.bmpWidth = j.at("bmpWidth").get<uint32_t>();
            job.bmpHeight = j.at("bmpHeight").get<uint32_t>();
            job.bmpVolume = j.at("bmpVolume").get<uint64_t>();

            job.redCountX = j.at("redCountX").get<int>();
            job.redCountY = j.at("redCountY").get<int>();
            job.redSizeX = j.at("redSizeX").get<int>();
            job.redSizeY = j.at("redSizeY").get<int>();
            job.redGapX = j.at("redGapX").get<int>();
            job.redGapY = j.at("redGapY").get<int>();

            job.greenCountX = j.at("greenCountX").get<int>();
            job.greenCountY = j.at("greenCountY").get<int>();
            job.greenSizeX = j.at("greenSizeX").get<int>();
            job.greenSizeY = j.at("greenSizeY").get<int>();
            job.greenGapX = j.at("greenGapX").get<int>();
            job.greenGapY = j.at("greenGapY").get<int>();

            job.blueCountX = j.at("blueCountX").get<int>();
            job.blueCountY = j.at("blueCountY").get<int>();
            job.blueSizeX = j.at("blueSizeX").get<int>();
            job.blueSizeY = j.at("blueSizeY").get<int>();
            job.blueGapX = j.at("blueGapX").get<int>();
            job.blueGapY = j.at("blueGapY").get<int>();

            job.rgGapX = j.at("rgGapX").get<int>();
            job.rgGapY = j.at("rgGapY").get<int>();
            job.gbGapX = j.at("gbGapX").get<int>();
            job.gbGapY = j.at("gbGapY").get<int>();

            if (j.contains("auth")) {
                const auto& a = j.at("auth");
                job.authScheme = a.value("scheme", "");
                job.accessToken = a.value("accessToken", "");
            }

            conv::enqueueGenerateJob(std::move(job));

            json ack = { {"ok", true}, {"status", "ACCEPTED"}, {"generationUuid", j.at("generationUuid").get<std::string>()} };
            res.status = 202;
            res.set_content(ack.dump(), "application/json");
        }
        catch (const std::exception& ex) {
            LOGE(" parse/handle error: " << ex.what());
            json er = { {"ok", false}, {"error", ex.what()} };
            res.status = 400;
            res.set_content(er.dump(), "application/json");
        }
        });

    LOGI("[server] listening on 0.0.0.0:" << port);
    svr.listen("0.0.0.0", port);

    if (g_amqpWorker) {
        g_amqpWorker->stop();
        g_amqpWorker.reset();
    }

    return 0;
}

int main(int argc, char* argv[]) {
    cudaSetDevice(0);
    cudaFree(0);
    if (argc >= 2 && std::string(argv[1]) == "--server") {
        int port = 8080;
        if (argc >= 3) port = std::stoi(argv[2]);
        return runServer(port);
    }

    ConvertRequest req{};
    std::string processingUnit = (argc >= 6) ? argv[5] : "GPU";
    req.inputPath = argv[1];
    req.outputPath = argv[2];
    req.options.compression = parseComp(argv[3]);
    if (argc >= 5) req.options.bigtiff = (std::string(argv[4]) == "1");

    if (!fileExists(req.inputPath)) {
        LOGE("Input not found: " << req.inputPath);
        return 1;
    }

    g_amqpWorker = std::make_unique<ConvertWorker>();
    g_amqpWorker->start();

    ImageInfo info{};
    std::vector<uint8_t> rgb;
    Stopwatch sw;

    if (!LoadBmp24ToRGB(req.inputPath, info, rgb)) {
        LOGE("BMP load failed");
        return 2;
    }

    double tLoad = sw.elapsed();
    LOGI("Loaded: " << info.width << "x" << info.height << " in " << tLoad << "s");

    std::unique_ptr<IEncoder> enc;
    if (processingUnit == "GPU") {
        enc = EncoderFactory::createNvTiffEncoder();
    }
    else if (processingUnit == "CPU") {
        enc = EncoderFactory::createLibTiffEncoder();
    }
    else {
        LOGE("Invalid processing unit");
        return 1;
    }

    LOGI("Encoder: " << enc->name());

    sw.reset();
    EncodeResult encodeResult = enc->encode(info, rgb, req.outputPath, req.options);
    double tEnc = sw.elapsed();

    LOGI("Conversion completed successfully: total=" << (tLoad + tEnc)
        << "s (load=" << tLoad << "s, encode=" << tEnc << "s)");

    if (g_amqpWorker) {
        g_amqpWorker->stop();
        g_amqpWorker.reset();
    }

    g_shutdown.store(true);
    g_cv.notify_all();

    return 0;
}
