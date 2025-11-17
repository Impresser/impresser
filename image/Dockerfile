FROM nvidia/cuda:12.8.0-devel-ubuntu24.04 AS build
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential cmake pkg-config \
    git \
    libcurl4-openssl-dev \
    libssl-dev \
    libtiff-dev \
    zlib1g-dev \
    libnvidia-ml-dev \
    libboost-chrono-dev libboost-system-dev libboost-thread-dev \
 && rm -rf /var/lib/apt/lists/*

COPY nvtiff-local-repo-ubuntu2404-0.6.0_0.6.0-1_amd64.deb /tmp/
RUN dpkg -i /tmp/nvtiff-local-repo-ubuntu2404-0.6.0_0.6.0-1_amd64.deb \
 && cp /var/nvtiff-local-repo-ubuntu2404-0.6.0/nvtiff-local-*-keyring.gpg /usr/share/keyrings/ \
 && apt-get update \
 && apt-get install -y --no-install-recommends nvtiff \
 && update-alternatives --set nvtiff /usr/lib/x86_64-linux-gnu/libnvtiff/12/libnvtiff.so.0 \
 && rm -rf /var/lib/apt/lists/* /tmp/*.deb

RUN git clone --depth 1 https://github.com/alanxz/rabbitmq-c.git /tmp/rabbitmq-c && \
    cd /tmp/rabbitmq-c && mkdir build && cd build && \
    cmake .. -DBUILD_SHARED_LIBS=ON -DCMAKE_INSTALL_PREFIX=/usr/local && \
    make -j"$(nproc)" && make install && \
    rm -rf /tmp/rabbitmq-c

RUN git clone --depth 1 https://github.com/alanxz/SimpleAmqpClient.git /tmp/SimpleAmqpClient && \
    cd /tmp/SimpleAmqpClient && mkdir build && cd build && \
    cmake .. -DCMAKE_INSTALL_PREFIX=/usr/local && \
    make -j"$(nproc)" && make install && \
    rm -rf /tmp/SimpleAmqpClient

WORKDIR /app
COPY . .

RUN cmake \
      -DNVTIFF_INCLUDE_DIR=/usr/include \
      -DNVTIFF_LIBRARY=/usr/lib/x86_64-linux-gnu/libnvtiff.so.0 \
      -DNVML_LIBRARY=/usr/lib/x86_64-linux-gnu/libnvidia-ml.so \
      . \
 && make -j"$(nproc)"

FROM nvidia/cuda:12.8.0-runtime-ubuntu24.04 AS runtime
ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libtiff6 \
    libcurl4 \
    zlib1g \
    ca-certificates \
    libnvidia-ml-dev \
    libboost-system1.83.0 \
    libboost-thread1.83.0 \
    libboost-chrono1.83.0 \
 && rm -rf /var/lib/apt/lists/*

COPY nvtiff-local-repo-ubuntu2404-0.6.0_0.6.0-1_amd64.deb /tmp/
RUN dpkg -i /tmp/nvtiff-local-repo-ubuntu2404-0.6.0_0.6.0-1_amd64.deb \
 && cp /var/nvtiff-local-repo-ubuntu2404-0.6.0/nvtiff-local-*-keyring.gpg /usr/share/keyrings/ \
 && apt-get update \
 && apt-get install -y --no-install-recommends nvtiff \
 && update-alternatives --set nvtiff /usr/lib/x86_64-linux-gnu/libnvtiff/12/libnvtiff.so.0 \
 && rm -rf /var/lib/apt/lists/* /tmp/*.deb

COPY --from=build /usr/local/lib/ /usr/local/lib/

RUN ldconfig

COPY --from=build /app/image /app/image

EXPOSE 8080
ENTRYPOINT ["/app/image"]
CMD ["8080"]
