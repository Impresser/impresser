FROM rapidsai/base:24.04-cuda12.0-py3.10 AS build
USER root
WORKDIR /app
RUN apt-get update && apt-get install -y build-essential cmake libtiff-dev
COPY . .
RUN cmake . && make

FROM rapidsai/base:24.04-cuda12.0-py3.10
USER root
WORKDIR /app
RUN apt-get update && apt-get install -y libtiff5
COPY --from=build /app/image .
ENTRYPOINT ["./image"]