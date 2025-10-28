FROM rapidsai/rapidsai:23.08-cuda11.8-devel-ubuntu22.04 AS build
WORKDIR /app
RUN apt-get update && apt-get install -y build-essential cmake libtiff-dev
COPY . .
RUN cmake . && make

FROM rapidsai/rapidsai:23.08-cuda11.8-runtime-ubuntu22.04
WORKDIR /app
RUN apt-get update && apt-get install -y libtiff5
COPY --from=build /app/image .
ENTRYPOINT ["./image"]