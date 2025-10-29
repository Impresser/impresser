'use client';

import React from 'react';
import Sidebar from '@/components/layout/sidebar';
import Navbar from '@/components/layout/navbar';

export default function SimulationPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Navigation Bar */}
        <Navbar userName="홍길동" />

        {/* Page Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">시뮬레이션</h1>
          <p className="text-gray-600 mt-1">
            패턴 시뮬레이션을 실행하고 결과를 확인할 수 있습니다.
          </p>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 시뮬레이션 설정 */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    시뮬레이션 설정
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        패턴 선택
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">패턴을 선택하세요</option>
                        <option value="pattern1">패턴 1</option>
                        <option value="pattern2">패턴 2</option>
                        <option value="pattern3">패턴 3</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        시뮬레이션 시간 (초)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="3600"
                        defaultValue="60"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        샘플링 레이트
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="1000">1000 Hz</option>
                        <option value="2000">2000 Hz</option>
                        <option value="5000">5000 Hz</option>
                      </select>
                    </div>
                    <div className="flex space-x-2">
                      <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                        시작
                      </button>
                      <button className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
                        중지
                      </button>
                    </div>
                  </div>
                </div>

                {/* 진행 상황 */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    진행 상황
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>시뮬레이션 진행률</span>
                        <span>45%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: '45%' }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>경과 시간: 27초</p>
                      <p>남은 시간: 33초</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 시뮬레이션 결과 */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    시뮬레이션 결과
                  </h2>
                  <div className="space-y-6">
                    {/* 그래프 영역 */}
                    <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                          <svg
                            className="w-8 h-8 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                          </svg>
                        </div>
                        <p className="text-gray-500">시뮬레이션 그래프</p>
                      </div>
                    </div>

                    {/* 결과 통계 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">1.2</p>
                        <p className="text-sm text-blue-800">평균 값</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">0.8</p>
                        <p className="text-sm text-green-800">최소 값</p>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <p className="text-2xl font-bold text-red-600">2.1</p>
                        <p className="text-sm text-red-800">최대 값</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">
                          0.3
                        </p>
                        <p className="text-sm text-purple-800">표준편차</p>
                      </div>
                    </div>

                    {/* 결과 테이블 */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        상세 결과
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2">시간</th>
                              <th className="text-left py-2">값</th>
                              <th className="text-left py-2">상태</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Array.from({ length: 5 }, (_, i) => {
                              // 고정된 시드 값으로 일관된 결과 생성
                              const seed = i * 0.3;
                              const value = (1.2 + (seed % 0.8)).toFixed(2);

                              return (
                                <tr
                                  key={i}
                                  className="border-b border-gray-100"
                                >
                                  <td className="py-2">{i * 10}초</td>
                                  <td className="py-2">{value}</td>
                                  <td className="py-2">
                                    <span
                                      className={`px-2 py-1 rounded text-xs ${
                                        i % 2 === 0
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-yellow-100 text-yellow-800'
                                      }`}
                                    >
                                      {i % 2 === 0 ? '정상' : '경고'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
