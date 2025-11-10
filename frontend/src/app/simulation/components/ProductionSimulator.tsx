'use client';

import React from 'react';
import CommonContainerBox from '@/components/ui/CommonContainerBox';

interface ProductionSimulatorProps {
  className?: string;
}

export default function ProductionSimulator({ className = '' }: ProductionSimulatorProps) {
  return (
    <section className={` ${className}`}>
      <h2 className="mb-4 text-lg font-semibold text-gray-900">생산 시뮬레이터</h2>
      <CommonContainerBox className="h-[300px] flex items-center justify-center text-gray-400">
        곧 제공될 생산 시뮬레이션 영역입니다.
      </CommonContainerBox>
    </section>
  );
}
