#include "converter/bmp_loader.hpp"
#include "converter/encoder_factory.hpp"
#include "converter/stopwatch.hpp"
#include "converter/log.hpp"
#include "converter/http_io.hpp"
#include "converter/generate_bmp.hpp"

#include "../vendor/httplib.h"
#include "../vendor/json.hpp"

#include <iostream>
#include <string>
#include <vector>
#include <filesystem>
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
using Clock = std::chrono::steady_clock;

struct ConvertJob {
    std::string inputUrl;
    std::string outputUrl;
    std::string compressionType;
    std::string processingUnit;
    uint32_t    rowsPerStrip = 0;
    bool        bigtiff = false;

    std::string convertUuid;

    std::string authScheme;
    std::string accessToken;

    Clock::time_point enqueuedAt = Clock::now();
};

namespace {
    std::queue<ConvertJob> g_queue;
    std::mutex g_mtx;
    std::condition_variable g_cv;
    std::atomic<bool> g_shutdown{ false };

    bool pop_job(ConvertJob& out) {
        std::unique_lock<std::mutex> lk(g_mtx);
        g_cv.wait(lk, [] { return g_shutdown.load() || !g_queue.empty(); });
        if (g_shutdown.load() && g_queue.empty()) return false;
        out = std::move(g_queue.front());
        g_queue.pop();
        return true;
    }

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

static Compression parseComp(const std::string& s);

void worker_loop() {
    const char* CB = std::getenv("CALLBACK_BASE_URL");
    if (!CB) {
        LOGW("CALLBACK_BASE_URL not set; worker cannot callback.");
    }
    const std::string callbackBase = CB ? std::string(CB) : std::string();

    auto io = MakeHttpIO();

    while (!g_shutdown.load()) {
        ConvertJob job;
        if (!pop_job(job)) break;

        // 고유 임시 경로
        const std::filesystem::path inPath = std::filesystem::temp_directory_path() / (job.convertUuid + "_in.bmp");
        const std::filesystem::path outPath = std::filesystem::temp_directory_path() / (job.convertUuid + "_out.tiff");

        std::vector<std::pair<std::string, std::string>> headers;
        if (!job.authScheme.empty() && !job.accessToken.empty()) {
            headers.emplace_back("Authorization", job.authScheme + " " + job.accessToken);
        }

        Stopwatch totalSw;
        double encodeSec = 0.0;
        std::string errMsg;
        ImageInfo info{};

        try {
            job.processingUnit = to_upper(job.processingUnit);

            // 1) 다운로드
            if (!io->downloadToFile(job.inputUrl, inPath.string())) {
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
            creq.options.compression = parseComp(job.compressionType);
            if (job.rowsPerStrip > 0) creq.options.rowsPerStrip = job.rowsPerStrip;
            creq.options.bigtiff = job.bigtiff;

            std::unique_ptr<IEncoder> enc;
            if (job.processingUnit == "GPU") {
                enc = EncoderFactory::createNvTiffEncoder();
            }
            else if (job.processingUnit == "CPU") {
                enc = EncoderFactory::createLibTiffEncoder();
            }
            else {
                throw std::runtime_error("Invalid processingUnit: " + job.processingUnit);
            }

            Stopwatch encSw;
            EncodeResult encodeResult = enc->encode(info, rgb, creq.outputPath, creq.options);
            encodeSec = encSw.elapsed();
            LOGI("[encode] finished in " << encodeSec << "s");

            // 4) 업로드
            if (!io->uploadFromFile(outPath.string(), job.outputUrl)) {
                throw std::runtime_error("upload failed");
            }

            std::uintmax_t tiffVolume = 0;
            tiffVolume = std::filesystem::file_size(outPath);

            // 5) 콜백
            if (!callbackBase.empty()) {
                const std::string callbackUrl = callbackBase + "/convert/" + job.convertUuid + "/complete";
                json body = {
                    {"isSuccess", true},
                    {"message", "압축 변환이 완료되었습니다."},
                    {"compressionTime", encodeSec},
                    {"tiffVolume", tiffVolume},
                    {"tiffWidth",  info.width},
                    {"tiffHeight", info.height},
                    {"avgGpuUtilization", encodeResult.gpu.avgUtil},
                    {"avgSpeed",  encodeResult.speed.avgMBps},
                    {"maxSpeed",  encodeResult.speed.maxMBps},
                    {"minSpeed",  encodeResult.speed.minMBps}
                };
                post_with_backoff(io.get(), callbackUrl, body.dump(), headers);
            }
        }
        catch (const std::exception& ex) {
            errMsg = ex.what();
            LOGE("Job " << job.convertUuid << " failed: " << errMsg);

            if (!callbackBase.empty()) {
                const std::string callbackUrl = callbackBase + "/convert/" + job.convertUuid + "/complete";
                json body = {
                    {"isSuccess", false},
                    {"message", errMsg}
                };
                post_with_backoff(io.get(), callbackUrl, body.dump(), headers);
            }
        }

        // 임시 파일 정리
        std::error_code ec;
        std::filesystem::remove(inPath, ec);
        std::filesystem::remove(outPath, ec);
    }
}

static void printUsage() {
    std::cerr << "Usage:\n"
        << "  image <input.bmp> <output.tiff> <lzw|deflate|packbits|none> [rowsPerStrip]\n"
        << "  image --server [port]\n";
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
    conv::startGenerateWorkers(1);

    httplib::Server svr;

    svr.Get("/healthz", [](const httplib::Request&, httplib::Response& res) {
        res.set_content("ok", "text/plain");
        });

    svr.Post("/convert", [](const httplib::Request& req, httplib::Response& res) {
        try {
            json j = json::parse(req.body);

            ConvertJob job;
            job.inputUrl = j.at("inputUrl").get<std::string>();
            job.outputUrl = j.at("outputUrl").get<std::string>();
            job.compressionType = j.value("compressionType", "lzw");
            job.processingUnit = j.value("processingUnit", "GPU");
            job.rowsPerStrip = j.contains("rowsPerStrip") ? j.at("rowsPerStrip").get<uint32_t>() : 0;
            job.bigtiff = j.value("bigtiff", false);
            job.convertUuid = j.at("convertUuid").get<std::string>();

            if (j.contains("auth")) {
                const auto& a = j.at("auth");
                job.authScheme = a.value("scheme", "");
                job.accessToken = a.value("accessToken", "");
            }

            // 큐 적재
            {
                std::lock_guard<std::mutex> lk(g_mtx);
                g_queue.push(std::move(job));
            }
            g_cv.notify_one();

            // 즉시 202 반환
            json ack = {
                {"ok", true},
                {"status", "ACCEPTED"},
                {"convertUuid", j.at("convertUuid").get<std::string>()}
            };
            res.status = 202;
            res.set_content(ack.dump(), "application/json");
        }
        catch (const std::exception& ex) {
            json er = { {"ok", false}, {"error", ex.what()} };
            res.status = 400;
            res.set_content(er.dump(), "application/json");
        }
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

    std::vector<std::thread> workers;
    const int workerCount = 1;
    for (int i = 0; i < workerCount; ++i) {
        workers.emplace_back(worker_loop);
    }

    LOGI("[server] listening on 0.0.0.0:" << port);
    svr.listen("0.0.0.0", port);

    g_shutdown.store(true);
    g_cv.notify_all();
    for (auto& th : workers) {
        if (th.joinable()) th.join();
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

    if (argc < 4) { printUsage(); return 1; }

    ConvertRequest req{};
    std::string processingUnit = (argc >= 6) ? argv[5] : "GPU";
    req.inputPath = argv[1];
    req.outputPath = argv[2];
    req.options.compression = parseComp(argv[3]);
    if (argc >= 5) req.options.bigtiff = (std::string(argv[4]) == "1");

    if (!fileExists(req.inputPath)) { LOGE("Input not found: " << req.inputPath); return 1; }

    LOGI("Request:");
    LOGI("  input       : " << req.inputPath);
    LOGI("  output      : " << req.outputPath);
    LOGI("  processing unit  : " << processingUnit);
    LOGI("  compression : " << (req.options.compression == Compression::LZW ? "LZW" :
        req.options.compression == Compression::Deflate ? "DEFLATE" :
        req.options.compression == Compression::PackBits ? "PACKBITS" : "NONE"));
    LOGI("  rowsPerStrip: " << (req.options.rowsPerStrip.has_value()
        ? std::to_string(req.options.rowsPerStrip.value())
        : "(none)"));

    ImageInfo info{};
    std::vector<uint8_t> rgb;
    Stopwatch sw;

    if (!LoadBmp24ToRGB(req.inputPath, info, rgb)) { LOGE("BMP load failed"); return 2; }
    double tLoad = sw.elapsed(); LOGI("Loaded: " << info.width << "x" << info.height << " in " << tLoad << "s");

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

    g_shutdown.store(true);
    g_cv.notify_all();

    return 0;
}
