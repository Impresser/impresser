#pragma once
#include <chrono>

struct Stopwatch {
    using clock = std::chrono::high_resolution_clock;
    clock::time_point t0;
    Stopwatch() : t0(clock::now()) {}
    void reset() { t0 = clock::now(); }
    double elapsed() const {
        return std::chrono::duration<double>(clock::now() - t0).count();
    }
};
