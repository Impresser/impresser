'use client';

import React from 'react';
import CommonContainerBox from '@/components/ui/CommonContainerBox';

interface PerformanceSimulatorProps {
  className?: string;
}

export default function PerformanceSimulator({ className = '' }: PerformanceSimulatorProps) {
  return (
    <section className={`space-y-6 ${className}`}>
      <h2 className="text-lg font-semibold text-gray-900">알고리즘 성능 비교</h2>
      <CommonContainerBox className="h-[300px] flex items-center justify-center text-gray-400">
        곧 제공될 성능 분석 영역입니다.
      </CommonContainerBox>
    </section>
  );
}
