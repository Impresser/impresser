# CMake 최소 요구 버전 설정
cmake_minimum_required(VERSION 3.10)

# 프로젝트 이름을 'image'로 설정
project(image VERSION 1.0)

# C++ 표준 버전 설정 (C++17)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# 실행 파일(exe) 생성 설정
# "image"라는 이름의 실행 파일을 src/main.cpp 파일을 이용해 만듦
add_executable(image src/main.cpp)