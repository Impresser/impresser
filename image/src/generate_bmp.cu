#include "converter/generate_bmp.hpp"
#include "converter/http_io.hpp"
#include "converter/log.hpp"
#include "converter/stopwatch.hpp"

#include "../vendor/json.hpp"
#include <cuda_runtime.h>

#include <filesystem>
#include <thread>
#include <fstream>
#include <algorithm>

using namespace conv;
using json = nlohmann::json;

namespace {
    std::queue<GenerateJob> g_queue;
    std::mutex g_mtx;
    std::condition_variable g_cv;
    std::atomic<bool> g_shutdown{ false };
}

struct Pattern {
    int bw, bh;
    int nx, ny;
    int sx, sy;
    int ox, oy;
    int px, py;
    bool enabled;
};

__device__ bool inChannelBlockDevice(const Pattern& p, int x, int y) {
    if (!p.enabled) return false;
    if (x < p.ox || y < p.oy) return false;
    if (p.px <= 0 || p.py <= 0) return false;

    int lx = x - p.ox;
    int ly = y - p.oy;

    int rx = lx % p.px;
    if (rx < 0) rx += p.px;
    int ry = ly % p.py;
    if (ry < 0) ry += p.py;

    return (rx < p.bw) && (ry < p.bh);
}

__global__ void fillPixelsKernel(
    unsigned char* d_pixels, int width, int height, size_t rowSize,
    Pattern R, Pattern G, Pattern B
) {
    int x = blockIdx.x * blockDim.x + threadIdx.x;
    int y = blockIdx.y * blockDim.y + threadIdx.y;
    if (x >= width || y >= height) return;

    int r = 0, g = 0, b = 0;
    if (inChannelBlockDevice(R, x, y)) r = 255;
    if (inChannelBlockDevice(G, x, y)) g = 255;
    if (inChannelBlockDevice(B, x, y)) b = 255;

    size_t offset = (size_t)y * rowSize + (size_t)x * 3;
    d_pixels[offset + 0] = (unsigned char)b;
    d_pixels[offset + 1] = (unsigned char)g;
    d_pixels[offset + 2] = (unsigned char)r;
}

struct CellPattern {
    Pattern R;
    Pattern G;
    Pattern B;

    int rgGapX;
    int rgGapY;
    int gbGapX;
    int gbGapY;

    int cellWidth;
    int cellHeight;

    int gridCols;
    int gridRows;

    int interGapX;
    int interGapY;
};


__device__ int inChannelCell(const CellPattern& c, int x, int y)
{
    int wR = c.R.bw, hR = c.R.bh;
    int wG = c.G.bw, hG = c.G.bh;
    int wB = c.B.bw, hB = c.B.bh;

    int rY = 0;
    int gY = c.rgGapY;
    int bY = c.rgGapY + c.gbGapY;

    int minY = rY;
    if (gY < minY) minY = gY;
    if (bY < minY) minY = bY;

    rY -= minY;
    gY -= minY;
    bY -= minY;

    int xR = 0;

    int xG = xR + wR + c.rgGapX;
    int xB = xG + wG + c.gbGapX;

    if (x >= xR && x < xR + wR &&
        y >= rY && y < rY + hR)
        return 1;

    if (x >= xG && x < xG + wG &&
        y >= gY && y < gY + hG)
        return 2;

    if (x >= xB && x < xB + wB &&
        y >= bY && y < bY + hB)
        return 3;

    return 0;
}

__global__ void fillCellPatternKernel(
    unsigned char* d_pixels,
    int width, int height,
    size_t rowSize,
    CellPattern cell)
{
    int x = blockIdx.x * blockDim.x + threadIdx.x;
    int y = blockIdx.y * blockDim.y + threadIdx.y;
    if (x >= width || y >= height) return;

    int yFlip = height - 1 - y;

    int cellW = cell.cellWidth + cell.interGapX;
    int cellH = cell.cellHeight + cell.interGapY;

    int col = x / cellW;
    int row = yFlip / cellH;

    if (col >= cell.gridCols || row >= cell.gridRows)
    {
        return;
    }

    int localX = x % cellW;
    int localY = yFlip % cellH;

    if (localX >= cell.cellWidth || localY >= cell.cellHeight)
        return;

    bool enableR = (col < cell.R.nx) && (row < cell.R.ny) && cell.R.enabled;
    bool enableG = (col < cell.G.nx) && (row < cell.G.ny) && cell.G.enabled;
    bool enableB = (col < cell.B.nx) && (row < cell.B.ny) && cell.B.enabled;

    int type = inChannelCell(cell, localX, localY);

    unsigned char R = 0, G = 0, B = 0;
    if (type == 1 && enableR) R = 255;
    if (type == 2 && enableG) G = 255;
    if (type == 3 && enableB) B = 255;

    size_t off = (size_t)y * rowSize + (size_t)x * 3;
    d_pixels[off + 0] = B;
    d_pixels[off + 1] = G;
    d_pixels[off + 2] = R;
}

static inline uint64_t rowSizePadded(int width) {
    uint64_t row = (uint64_t)width * 3ull;
    return (row + 3ull) & ~3ull;
}

static void checkCuda(cudaError_t err, const char* msg) {
    if (err != cudaSuccess) {
        throw std::runtime_error(std::string("[CUDA] ") + msg + ": " + cudaGetErrorString(err));
    }
}

static void generate_worker_loop() {
    const char* CB = std::getenv("CALLBACK_BASE_URL");
    const std::string callbackBase = CB ? std::string(CB) : std::string();
    auto io = MakeHttpIO();

    while (!g_shutdown.load()) {
        GenerateJob job;
        {
            std::unique_lock<std::mutex> lk(g_mtx);
            g_cv.wait(lk, [] { return g_shutdown.load() || !g_queue.empty(); });
            if (g_shutdown.load() && g_queue.empty()) return;
            job = std::move(g_queue.front());
            g_queue.pop();
        }

        Stopwatch sw;
        std::string errMsg;

        try {
            const uint32_t width = job.bmpWidth;
            const uint32_t height = job.bmpHeight;
            const size_t rowSize = (size_t)rowSizePadded(width);
            const size_t dataSize = rowSize * height;

            CellPattern cell;

            cell.R = {
                job.redSizeX, job.redSizeY,
                job.redCountX, job.redCountY,
                job.redGapX, job.redGapY,
                0, 0,
                job.redSizeX + job.redGapX, job.redSizeY + job.redGapY,
                true
            };

            cell.G = {
                job.greenSizeX, job.greenSizeY,
                job.greenCountX, job.greenCountY,
                job.greenGapX, job.greenGapY,
                job.rgGapX, job.rgGapY,
                job.greenSizeX + job.greenGapX, job.greenSizeY + job.greenGapY,
                true
            };

            cell.B = {
                job.blueSizeX, job.blueSizeY,
                job.blueCountX, job.blueCountY,
                job.blueGapX, job.blueGapY,
                job.gbGapX, job.gbGapY,
                job.blueSizeX + job.blueGapX, job.blueSizeY + job.blueGapY,
                true
            };

            cell.rgGapX = job.rgGapX;
            cell.rgGapY = job.rgGapY;
            cell.gbGapX = job.gbGapX;
            cell.gbGapY = job.gbGapY;

            cell.gridCols = std::max({ job.redCountX, job.greenCountX, job.blueCountX });
            cell.gridRows = std::max({ job.redCountY, job.greenCountY, job.blueCountY });

            int hR = job.redSizeY;
            int hG = job.greenSizeY + abs(job.rgGapY);
            int hB = job.blueSizeY + abs(job.rgGapY + job.gbGapY);

            cell.cellHeight = max(max(hR, hG), hB);

            cell.cellWidth =
                job.redSizeX + job.rgGapX + job.greenSizeX + job.gbGapX + job.blueSizeX;

            cell.gridCols = std::max({ job.redCountX, job.greenCountX, job.blueCountX });
            cell.gridRows = std::max({ job.redCountY, job.greenCountY, job.blueCountY });

            cell.interGapX = std::max({ job.redGapX, job.greenGapX, job.blueGapX });
            cell.interGapY = std::max({ job.redGapY, job.greenGapY, job.blueGapY });

            unsigned char* d_pixels = nullptr;
            checkCuda(cudaMalloc(&d_pixels, dataSize), "cudaMalloc pixels");

            dim3 block(32, 8);
            dim3 grid((width + block.x - 1) / block.x, (height + block.y - 1) / block.y);

            fillCellPatternKernel << <grid, block >> > (
                d_pixels,
                width,
                height,
                rowSize,
                cell
                );
            checkCuda(cudaGetLastError(), "kernel launch");
            checkCuda(cudaDeviceSynchronize(), "sync");

            unsigned char* h_pixels = nullptr;
            checkCuda(cudaMallocHost(&h_pixels, dataSize), "cudaMallocHost");
            checkCuda(cudaMemcpy(h_pixels, d_pixels, dataSize, cudaMemcpyDeviceToHost), "memcpy");
            cudaFree(d_pixels);

            const auto bmpPath = std::filesystem::temp_directory_path() / (job.generationUuid + "_gpu.bmp");
            {
                std::ofstream f(bmpPath, std::ios::binary);
                if (!f) throw std::runtime_error("failed to open bmp file");

                uint32_t fileSize = 54 + (uint32_t)dataSize;
                f.put('B'); f.put('M');
                f.write((char*)&fileSize, 4);
                uint32_t reserved = 0, offset = 54;
                f.write((char*)&reserved, 4);
                f.write((char*)&offset, 4);
                uint32_t headerSize = 40;
                f.write((char*)&headerSize, 4);
                int32_t signedHeight = ((int32_t)height);
                f.write((char*)&width, 4);
                f.write((char*)&signedHeight, 4);
                uint16_t planes = 1, bits = 24;
                f.write((char*)&planes, 2);
                f.write((char*)&bits, 2);
                uint32_t comp = 0, imageSize = (uint32_t)dataSize;
                f.write((char*)&comp, 4);
                f.write((char*)&imageSize, 4);
                uint32_t ppm = 2835;
                f.write((char*)&ppm, 4);
                f.write((char*)&ppm, 4);
                uint32_t clrUsed = 0, clrImp = 0;
                f.write((char*)&clrUsed, 4);
                f.write((char*)&clrImp, 4);
                f.write((char*)h_pixels, dataSize);
            }
            cudaFreeHost(h_pixels);

            uint64_t bmpVolume = std::filesystem::file_size(bmpPath);

            if (!job.partUploadUrls.empty()) {
                std::vector<std::pair<int, std::string>> parts;
                if (!io->uploadFileWithMultipartUrls(bmpPath.string(), job.partUploadUrls, parts)) {
                    throw std::runtime_error("multipart upload failed");
                }

                nlohmann::json partArray = nlohmann::json::array();
                for (auto& p : parts) partArray.push_back({ {"partNumber", p.first}, {"eTag", p.second} });

                nlohmann::json body = {
                    {"uploadId",   job.uploadId},
                    {"objectName", job.objectName},
                    {"parts",      partArray}
                };

                std::vector<std::pair<std::string, std::string>> headers;
                headers.emplace_back("Content-Type", "application/json");
                if (!job.authScheme.empty() && !job.accessToken.empty())
                    headers.emplace_back("Authorization", job.authScheme + " " + job.accessToken);

                const char* BACKEND_BASE = std::getenv("CALLBACK_BASE_URL");
                if (!BACKEND_BASE) throw std::runtime_error("CALLBACK_BASE_URL not set");
                std::string completeUrl = std::string(BACKEND_BASE) + "/s3/complete";

                int httpCode = 0;
                std::string resp;
                if (!io->postJson(completeUrl, body.dump(), headers, &httpCode, &resp) || httpCode >= 300) {
                    throw std::runtime_error("multipart complete failed");
                }
            }
            else {
                if (!io->uploadFromFileParallel(bmpPath.string(), job.outputUrl, 5)) {
                    throw std::runtime_error("upload failed");
                }
            }

            if (!callbackBase.empty()) {
                std::vector<std::pair<std::string, std::string>> headers;
                if (!job.authScheme.empty() && !job.accessToken.empty())
                    headers.emplace_back("Authorization", job.authScheme + " " + job.accessToken);

                json body = {
                    {"isSuccess", true},
                    {"errorMessage", nullptr},
                    {"generationUuid", job.generationUuid},
                    {"bmpVolume", bmpVolume}
                };

                const std::string cb = callbackBase + "/bmp/" + job.generationUuid + "/complete";
                int code = 0;
                std::string resp;
                io->postJson(cb, body.dump(), headers, &code, &resp);
            }

            LOGI("[generate] done " << job.generationUuid
                << " bmp=" << bmpPath
                << " cols=" << cell.gridCols
                << " rows=" << cell.gridRows);

            std::filesystem::remove(bmpPath);
            cudaDeviceSynchronize();
        }
        catch (const std::exception& ex) {
            errMsg = ex.what();

            cudaGetLastError();

            if (!callbackBase.empty()) {
                std::vector<std::pair<std::string, std::string>> headers;
                if (!job.authScheme.empty() && !job.accessToken.empty())
                    headers.emplace_back("Authorization", job.authScheme + " " + job.accessToken);

                json failBody = {
                    {"isSuccess", false},
                    {"errorMessage", errMsg},
                    {"generationUuid", job.generationUuid}
                };
                const std::string cb = callbackBase + "/bmp/" + job.generationUuid + "/complete";
                int code = 0;
                std::string resp;
                io->postJson(cb, failBody.dump(), headers, &code, &resp);
            }
        }
    }
}

void conv::enqueueGenerateJob(GenerateJob&& job) {
    std::lock_guard<std::mutex> lk(g_mtx);
    g_queue.push(std::move(job));
    g_cv.notify_one();
}

void conv::startGenerateWorkers(int count) {
    for (int i = 0; i < count; ++i)
        std::thread(generate_worker_loop).detach();
}

void conv::stopGenerateWorkers() {
    g_shutdown.store(true);
    g_cv.notify_all();
}
