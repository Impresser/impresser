'use client';

import React from 'react';
import Image from 'next/image';
import type { Facility } from '../types';
import CommonButton from '@/components/ui/CommonButton';

interface FacilityPerformanceComparisonProps {
  facility: Facility | null;
  slotIndex: number;
  isDragOver: boolean;
  onRemove: () => void;
  onDrop: (facility: Facility) => void;
  draggingFacility: Facility | null;
  onDragOverChange: (isOver: boolean) => void;
  onAddTask?: (facility: Facility) => void;
}

export default function FacilityPerformanceComparison({
  facility,
  slotIndex,
  isDragOver,
  onRemove,
  onDrop,
  draggingFacility,
  onDragOverChange,
  onAddTask,
}: FacilityPerformanceComparisonProps) {
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (draggingFacility) {
      onDrop(draggingFacility);
      onDragOverChange(false);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (draggingFacility) {
      event.preventDefault();
    }
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    if (draggingFacility) {
      event.preventDefault();
      onDragOverChange(true);
    }
  };

  return (
    <div
      className={`rounded-2xl border-2 transition-colors ${
        facility
          ? 'border-gray-200 bg-white shadow-sm'
          : draggingFacility
            ? 'border-blue-400 border-dashed bg-blue-50/50'
            : 'border-gray-200 border-dashed bg-white/60'
      } ${isDragOver ? 'border-blue-500 bg-blue-50' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={(event) => {
        event.preventDefault();
        onDragOverChange(false);
      }}
      role="listitem"
      aria-label={facility ? `${facility.name} 성능 비교 슬롯` : `성능 비교 슬롯 ${slotIndex + 1}`}
      tabIndex={0}
    >
      {facility ? (
        <div className="relative px-5 py-4">
          <button
            type="button"
            aria-label="슬롯에서 제거"
            className="absolute top-3 right-3 rounded-full p-1 text-gray-400 transition-colors hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            onClick={onRemove}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex flex-col gap-4">
            <p className="text-lg font-semibold text-gray-900">
              {facility.name}
              {facility.modelName && <span className="ml-2 text-base text-gray-500">{facility.modelName}</span>}
            </p>
            <div className="flex flex-col gap-4 md:flex-row md:gap-6">
              <div
                className="relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-gray-100 md:max-w-[320px]"
                style={{ aspectRatio: '3 / 2' }}
              >
                <Image
                  src="/images/facilities/inkjet_detail01.png"
                  alt={`${facility.name} 성능 이미지`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-contain"
                  priority={false}
                />
              </div>
              <div className="flex-1 space-y-3 text-sm text-gray-600">
                <div>
                  <p className="flex items-center justify-between text-sm text-gray-800">
                    <span className="font-medium text-gray-500">CPU</span>
                    <span>{facility.cpu || '-'}</span>
                  </p>
                </div>
                <div>
                  <p className="flex items-center justify-between text-sm text-gray-800">
                    <span className="font-medium text-gray-500">GPU</span>
                    <span>{facility.gpu || '-'}</span>
                  </p>
                </div>
                <div>
                  <p className="flex items-center justify-between text-sm text-gray-800">
                    <span className="font-medium text-gray-500">RAM</span>
                    <span>{facility.ram || '-'}</span>
                  </p>
                </div>
                <div>
                  <p className="flex items-center justify-between text-sm text-gray-800">
                    <span className="font-medium text-gray-500">VRAM</span>
                    <span>{facility.vram || '-'}</span>
                  </p>
                </div>
                <div>
                  <p className="flex items-center justify-between text-sm text-gray-800">
                    <span className="font-medium text-gray-500">진행상태</span>
                    <span>
                      {facility.processStatus === 'RUNNING'
                        ? '진행'
                        : facility.processStatus === 'WAITING'
                          ? '대기'
                          : '-'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <CommonButton
              type="button"
              variant="blue"
              className="px-4 py-2 text-sm"
              onClick={() => facility && onAddTask?.(facility)}
            >
              작업 추가
            </CommonButton>
          </div>
        </div>
      ) : (
        <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 text-sm text-gray-500">
          <div className="rounded-full bg-gray-100 p-3 text-gray-400">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <p className="font-medium text-gray-600">설비를 드래그하여 비교 슬롯에 추가</p>
          <p className="text-xs text-gray-400">(클릭으로도 추가 가능)</p>
        </div>
      )}
    </div>
  );
}
