'use client';

import React from 'react';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import CommonButton from '@/components/ui/CommonButton';
import type { Facility } from '../types';

interface SelectedFacilitiesPanelProps {
  selectedFacilities: (Facility | null)[];
  onConfirm?: () => void;
}

export default function SelectedFacilitiesPanel({ selectedFacilities, onConfirm }: SelectedFacilitiesPanelProps) {
  const getStatusLabel = (status?: Facility['status']) => {
    switch (status) {
      case 'active':
        return '정상';
      case 'maintenance':
        return '점검';
      case 'inactive':
        return '고장';
      default:
        return '-';
    }
  };

  return (
    <CommonContainerBox className="h-full flex flex-col px-4 py-4">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-gray-900">선택한 설비</h3>
      </div>
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {selectedFacilities.map((facility, index) => (
          <div
            key={index}
            className={`rounded-xl border p-4 ${
              facility
                ? 'border-blue-200 bg-blue-50'
                : 'border-gray-200 border-dashed bg-gray-50'
            }`}
          >
            {facility ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900">{facility.name}</h4>
                  <span className="text-xs text-gray-500">슬롯 {index + 1}</span>
                </div>
                <div className="text-xs text-gray-600">
                  <p>모델명: {facility.modelName || '-'}</p>
                  <p>상태: {getStatusLabel(facility.status)}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-sm text-gray-400">
                설비 미선택
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-end shrink-0">
        <CommonButton
          variant="blue"
          className="px-4 py-2 text-sm"
          onClick={onConfirm}
        >
          확인
        </CommonButton>
      </div>
    </CommonContainerBox>
  );
}

