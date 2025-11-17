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
#include <memory>
#include <cuda_runtime.h>

using namespace conv;
using json = nlohmann::json;

static std::unique_ptr<ConvertWorker> g_amqpWorker;

static int runServer(int port) {
    g_amqpWorker = std::make_unique<ConvertWorker>();
    g_amqpWorker->start();
    conv::startGenerateWorkers(1);

    httplib::Server svr;

    svr.Get("/healthz", [](const httplib::Request&, httplib::Response& res) {
        res.set_content("ok", "text/plain");
        });

    svr.Post("/generate", [](const httplib::Request& req, httplib::Response& res) {
        try {
            json j = json::parse(req.body);

            conv::GenerateJob job;
            // 멀티파트 업로드
            if (j.contains("partUploadUrls")) {
                job.partUploadUrls = j.at("partUploadUrls").get<std::vector<std::string>>();
                job.uploadId = j.at("uploadId").get<std::string>();
                job.objectName = j.at("objectName").get<std::string>();
            }

            // 단일 업로드
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

            LOGI("[generate] accepted job uuid=" << job.generationUuid
                << " bmp=" << job.bmpWidth << "x" << job.bmpHeight
                << " volume=" << job.bmpVolume
                << " parts=" << job.partUploadUrls.size()
                << (job.outputUrl.empty() ? " (multipart)" : " (single)"));

            conv::enqueueGenerateJob(std::move(job));

            json ack = {
                {"ok", true},
                {"status", "ACCEPTED"},
                {"generationUuid", j.at("generationUuid").get<std::string>()}
            };
            res.status = 202;
            res.set_content(ack.dump(), "application/json");
        }
        catch (const std::exception& ex) {
            LOGE("[generate] parse/handle error: " << ex.what());
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

    int port = 8080;
    if (argc >= 2) {
        try {
            port = std::stoi(argv[1]);
        }
        catch (...) {
            LOGW("invalid port argument, fallback to 8080");
        }
    }

    return runServer(port);
}
