#include "converter/http_io.hpp"
#include "converter/log.hpp"
#include "converter/stopwatch.hpp"

#include <curl/curl.h>
#include <fcntl.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <unistd.h>

#include <algorithm>
#include <cerrno>
#include <cstdio>
#include <cstring>
#include <filesystem>
#include <fstream>
#include <optional>
#include <string>
#include <system_error>
#include <vector>
#include <thread>
#include <mutex>
#include <atomic>

namespace {
    
    struct CurlGlobalGuard {
        CurlGlobalGuard() {
            curl_global_init(CURL_GLOBAL_DEFAULT);
        }
        ~CurlGlobalGuard() {
            curl_global_cleanup();
        }
    };

    static CurlGlobalGuard g_curl_guard;

    // 간단 URL 검증
    static bool is_http_url(const std::string& u) {
        return (u.rfind("http://", 0) == 0) || (u.rfind("https://", 0) == 0);
    }

    // 공통 CURL 옵션
    static inline void set_common_http_opts(CURL* eh) {
        curl_easy_setopt(eh, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
        curl_easy_setopt(eh, CURLOPT_FOLLOWLOCATION, 1L);
        curl_easy_setopt(eh, CURLOPT_SSL_VERIFYPEER, 1L);
        curl_easy_setopt(eh, CURLOPT_SSL_VERIFYHOST, 2L);
        curl_easy_setopt(eh, CURLOPT_TCP_KEEPALIVE, 1L);
        curl_easy_setopt(eh, CURLOPT_TCP_KEEPIDLE, 30L);
        curl_easy_setopt(eh, CURLOPT_TCP_KEEPINTVL, 15L);
        curl_easy_setopt(eh, CURLOPT_LOW_SPEED_TIME, 30L);
        curl_easy_setopt(eh, CURLOPT_LOW_SPEED_LIMIT, 1024L);
        curl_easy_setopt(eh, CURLOPT_BUFFERSIZE, 512L * 1024L);
        curl_easy_setopt(eh, CURLOPT_DNS_CACHE_TIMEOUT, 60L);
        curl_easy_setopt(eh, CURLOPT_ACCEPT_ENCODING, "identity");
    }

    // URL 로그 마스킹(쿼리 숨김)
    static inline std::string redacted(const std::string& u) {
        auto q = u.find('?');
        return (q == std::string::npos) ? u : u.substr(0, q) + "?…";
    }

    // HEAD 결과 수집
    struct HeadInfo {
        long long content_length{ -1 };
        bool accept_ranges{ false };
    };

    static size_t header_cb(char* buffer, size_t size, size_t nitems, void* userdata) {
        const size_t total = size * nitems;
        auto* hi = reinterpret_cast<HeadInfo*>(userdata);
        std::string line(buffer, total);

        std::string lower = line;
        std::transform(lower.begin(), lower.end(), lower.begin(),
            [](unsigned char c) { return static_cast<char>(std::tolower(c)); });

        if (lower.rfind("content-length:", 0) == 0) {
            const auto pos = line.find(':');
            if (pos != std::string::npos) {
                try { hi->content_length = std::stoll(line.substr(pos + 1)); }
                catch (...) {}
            }
        }
        else if (lower.rfind("accept-ranges:", 0) == 0) {
            if (lower.find("bytes") != std::string::npos) hi->accept_ranges = true;
        }
        return total;
    }

    static bool fetch_head(const std::string& url, HeadInfo& out) {
        CURL* eh = curl_easy_init();
        if (!eh) return false;

        set_common_http_opts(eh);
        curl_easy_setopt(eh, CURLOPT_URL, url.c_str());
        curl_easy_setopt(eh, CURLOPT_NOBODY, 1L);
        curl_easy_setopt(eh, CURLOPT_HEADERFUNCTION, header_cb);
        curl_easy_setopt(eh, CURLOPT_HEADERDATA, &out);

        CURLcode rc = curl_easy_perform(eh);
        long http = 0;
        curl_easy_getinfo(eh, CURLINFO_HTTP_CODE, &http);
        curl_easy_cleanup(eh);
        return (rc == CURLE_OK && http >= 200 && http < 300);
    }

    // pwrite 기반 파트 기록 컨텍스트
    struct PartCtx {
        int fd{ -1 };
        long long base{ 0 };      // 파트 시작 오프셋
        long long written{ 0 };   // 파트 내에서 기록된 바이트
    };

    static size_t write_cb(char* ptr, size_t size, size_t nmemb, void* userdata) {
        const size_t n = size * nmemb;
        auto* pc = reinterpret_cast<PartCtx*>(userdata);
        if (pc->fd < 0) return 0;
        const ssize_t w = ::pwrite(pc->fd, ptr, static_cast<size_t>(n), pc->base + pc->written);
        if (w < 0) return 0;
        pc->written += static_cast<long long>(w);
        return static_cast<size_t>(w);
    }

    // 파일 크기
    static inline long long get_filesize(const std::string& path) {
        std::error_code ec;
        auto sz = std::filesystem::file_size(path, ec);
        return ec ? -1LL : static_cast<long long>(sz);
    }

    // 단일 다운로드
    static bool single_download(const std::string& url, int fd) {
        CURL* eh = curl_easy_init();
        if (!eh) return false;
        PartCtx pc{ fd, 0, 0 };

        set_common_http_opts(eh);
        curl_easy_setopt(eh, CURLOPT_URL, url.c_str());
        curl_easy_setopt(eh, CURLOPT_WRITEFUNCTION, write_cb);
        curl_easy_setopt(eh, CURLOPT_WRITEDATA, &pc);

        CURLcode rc = curl_easy_perform(eh);
        long http = 0;
        curl_easy_getinfo(eh, CURLINFO_HTTP_CODE, &http);
        curl_easy_cleanup(eh);

        if (rc != CURLE_OK || http < 200 || http >= 300) {
            LOGE("[http] GET failed(rc) rc=" << rc << " http=" << http);
            return false;
        }
        return true;
    }

    // 멀티 Range 병렬 다운로드
    static bool parallel_download(const std::string& url, int fd, long long total_bytes) {
        const int max_conn = 2;
        const long long target_chunk = 1024LL << 20;
        int parts = static_cast<int>((total_bytes + target_chunk - 1) / target_chunk);
        parts = std::max(1, std::min(max_conn, parts));
        const long long chunk = (total_bytes + parts - 1) / parts;

        CURLM* multi = curl_multi_init();
        if (!multi) return false;

        std::vector<CURL*> easys;
        std::vector<PartCtx> ctxs(parts);
        easys.reserve(parts);

        for (int i = 0; i < parts; ++i) {
            const long long start = static_cast<long long>(i) * chunk;
            const long long end = std::min<long long>(total_bytes - 1, (static_cast<long long>(i) + 1) * chunk - 1);
            if (start > end) break;

            CURL* eh = curl_easy_init();
            if (!eh) continue;
            ctxs[i] = PartCtx{ fd, start, 0 };

            const std::string range = "bytes=" + std::to_string(start) + "-" + std::to_string(end);

            set_common_http_opts(eh);
            curl_easy_setopt(eh, CURLOPT_URL, url.c_str());
            curl_easy_setopt(eh, CURLOPT_RANGE, range.c_str());
            curl_easy_setopt(eh, CURLOPT_WRITEFUNCTION, write_cb);
            curl_easy_setopt(eh, CURLOPT_WRITEDATA, &ctxs[i]);

            curl_multi_add_handle(multi, eh);
            easys.push_back(eh);
        }

        int running = 0;
        CURLMcode mrc = CURLM_OK;
        do {
            mrc = curl_multi_perform(multi, &running);
            if (mrc == CURLM_OK && running) {
#if LIBCURL_VERSION_NUM >= 0x073400
                curl_multi_poll(multi, nullptr, 0, 1000, nullptr);
#else
                fd_set rd, wr, ex;
                int maxfd = -1;
                struct timeval tv;
                tv.tv_sec = 1; tv.tv_usec = 0;
                FD_ZERO(&rd); FD_ZERO(&wr); FD_ZERO(&ex);
                curl_multi_fdset(multi, &rd, &wr, &ex, &maxfd);
                if (maxfd >= 0) ::select(maxfd + 1, &rd, &wr, &ex, &tv);
                else ::usleep(1000 * 1000);
#endif
            }
        } while (mrc == CURLM_OK && running);

        bool ok = (mrc == CURLM_OK);
        for (auto* eh : easys) {
            long http = 0;
            curl_easy_getinfo(eh, CURLINFO_HTTP_CODE, &http);
            if (!(http == 206 || http == 200)) ok = false;
            curl_multi_remove_handle(multi, eh);
            curl_easy_cleanup(eh);
        }
        curl_multi_cleanup(multi);

        if (!ok) LOGE("[http] parallel download failed");
        return ok;
    }

    static size_t read_mem_cb(char* ptr, size_t size, size_t nmemb, void* userdata) {
        auto* p = reinterpret_cast<std::pair<const char*, size_t>*>(userdata);
        size_t len = std::min(size * nmemb, p->second);
        std::memcpy(ptr, p->first, len);
        p->first += len;
        p->second -= len;
        return len;
    }

    static size_t write_str_cb(char* ptr, size_t size, size_t nmemb, void* userdata) {
        auto* s = reinterpret_cast<std::string*>(userdata);
        s->append(ptr, size * nmemb);
        return size * nmemb;
    }

    static size_t header_collect_cb(char* buffer, size_t size, size_t nitems, void* userdata) {
        const size_t total = size * nitems;
        auto* hdrs = reinterpret_cast<std::vector<std::pair<std::string, std::string>>*>(userdata);
        std::string line(buffer, total);
        auto pos = line.find(':');
        if (pos != std::string::npos) {
            std::string key = line.substr(0, pos);
            std::string val = line.substr(pos + 1);
            hdrs->emplace_back(std::move(key), std::move(val));
        }
        return total;
    }

    // header "ETag" 추출 보조
    static inline std::string to_lower(std::string s) {
        std::transform(s.begin(), s.end(), s.begin(), [](unsigned char c) { return std::tolower(c); });
        return s;
    }

    static inline std::string trim(std::string s) {
        while (!s.empty() && (s.back() == '\r' || s.back() == '\n' || s.back() == ' ' || s.back() == '\t')) s.pop_back();
        size_t i = 0; while (i < s.size() && (s[i] == ' ' || s[i] == '\t')) ++i;
        return s.substr(i);
    }

    static inline std::string unquote(std::string s) {
        s = trim(s);
        if (s.size() >= 2 && ((s.front() == '"' && s.back() == '"') || (s.front() == '\'' && s.back() == '\''))) {
            return s.substr(1, s.size() - 2);
        }
        return s;
    }
    static bool find_header_value(const std::vector<std::pair<std::string, std::string>>& hdrs,
        const std::string& key, std::string& out) {
        const std::string lk = to_lower(key);
        for (auto& kv : hdrs) {
            if (to_lower(kv.first) == lk) { out = trim(kv.second); return true; }
        }
        return false;
    }
}

class LibcurlMultiIO final : public conv::IHttpIO {
public:
    LibcurlMultiIO() = default;
    ~LibcurlMultiIO() override = default;

    bool downloadToFile(const std::string& url, const std::string& localPath) override {
        if (!is_http_url(url)) { LOGE("Bad URL: " << url); return false; }

        Stopwatch dlSw;
        LOGI("[http] GET begin url=" << redacted(url) << " -> " << localPath);

        // 디렉터리 생성
        std::error_code ec;
        std::filesystem::create_directories(std::filesystem::path(localPath).parent_path(), ec);

        const std::string tmp = localPath + ".part";

        // 1) HEAD로 사이즈/범위 확인
        HeadInfo hi{};
        const bool head_ok = fetch_head(url, hi);
        if (!head_ok) {
            LOGW("[http] HEAD failed; fallback to single GET");
        }
        else {
            LOGI("[http] HEAD ok length=" << hi.content_length
                << " accept_ranges=" << (hi.accept_ranges ? "bytes" : "none"));
        }

        // 2) 파일 열기(+ pre-alloc)
        int fd = ::open(tmp.c_str(), O_CREAT | O_TRUNC | O_WRONLY, 0666);
        if (fd < 0) { LOGE("open failed: " << tmp); return false; }

        if (hi.content_length > 0) {
            if (::ftruncate(fd, static_cast<off_t>(hi.content_length)) != 0) {
                LOGW("ftruncate failed; proceed without pre-alloc");
            }
        }

        bool ok = false;
        if (hi.accept_ranges && hi.content_length > 0) {
            LOGI("[http] parallel GET parts for " << redacted(url));
            ok = parallel_download(url, fd, hi.content_length);
        }
        else {
            LOGI("[http] single GET for " << redacted(url));
            ok = single_download(url, fd);
        }

        ::fsync(fd);
        ::close(fd);

        if (!ok) {
            std::remove(tmp.c_str());
            LOGW("[http] GET failed url=" << redacted(url) << " elapsed=" << dlSw.elapsed() << "s");
            return false;
        }

        if (std::rename(tmp.c_str(), localPath.c_str()) != 0) {
            LOGE("rename failed to " << localPath);
            std::remove(tmp.c_str());
            return false;
        }

        const auto finalSize = get_filesize(localPath);
        LOGI("[http] GET done" 
            << " bytes=" << finalSize
            << " elapsed=" << dlSw.elapsed() << "s"
            << " -> " << localPath);

        return true;
    }

    bool uploadFromFile(const std::string& localPath, const std::string& to) override {
        // to가 HTTP/HTTPS면 PUT 업로드, 아니면 로컬 파일 복사
        if (is_http_url(to)) {
            FILE* fp = std::fopen(localPath.c_str(), "rb");
            if (!fp) { LOGE("open failed: " << localPath); return false; }

            const auto size = get_filesize(localPath);
            Stopwatch sw;

            CURL* eh = curl_easy_init();
            if (!eh) { std::fclose(fp); return false; }

            struct curl_slist* hdrs = nullptr;
            hdrs = curl_slist_append(hdrs, "Expect:");
            hdrs = curl_slist_append(hdrs, "Content-Type: image/tiff");

            set_common_http_opts(eh);
            curl_easy_setopt(eh, CURLOPT_URL, to.c_str());
            curl_easy_setopt(eh, CURLOPT_HTTPHEADER, hdrs);
            curl_easy_setopt(eh, CURLOPT_UPLOAD, 1L);
            curl_easy_setopt(eh, CURLOPT_READDATA, fp);
            curl_easy_setopt(eh, CURLOPT_INFILESIZE_LARGE, static_cast<curl_off_t>(size));

            LOGI("[http] PUT begin url=" << redacted(to) << " size=" << size);
            const CURLcode rc = curl_easy_perform(eh);
            long http = 0; curl_easy_getinfo(eh, CURLINFO_HTTP_CODE, &http);

            curl_slist_free_all(hdrs);
            curl_easy_cleanup(eh);
            std::fclose(fp);

            if (rc != CURLE_OK || http < 200 || http >= 300) {
                LOGE("[http] PUT failed rc=" << rc << " http=" << http);
                return false;
            }

            LOGI("[http] PUT done " << " elapsed=" << sw.elapsed() << "s");
            return true;
        }
        else {
            std::error_code ec;
            std::filesystem::create_directories(std::filesystem::path(to).parent_path(), ec);
            const std::string tmp = to + ".part";

            std::ifstream in(localPath, std::ios::binary);
            std::ofstream out(tmp, std::ios::binary);
            if (!in || !out) return false;

            out << in.rdbuf();
            out.close();

            if (std::rename(tmp.c_str(), to.c_str()) != 0) {
                std::remove(tmp.c_str());
                return false;
            }
            LOGI("Saved: " << to);
            return true;
        }
    }

    bool uploadFromFileParallel(const std::string& filePath, const std::string& presignedUrl, int threadCount = 4) {
        std::ifstream in(filePath, std::ios::binary);
        if (!in) return false;

        in.seekg(0, std::ios::end);
        size_t total = in.tellg();
        in.seekg(0, std::ios::beg);

        const size_t partSize = 10 * 1024 * 1024; 
        const int parts = (int)((total + partSize - 1) / partSize);

        std::vector<std::thread> threads;
        std::atomic<int> success{ 0 };
        std::mutex m_mtx;

        for (int i = 0; i < parts; ++i) {
            threads.emplace_back([&, i] {
                size_t offset = (size_t)i * partSize;
                size_t size = std::min(partSize, total - offset);
                std::vector<char> buf(size);
                {
                    std::unique_lock<std::mutex> lk(m_mtx);
                    in.seekg(offset);
                    in.read(buf.data(), size);
                }

                int code = 0;
                std::string resp;
                if (this->putBinary(presignedUrl, buf, size, &code, &resp) && code == 200)
                    success++;
                });
        }
        for (auto& th : threads) th.join();
        return success == parts;
    }

    bool putBinary(const std::string& url, const std::vector<char>& data, size_t size, int* httpCode, std::string* resp) {
        LOGI("[GPU BMP] putBinary begin url=" << redacted(url) << " size=" << size);
        CURL* eh = curl_easy_init();
        if (!eh) return false;

        struct curl_slist* hdrs = nullptr;
        hdrs = curl_slist_append(hdrs, "Expect:");
        hdrs = curl_slist_append(hdrs, "Content-Type: application/octet-stream");

        set_common_http_opts(eh);
        curl_easy_setopt(eh, CURLOPT_URL, url.c_str());
        curl_easy_setopt(eh, CURLOPT_HTTPHEADER, hdrs);
        curl_easy_setopt(eh, CURLOPT_UPLOAD, 1L);
        auto readFn = +[](char* ptr, size_t s, size_t n, void* ud) -> size_t {
            auto* p = reinterpret_cast<std::pair<const char*, size_t>*>(ud);
            size_t len = std::min(s * n, p->second);
            std::memcpy(ptr, p->first, len);
            p->first += len;
            p->second -= len;
            return len;
            };
        curl_easy_setopt(eh, CURLOPT_READFUNCTION, readFn);

        std::pair<const char*, size_t> ctx{ data.data(), size };
        curl_easy_setopt(eh, CURLOPT_READDATA, &ctx);
        curl_easy_setopt(eh, CURLOPT_INFILESIZE_LARGE, (curl_off_t)size);

        std::string out;
        curl_easy_setopt(eh, CURLOPT_WRITEFUNCTION,
            +[](char* ptr, size_t s, size_t n, void* ud)->size_t {
                auto* buf = reinterpret_cast<std::string*>(ud);
                buf->append(ptr, s * n);
                return s * n;
            });
        curl_easy_setopt(eh, CURLOPT_WRITEDATA, &out);

        CURLcode rc = curl_easy_perform(eh);
        long http = 0; curl_easy_getinfo(eh, CURLINFO_HTTP_CODE, &http);

        curl_slist_free_all(hdrs);
        curl_easy_cleanup(eh);

        if (httpCode) *httpCode = (int)http;
        if (resp) *resp = std::move(out);

        LOGI("[GPU BMP] putBinary done rc=" << rc << " http=" << http
            << " respBytes=" << (resp ? resp->size() : 0));
        if (!(rc == CURLE_OK && http == 200)) {
            LOGW("[GPU BMP] putBinary fail rc=" << rc << " http=" << http
                << " body=" << (resp ? *resp : std::string()));
        }
        return (rc == CURLE_OK && http == 200);
    }

    bool putBinaryWithRespHeaders(const std::string& url,
        const char* data,
        size_t size,
        int* httpCode,
        std::string* resp,
        std::vector<std::pair<std::string, std::string>>* respHeaders) override {
        CURL* eh = curl_easy_init();
        if (!eh) return false;

        struct curl_slist* hdrs = nullptr;
        hdrs = curl_slist_append(hdrs, "Expect:");
        hdrs = curl_slist_append(hdrs, "Content-Type: application/octet-stream");

        set_common_http_opts(eh);
        curl_easy_setopt(eh, CURLOPT_URL, url.c_str());
        curl_easy_setopt(eh, CURLOPT_HTTPHEADER, hdrs);
        curl_easy_setopt(eh, CURLOPT_UPLOAD, 1L);

        std::pair<const char*, size_t> ctx{ data, size };
        curl_easy_setopt(eh, CURLOPT_READFUNCTION, read_mem_cb);
        curl_easy_setopt(eh, CURLOPT_READDATA, &ctx);
        curl_easy_setopt(eh, CURLOPT_INFILESIZE_LARGE, (curl_off_t)size);

        std::string out;
        curl_easy_setopt(eh, CURLOPT_WRITEFUNCTION, write_str_cb);
        curl_easy_setopt(eh, CURLOPT_WRITEDATA, &out);

        std::vector<std::pair<std::string, std::string>> headers;
        curl_easy_setopt(eh, CURLOPT_HEADERFUNCTION, header_collect_cb);
        curl_easy_setopt(eh, CURLOPT_HEADERDATA, &headers);

        CURLcode rc = curl_easy_perform(eh);
        long http = 0; curl_easy_getinfo(eh, CURLINFO_HTTP_CODE, &http);

        curl_slist_free_all(hdrs);
        curl_easy_cleanup(eh);

        if (httpCode) *httpCode = (int)http;
        if (resp)     *resp = std::move(out);
        if (respHeaders) *respHeaders = std::move(headers);

        return (rc == CURLE_OK && (http == 200 || http == 201 || http == 204));
    }

    bool uploadFileWithMultipartUrls(
        const std::string& filePath,
        const std::vector<std::string>& partUploadUrls,
        std::vector<std::pair<int, std::string>>& outParts
    ) {
        std::ifstream in(filePath, std::ios::binary);
        if (!in) return false;

        in.seekg(0, std::ios::end);
        const size_t total = (size_t)in.tellg();
        in.seekg(0, std::ios::beg);

        const int parts = (int)partUploadUrls.size();
        if (parts <= 0) return false;

        const size_t base = total / parts;
        const size_t rem = total % parts;

        outParts.clear();
        outParts.resize(parts);

        const int THREADS = std::min(parts, 8);
        std::atomic<int> nextPart{ 0 };
        std::atomic<bool> failed{ false };

        std::mutex in_mtx;
        std::mutex out_mtx;

        auto worker = [&]() {
            while (true) {
                if (failed.load()) return;

                int i = nextPart.fetch_add(1);
                if (i >= parts) return;

                size_t size = base + (i == parts - 1 ? rem : 0);
                if (size == 0) continue;

                std::vector<char> buf(size);
                {
                    std::lock_guard<std::mutex> lk(in_mtx);
                    in.seekg((size_t)i * base);
                    in.read(buf.data(), size);
                }

                int http = 0;
                std::string resp;
                std::vector<std::pair<std::string, std::string>> hdrs;

                bool ok = this->putBinaryWithRespHeaders(
                    partUploadUrls[i],
                    buf.data(),
                    size,
                    &http,
                    &resp,
                    &hdrs
                );

                if (!ok || !(http == 200 || http == 201 || http == 204)) {
                    failed.store(true);
                    return;
                }

                std::string etag;
                for (auto& kv : hdrs) {
                    if (strcasecmp(kv.first.c_str(), "ETag") == 0) {
                        etag = kv.second;
                    }
                }
                etag = unquote(trim(etag));

                {
                    std::lock_guard<std::mutex> lk(out_mtx);
                    outParts[i] = { i + 1, etag };
                }
            }
            };

        std::vector<std::thread> ths;
        for (int t = 0; t < THREADS; ++t)
            ths.emplace_back(worker);

        for (auto& th : ths) th.join();

        return !failed.load();
    }

    bool postJson(const std::string& url,
        const std::string& jsonBody,
        const std::vector<std::pair<std::string, std::string>>& headers,
        int* httpCode,
        std::string* resp) override {
        if (!is_http_url(url)) { LOGE("Bad URL: " << url); return false; }

        CURL* eh = curl_easy_init();
        if (!eh) return false;

        struct curl_slist* hdrs = nullptr;
        hdrs = curl_slist_append(hdrs, "Content-Type: application/json");
        for (const auto& kv : headers) {
            std::string line = kv.first + ": " + kv.second;
            hdrs = curl_slist_append(hdrs, line.c_str());
        }

        std::string out;
        set_common_http_opts(eh);
        curl_easy_setopt(eh, CURLOPT_URL, url.c_str());
        curl_easy_setopt(eh, CURLOPT_HTTPHEADER, hdrs);
        curl_easy_setopt(eh, CURLOPT_POST, 1L);
        curl_easy_setopt(eh, CURLOPT_POSTFIELDS, jsonBody.c_str());
        curl_easy_setopt(eh, CURLOPT_POSTFIELDSIZE, (long)jsonBody.size());
        curl_easy_setopt(eh, CURLOPT_WRITEFUNCTION,
            +[](char* ptr, size_t s, size_t n, void* ud)->size_t {
                auto* buf = reinterpret_cast<std::string*>(ud);
                buf->append(ptr, s * n);
                return s * n;
            });
        curl_easy_setopt(eh, CURLOPT_WRITEDATA, &out);

        CURLcode rc = curl_easy_perform(eh);
        long http = 0;
        curl_easy_getinfo(eh, CURLINFO_HTTP_CODE, &http);

        curl_slist_free_all(hdrs);
        curl_easy_cleanup(eh);

        if (httpCode) *httpCode = (int)http;
        if (resp)     *resp = std::move(out);

        if (rc != CURLE_OK || http < 200 || http >= 300) {
            LOGW("postJson failed rc=" << rc << " http=" << http);
            return false;
        }
        return true;
    }

    std::optional<std::vector<std::uint8_t>> getRange(const std::string& url, conv::HttpRange r) override {
        if (!is_http_url(url)) return std::nullopt;

        CURL* eh = curl_easy_init();
        if (!eh) return std::nullopt;

        const std::string range = "bytes=" + std::to_string(r.offset) + "-" +
            std::to_string(r.offset + r.length - 1);
        std::vector<std::uint8_t> buf;

        set_common_http_opts(eh);
        curl_easy_setopt(eh, CURLOPT_URL, url.c_str());
        curl_easy_setopt(eh, CURLOPT_RANGE, range.c_str());
        curl_easy_setopt(
            eh, CURLOPT_WRITEFUNCTION,
            +[](char* ptr, size_t s, size_t n, void* ud) -> size_t {
                auto* v = reinterpret_cast<std::vector<std::uint8_t>*>(ud);
                const size_t bytes = s * n;
                v->insert(v->end(),
                    reinterpret_cast<std::uint8_t*>(ptr),
                    reinterpret_cast<std::uint8_t*>(ptr) + bytes);
                return bytes;
            });
        curl_easy_setopt(eh, CURLOPT_WRITEDATA, &buf);

        const CURLcode rc = curl_easy_perform(eh);
        long http = 0; curl_easy_getinfo(eh, CURLINFO_HTTP_CODE, &http);
        curl_easy_cleanup(eh);

        if (rc != CURLE_OK || !((http == 206) || (http == 200))) return std::nullopt;
        return buf;
    }
};

namespace conv {
    std::unique_ptr<IHttpIO> MakeHttpIO() {
        return std::make_unique<LibcurlMultiIO>();
    }
}
