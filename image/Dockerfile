FROM nvidia/cuda:12.8.0-devel-ubuntu24.04 AS build
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential cmake pkg-config \
    libcurl4-openssl-dev \
    libtiff-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

COPY nvtiff-local-repo-ubuntu2404-0.5.1_0.5.1-1_amd64.deb /tmp/
RUN dpkg -i /tmp/nvtiff-local-repo-ubuntu2404-0.5.1_0.5.1-1_amd64.deb \
 && cp /var/nvtiff-local-repo-ubuntu2404-0.5.1/nvtiff-local-*-keyring.gpg /usr/share/keyrings/ \
 && apt-get update \
 && apt-get install -y nvtiff \
 && mkdir -p /opt/nvtiff && cp -r /usr/local/nvtiff/* /opt/nvtiff/

WORKDIR /app
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
    zlib1g \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /opt/nvtiff /opt/nvtiff
ENV LD_LIBRARY_PATH=/opt/nvtiff/lib:${LD_LIBRARY_PATH}

COPY --from=build /app/image /app/image

EXPOSE 8080
ENTRYPOINT ["/app/image"]
