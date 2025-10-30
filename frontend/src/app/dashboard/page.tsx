'use client';

import React from 'react';
import Sidebar from '@/components/layout/sidebar';
import Navbar from '@/components/layout/navbar';

export default function DashboardPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Navigation Bar */}
        <Navbar userName="홍길동" />

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 통계 카드들 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                총 패턴 수
              </h3>
              <p className="text-3xl font-bold text-blue-600">1,234</p>
              <p className="text-sm text-gray-500 mt-1">+12% 이번 달</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                압축된 파일
              </h3>
              <p className="text-3xl font-bold text-green-600">856</p>
              <p className="text-sm text-gray-500 mt-1">+8% 이번 주</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                시뮬레이션 실행
              </h3>
              <p className="text-3xl font-bold text-purple-600">42</p>
              <p className="text-sm text-gray-500 mt-1">+5% 어제</p>
            </div>

            {/* 최근 활동 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:col-span-2 lg:col-span-3">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                최근 활동
              </h3>
              <div className="space-y-3">
                {Array.from({ length: 5 }, (_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">
                        새로운 패턴이 생성되었습니다
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{i + 1}분 전</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
