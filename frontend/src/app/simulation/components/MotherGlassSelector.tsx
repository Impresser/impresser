'use client';

import React from 'react';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import type { MotherGlass } from '../data/motherGlasses';

interface MotherGlassSelectorProps {
  motherGlasses: MotherGlass[];
  className?: string;
}

export default function MotherGlassSelector({
  motherGlasses,
  className = '',
}: MotherGlassSelectorProps) {
  return (
    <section className={`${className}`}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">가용 원장 정보</h2>
      </div>
      <CommonContainerBox className="px-4 py-4">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-gray-900">원장 규격 안내</h3>
          <p className="mt-1 text-sm text-gray-500">
            생산 계획에 활용 가능한 원장의 규격 정보입니다. 각 원장의 가로·세로 길이와 면적을 참고하여 배치 효율을 비교할 수
            있습니다.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {motherGlasses.map((motherGlass) => {
            return (
              <div
                key={motherGlass.id}
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-left shadow-sm transition-all duration-200 hover:border-blue-200 hover:bg-blue-50"
              >
                <p className="text-sm font-semibold text-gray-900">{motherGlass.generationName}</p>
                <div className="mt-2 space-y-1 text-xs text-gray-600">
                  <p>
                    <span className="font-medium text-gray-500">가로:</span> {motherGlass.widthMm.toLocaleString()}mm
                  </p>
                  <p>
                    <span className="font-medium text-gray-500">세로:</span> {motherGlass.heightMm.toLocaleString()}mm
                  </p>
                  <p>
                    <span className="font-medium text-gray-500">면적:</span> {motherGlass.areaMm2.toLocaleString()}mm²
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CommonContainerBox>
    </section>
  );
}
