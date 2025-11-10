FROM nvidia/cuda:12.8.0-devel-ubuntu24.04 AS build
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential cmake pkg-config \
    libcurl4-openssl-dev \
    libtiff-dev \
    nvidia-cuda-toolkit \
    && rm -rf /var/lib/apt/lists/*

COPY nvtiff /opt/nvtiff

COPY . .

RUN cmake -DNVTIFF_INCLUDE_DIR=/opt/nvtiff/include \
          -DNVTIFF_LIBRARY=/opt/nvtiff/lib/libnvtiff.so \
          . \
 && make -j"$(nproc)"

FROM nvidia/cuda:12.8.0-runtime-ubuntu24.04 AS runtime
ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libtiff6 \
    libcurl4 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /opt/nvtiff /opt/nvtiff
ENV LD_LIBRARY_PATH=/opt/nvtiff/lib:${LD_LIBRARY_PATH}

COPY --from=build /app/image /app/image

EXPOSE 8080
ENTRYPOINT ["/app/image"]
