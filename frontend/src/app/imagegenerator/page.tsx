'use client';

import React from 'react';
import Sidebar from '@/components/layout/sidebar';
import Navbar from '@/components/layout/navbar';
import PatternGenerator from './components/PatternGenerator';
import PatternList from './components/PatternList';
import Button from '@/components/ui/CommonButton';
import { usePatternJobs } from '@/app/imagegenerator/hooks/usePatternJobs';

export default function PatternGeneratorPage() {
  const { generatedCount, addJob } = usePatternJobs();
  return (
    <div className="flex h-screen bg-gray-50">
      {/* 🔹 Sidebar */}
      <Sidebar />

      {/* 🔹 Main Content */}
      <div className="flex-1 flex flex-col">
        <Navbar userName="홍길동" />

        <main className="flex-1 p-8 overflow-y-auto">
          {/* 상단: 입력 영역 - 전체 폭 사용 */}
          <div className="mb-4">
            <PatternGenerator />
          </div>

          {/* 하단 정보 및 버튼 - 반응형 정렬 */}
          <div className="flex flex-row justify-end items-center gap-2 md:gap-4">
            <span className="text-gray-600 text-sm">생성된 이미지 수: {generatedCount}</span>
            <Button variant="blue" onClick={() => addJob()}>생성하기</Button>
          </div>

          {/* 하단: 목록 테이블 */}
          <PatternList />
        </main>
      </div>
    </div>
  );
}
