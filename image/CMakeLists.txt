cmake_minimum_required(VERSION 3.16)
project(image_converter LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

if (MSVC)
  add_compile_options(/O2 /W3 /utf-8)
else()
  add_compile_options(-O2 -Wall)
endif()

# -----------------------------------------------------------------------------
# nvTIFF 설정
# -----------------------------------------------------------------------------
if (WIN32)
  set(NVTIFF_INCLUDE_DIR "C:/Program Files/NVIDIA nvTIFF/v0.5/include" CACHE PATH "")
  set(NVTIFF_LIBRARY     "C:/Program Files/NVIDIA nvTIFF/v0.5/lib/12/nvtiff.lib" CACHE FILEPATH "")
  set(NVTIFF_BIN_DIR     "C:/Program Files/NVIDIA nvTIFF/v0.5/lib/12/" CACHE PATH "")
else()
  if (NOT DEFINED NVTIFF_INCLUDE_DIR OR NOT DEFINED NVTIFF_LIBRARY)
    message(FATAL_ERROR "Set NVTIFF_INCLUDE_DIR and NVTIFF_LIBRARY for Linux")
  endif()
endif()

# -----------------------------------------------------------------------------
# CUDA
# -----------------------------------------------------------------------------
find_path(CUDA_INCLUDE_DIR cuda_runtime.h PATHS /usr/local/cuda/include /usr/include)
find_library(CUDART_LIBRARY cudart PATHS /usr/local/cuda/lib64 /usr/lib/x86_64-linux-gnu REQUIRED)
include_directories(${CUDA_INCLUDE_DIR})

# -----------------------------------------------------------------------------
# NVML
# -----------------------------------------------------------------------------
find_path(NVML_INCLUDE_DIR nvml.h PATHS /usr/local/cuda/include /usr/include/nvidia-ml)
find_library(NVML_LIBRARY NAMES nvidia-ml nvml PATHS /usr/lib /usr/lib/x86_64-linux-gnu)
include_directories(${NVML_INCLUDE_DIR})

# -----------------------------------------------------------------------------
# libcurl / Threads
# -----------------------------------------------------------------------------
find_package(CURL REQUIRED)
find_package(Threads REQUIRED)

# -----------------------------------------------------------------------------
# libtiff 추가
# -----------------------------------------------------------------------------
find_package(TIFF REQUIRED)

# ----------------------------------------------------------------------------- 
# zlib (Deflate 압축용)
# ----------------------------------------------------------------------------- 
if(WIN32)
    # vcpkg 설치 경로 기준
    set(ZLIB_INCLUDE_DIR "C:/devtools/vcpkg/installed/x64-windows/include")
    set(ZLIB_LIBRARY     "C:/devtools/vcpkg/installed/x64-windows/lib/zlib.lib")
else()
    find_package(ZLIB REQUIRED)
endif()

include_directories(${ZLIB_INCLUDE_DIR})


# -----------------------------------------------------------------------------
# include 경로
# -----------------------------------------------------------------------------
include_directories(
  "${NVTIFF_INCLUDE_DIR}"
  "${CMAKE_SOURCE_DIR}/include"
  "${CMAKE_SOURCE_DIR}/vendor"
  ${TIFF_INCLUDE_DIR}
)

# -----------------------------------------------------------------------------
# 소스
# -----------------------------------------------------------------------------
set(SRC_MUST
  "${CMAKE_SOURCE_DIR}/src/bmp_loader.cpp"
  "${CMAKE_SOURCE_DIR}/src/encoder_factory.cpp"
  "${CMAKE_SOURCE_DIR}/src/encoder_nvtiff.cpp"
)

set(SRC_OPTIONAL
  "${CMAKE_SOURCE_DIR}/src/encoder_libtiff.cpp"
)

set(IMAGE_CORE_SOURCES "")
foreach(f ${SRC_MUST})
  if (EXISTS "${f}")
    list(APPEND IMAGE_CORE_SOURCES "${f}")
  else()
    message(FATAL_ERROR "Required source not found: ${f}")
  endif()
endforeach()
foreach(f ${SRC_OPTIONAL})
  if (EXISTS "${f}")
    list(APPEND IMAGE_CORE_SOURCES "${f}")
  endif()
endforeach()

list(APPEND IMAGE_CORE_SOURCES "${CMAKE_SOURCE_DIR}/src/http_io.cpp")

# -----------------------------------------------------------------------------
# 라이브러리 및 실행파일
# -----------------------------------------------------------------------------
add_library(image_core ${IMAGE_CORE_SOURCES})
target_link_libraries(image_core PRIVATE
  "${NVTIFF_LIBRARY}"
  "${CUDART_LIBRARY}"
  CURL::libcurl
  Threads::Threads
  ${NVML_LIBRARY}
  ${TIFF_LIBRARIES}
  ${ZLIB_LIBRARY}
)

add_executable(image "${CMAKE_SOURCE_DIR}/src/main_server.cpp")
target_link_libraries(image PRIVATE image_core ${TIFF_LIBRARIES})

# -----------------------------------------------------------------------------
# 상태 출력
# -----------------------------------------------------------------------------
message(STATUS "nvTIFF include dir  : ${NVTIFF_INCLUDE_DIR}")
message(STATUS "nvTIFF library      : ${NVTIFF_LIBRARY}")
message(STATUS "CUDA include dir    : ${CUDA_INCLUDE_DIR}")
message(STATUS "cudart library      : ${CUDART_LIBRARY}")
message(STATUS "NVML include dir    : ${NVML_INCLUDE_DIR}")
message(STATUS "NVML library        : ${NVML_LIBRARY}")
message(STATUS "curl include dir    : ${CURL_INCLUDE_DIRS}")
message(STATUS "curl library        : ${CURL_LIBRARIES}")
message(STATUS "tiff include dir    : ${TIFF_INCLUDE_DIR}")
message(STATUS "tiff library        : ${TIFF_LIBRARIES}")
