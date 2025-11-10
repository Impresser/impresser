cmake_minimum_required(VERSION 3.16)
project(image_converter LANGUAGES CXX)

# -----------------------------------------------------------------------------
# C++
# -----------------------------------------------------------------------------
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

if (MSVC)
  add_compile_options(/O2 /W3 /utf-8)
else()
  add_compile_options(-O2 -Wall)
endif()

# -----------------------------------------------------------------------------
# nvTIFF 경로
#  - Windows: 기존 하드코딩 유지
#  - Linux  : 환경변수나 -D로 주입 (예: -DNVTIFF_INCLUDE_DIR=/opt/nvtiff/include)
# -----------------------------------------------------------------------------
if (WIN32)
  set(NVTIFF_INCLUDE_DIR "C:/Program Files/NVIDIA nvTIFF/v0.5/include" CACHE PATH "")
  set(NVTIFF_LIBRARY     "C:/Program Files/NVIDIA nvTIFF/v0.5/lib/12/nvtiff.lib" CACHE FILEPATH "")
  set(NVTIFF_BIN_DIR     "C:/Program Files/NVIDIA nvTIFF/v0.5/lib/12/" CACHE PATH "")
else()
  # 리눅스: 필수 경로를 외부에서 넘겨주세요.
  # 예) cmake -DNVTIFF_INCLUDE_DIR=/opt/nvtiff/include -DNVTIFF_LIBRARY=/opt/nvtiff/lib/libnvtiff.so ..
  if (NOT DEFINED NVTIFF_INCLUDE_DIR OR NOT DEFINED NVTIFF_LIBRARY)
    message(FATAL_ERROR "Set NVTIFF_INCLUDE_DIR and NVTIFF_LIBRARY for Linux")
  endif()
endif()

if (NOT EXISTS "${NVTIFF_INCLUDE_DIR}/nvtiff.h")
  message(FATAL_ERROR "nvtiff.h not found at: ${NVTIFF_INCLUDE_DIR}")
endif()
if (NOT EXISTS "${NVTIFF_LIBRARY}")
  message(FATAL_ERROR "nvTIFF library not found at: ${NVTIFF_LIBRARY}")
endif()

# -----------------------------------------------------------------------------
# CUDA Toolkit (cuda_runtime.h / cudart 링크)
# -----------------------------------------------------------------------------
if (WIN32)
  set(CUDA_TOOLKIT_ROOT "C:/Program Files/NVIDIA GPU Computing Toolkit/CUDA/v12.6")
  include_directories("${CUDA_TOOLKIT_ROOT}/include")
  find_library(CUDART_LIBRARY cudart
    PATHS "${CUDA_TOOLKIT_ROOT}/lib/x64" "${CUDA_TOOLKIT_ROOT}/lib/Win32" REQUIRED)
else()
  # 리눅스: nvcc 없이 헤더/라이브러리만 필요
  find_path(CUDA_INCLUDE_DIR cuda_runtime.h
            PATHS /usr/local/cuda/include /usr/include /opt/cuda/include)
  if (NOT CUDA_INCLUDE_DIR)
    message(FATAL_ERROR "cuda_runtime.h not found")
  endif()
  include_directories(${CUDA_INCLUDE_DIR})

  find_library(CUDART_LIBRARY cudart
               PATHS /usr/local/cuda/lib64 /usr/lib/x86_64-linux-gnu /usr/lib64 REQUIRED)
endif()

# -----------------------------------------------------------------------------
# include 경로
# -----------------------------------------------------------------------------
include_directories(
  "${NVTIFF_INCLUDE_DIR}"
  "${CMAKE_SOURCE_DIR}/include"
  "${CMAKE_SOURCE_DIR}/vendor"
)

# -----------------------------------------------------------------------------
# libcurl (http_io.cpp에서 필요)
# -----------------------------------------------------------------------------
find_package(CURL REQUIRED)
find_package(Threads REQUIRED)

# -----------------------------------------------------------------------------
# 소스
# -----------------------------------------------------------------------------
set(SRC_MUST
  "${CMAKE_SOURCE_DIR}/src/bmp_loader.cpp"
  "${CMAKE_SOURCE_DIR}/src/encoder_factory.cpp"
  "${CMAKE_SOURCE_DIR}/src/encoder_nvtiff.cpp"
)

set(SRC_OPTIONAL
  "${CMAKE_SOURCE_DIR}/src/encoder_libtiff.cpp"     # 있으면 포함
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
  else()
    message(STATUS "Optional source not found (skipped): ${f}")
  endif()
endforeach()

# 새 http_io.cpp(리브컬 멀티) 추가
list(APPEND IMAGE_CORE_SOURCES "${CMAKE_SOURCE_DIR}/src/http_io.cpp")

# -----------------------------------------------------------------------------
# 라이브러리/실행파일
# -----------------------------------------------------------------------------
add_library(image_core ${IMAGE_CORE_SOURCES})
target_link_libraries(image_core PRIVATE "${NVTIFF_LIBRARY}" "${CUDART_LIBRARY}" CURL::libcurl Threads::Threads)

set(MAIN_SRC "${CMAKE_SOURCE_DIR}/src/main_server.cpp")
if (NOT EXISTS "${MAIN_SRC}")
  message(FATAL_ERROR "Main source not found: ${MAIN_SRC}")
endif()

add_executable(image "${MAIN_SRC}")
target_link_libraries(image PRIVATE image_core "${CUDART_LIBRARY}" Threads::Threads)

# -----------------------------------------------------------------------------
# DLL 복사(윈도우 전용)
# -----------------------------------------------------------------------------
if (WIN32 AND EXISTS "${NVTIFF_BIN_DIR}/nvtiff_0.dll")
  add_custom_command(TARGET image POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy_if_different
      "${NVTIFF_BIN_DIR}/nvtiff_0.dll" $<TARGET_FILE_DIR:image>
    COMMENT "Copy nvtiff_0.dll")
endif()

if (WIN32)
  if (EXISTS "${CUDA_TOOLKIT_ROOT}/bin/cudart64_12.dll")
    add_custom_command(TARGET image POST_BUILD
      COMMAND ${CMAKE_COMMAND} -E copy_if_different
        "${CUDA_TOOLKIT_ROOT}/bin/cudart64_12.dll" $<TARGET_FILE_DIR:image>
      COMMENT "Copy cudart64_12.dll")
  endif()
  if (EXISTS "${CUDA_TOOLKIT_ROOT}/bin/x64/cudart64_13.dll")
    add_custom_command(TARGET image POST_BUILD
      COMMAND ${CMAKE_COMMAND} -E copy_if_different
        "${CUDA_TOOLKIT_ROOT}/bin/x64/cudart64_13.dll" $<TARGET_FILE_DIR:image>
      COMMENT "Copy cudart64_13.dll")
  endif()
endif()

# -----------------------------------------------------------------------------
# 상태 출력
# -----------------------------------------------------------------------------
message(STATUS "nvTIFF include : ${NVTIFF_INCLUDE_DIR}")
message(STATUS "nvTIFF library : ${NVTIFF_LIBRARY}")
message(STATUS "CUDA include   : ${CUDA_INCLUDE_DIR}")
message(STATUS "cudart library : ${CUDART_LIBRARY}")
