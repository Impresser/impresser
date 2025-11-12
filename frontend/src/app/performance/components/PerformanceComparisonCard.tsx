'use client';

import React from 'react';
import Image from 'next/image';
import type { Facility } from '../types';
import CommonButton from '@/components/ui/CommonButton';
import FacilityQueueSection from './FacilityQueueSection';
import type { QueueItem } from '@/components/ui/CommonTable';

interface PerformanceComparisonCardProps {
  facility: Facility | null;
  slotIndex: number;
  onRemove: () => void;
  onAddTask?: (
    facility: Facility,
    settings: {
      processingMethod: 'cpu' | 'gpu';
      algorithm: string;
      version: string;
    }
  ) => void;
  queueItems?: QueueItem[];
  processingItems?: QueueItem[];
  overallProgress?: number;
  settings: {
    processingMethod: 'cpu' | 'gpu';
    algorithm: string;
    version: string;
  };
}

export default function PerformanceComparisonCard({
  facility,
  slotIndex,
  onRemove,
  onAddTask,
  queueItems,
  processingItems,
  overallProgress,
  settings,
}: PerformanceComparisonCardProps) {
  return (
    <div
      className={`rounded-2xl transition-colors ${
        facility
          ? 'border border-gray-200 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)]'
          : 'border-2 border-gray-200 border-dashed bg-white/60'
      }`}
      role="listitem"
      aria-label={facility ? `${facility.name} 성능 비교 슬롯` : `성능 비교 슬롯 ${slotIndex + 1}`}
      tabIndex={0}
    >
      {facility ? (
        <div className="relative px-6 py-6">
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
            <p className="text-lg font-semibold text-gray-900">{facility.name}</p>
            <div className="flex flex-col gap-4 md:flex-row md:gap-6">
              <div
                className="relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-gray-100 md:w-1/2"
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
                    <span className="font-medium text-gray-500">모델명</span>
                    <span>{facility.modelName || '-'}</span>
                  </p>
                </div>
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
          <div className="mt-6">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-800">작업대기열</h4>
            </div>
            <FacilityQueueSection
              queueItems={queueItems ?? []}
              processingItems={processingItems ?? []}
              overallProgress={overallProgress ?? 0}
              isLoading={false}
              withContainer={false}
              showTitle={false}
            />
          </div>
        </div>
      ) : (
        <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 text-sm text-gray-500">
          <div className="rounded-full bg-gray-100 p-3 text-gray-400">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <p className="font-medium text-gray-600">설비를 선택해 비교 슬롯에 추가하세요</p>
          <p className="text-xs text-gray-400">상세 정보에서 압축하기 버튼을 사용하세요</p>
        </div>
      )}
    </div>
  );
}

