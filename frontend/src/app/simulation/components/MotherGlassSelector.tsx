'use client';

import React from 'react';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import CommonButton from '@/components/ui/CommonButton';
import type { MotherGlass } from '../data/motherGlasses';

interface MotherGlassSelectorProps {
  motherGlasses: MotherGlass[];
  selectedMotherGlassId: string | null;
  onSelect: (motherGlassId: string) => void;
  onConfirm?: (motherGlass: MotherGlass | null) => void;
  className?: string;
}

export default function MotherGlassSelector({
  motherGlasses,
  selectedMotherGlassId,
  onSelect,
  onConfirm,
  className = '',
}: MotherGlassSelectorProps) {
  const selectedMotherGlass = motherGlasses.find((motherGlass) => motherGlass.id === selectedMotherGlassId) ?? null;

  return (
    <section className={`${className}`}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">원장 선택</h2>
      </div>
      <CommonContainerBox className="px-4 py-4">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-gray-900">원장 선택</h3>
          <p className="mt-1 text-sm text-gray-500">
            생산 계획에 사용할 원장을 선택하세요. 선택한 원장의 규격을 기반으로 배치 계획이 산출됩니다.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {motherGlasses.map((motherGlass) => {
            const isSelected = motherGlass.id === selectedMotherGlassId;
            return (
              <button
                key={motherGlass.id}
                type="button"
                onClick={() => onSelect(motherGlass.id)}
                className={`rounded-xl border px-4 py-3 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                }`}
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
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex justify-end">
          <CommonButton
            variant="blue"
            className="px-4 py-2 text-sm"
            onClick={() => onConfirm?.(selectedMotherGlass)}
            disabled={!selectedMotherGlass}
          >
            원장 선택 확정
          </CommonButton>
        </div>
      </CommonContainerBox>
    </section>
  );
}
