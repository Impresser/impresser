'use client';

import React from 'react';
import CommonContainerBox from '@/components/ui/CommonContainerBox';

interface ProductionSimulatorProps {
  className?: string;
}

export default function ProductionSimulator({ className = '' }: ProductionSimulatorProps) {
  return (
    <section className={` ${className}`}>
      <CommonContainerBox className="h-[300px] flex items-center justify-center text-gray-400">
        곧 제공될 생산 시뮬레이션 영역입니다.
      </CommonContainerBox>
    </section>
  );
}
