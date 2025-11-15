'use client';

import React from 'react';
import Image from 'next/image';
import type { Facility } from '../types';

interface PerformanceSimulatorCardProps {
  facility: Facility | null;
  slotIndex: number;
  onRemove: () => void;
  settings: {
    processingMethod: 'cpu' | 'gpu';
    algorithm: string;
    version: string;
  };
  onClick?: () => void;
}

export default function PerformanceSimulatorCard({
  facility,
  slotIndex,
  onRemove,
  settings,
  onClick,
}: PerformanceSimulatorCardProps) {
  return (
    <div
      className={`rounded-2xl transition-all w-full ${
        facility
          ? 'border border-gray-200 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)]'
          : `border-2 border-dashed bg-white/60 cursor-pointer h-full flex flex-col ${
              onClick ? 'border-gray-200 hover:border-blue-500 hover:bg-blue-50/30' : 'border-gray-200'
            }`
      }`}
      role="listitem"
      aria-label={facility ? `${facility.name} 성능 비교 슬롯` : `성능 비교 슬롯 ${slotIndex + 1}`}
      tabIndex={onClick && !facility ? 0 : undefined}
      onClick={(e) => {
        if (onClick && !facility) {
          e.preventDefault();
          e.stopPropagation();
          onClick();
        }
      }}
      onKeyDown={(e) => {
        if (onClick && !facility && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          e.stopPropagation();
          onClick();
        }
      }}
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
        </div>
      ) : (
        <div className="relative px-6 py-6 h-full flex items-center justify-center">
          <div className="flex flex-col items-center justify-center gap-4 text-center w-full">
            <div className="rounded-full bg-gray-100 p-4 text-gray-400">
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="space-y-2">
              <p className="text-lg font-semibold text-gray-900">설비를 선택해주세요</p>
              <div className="text-sm text-gray-600 leading-relaxed space-y-1">
                <p>
                  상단의 <span className="font-semibold text-blue-600">"성능비교"</span> 버튼을 클릭하거나,
                </p>
                <p>
                  설비 상세 패널의 <span className="font-semibold text-blue-600">"설비선택"</span> 버튼을 통해 설비를 선택할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

