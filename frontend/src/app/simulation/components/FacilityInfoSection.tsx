'use client';

import React from 'react';
import CommonButton from '@/components/ui/CommonButton';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import type { Facility } from '../types';

interface FacilityInfoSectionProps {
  facility: Facility;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  deleteError: string | null;
  statusBadgeClass: string;
  statusLabel: string;
  processBadgeClass: string;
  processLabel: string;
  formattedInstallDate: string;
  isDeleting: boolean;
  onClose: () => void;
  onDelete: () => void;
  onOpenEditModal: () => void;
  onAddToPerformanceComparison: () => void;
  onDragStartPerformance: () => void;
  onDragEndPerformance: () => void;
  onToggleTaskSections: () => void;
  isTaskSectionVisible: boolean;
}

export default function FacilityInfoSection({
  facility,
  isAdmin,
  isLoading,
  error,
  deleteError,
  statusBadgeClass,
  statusLabel,
  processBadgeClass,
  processLabel,
  formattedInstallDate,
  isDeleting,
  onClose,
  onDelete,
  onOpenEditModal,
  onAddToPerformanceComparison,
  onDragStartPerformance,
  onDragEndPerformance,
  onToggleTaskSections,
  isTaskSectionVisible,
}: FacilityInfoSectionProps) {
  const renderValue = (value?: string | number | null) =>
    value !== undefined && value !== null && value !== '' ? value : '-';
  const isInactive = facility.status === 'inactive';

  return (
    <CommonContainerBox className="rounded-t-none overflow-hidden">
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-900 break-words flex-1">{facility.name}</h2>
            <div className="relative">
              <button
                type="button"
                className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                  ${isInactive
                    ? 'cursor-not-allowed border border-gray-200 bg-gray-200 text-gray-500'
                    : 'border border-blue-200 bg-blue-50 text-blue-600 hover:border-blue-300 hover:bg-blue-100'}`}
                onClick={() => {
                  if (isInactive) return;
                  onAddToPerformanceComparison();
                }}
                draggable={!isInactive}
                onDragStart={(event) => {
                  if (isInactive) {
                    event.preventDefault();
                    return;
                  }
                  event.dataTransfer.effectAllowed = 'copy';
                  onDragStartPerformance();
                }}
                onDragEnd={(event) => {
                  event.preventDefault();
                  if (isInactive) return;
                  onDragEndPerformance();
                }}
                aria-disabled={isInactive}
                tabIndex={isInactive ? -1 : 0}
                onMouseEnter={(event) => {
                  if (!isInactive) return;
                  const tooltip = event.currentTarget.parentElement?.querySelector('[data-tooltip]');
                  if (tooltip instanceof HTMLElement) {
                    tooltip.style.opacity = '1';
                    tooltip.style.visibility = 'visible';
                  }
                }}
                onMouseLeave={(event) => {
                  if (!isInactive) return;
                  const tooltip = event.currentTarget.parentElement?.querySelector('[data-tooltip]');
                  if (tooltip instanceof HTMLElement) {
                    tooltip.style.opacity = '0';
                    tooltip.style.visibility = 'hidden';
                  }
                }}
              >
              성능 비교
              </button>
              <div
                data-tooltip
                className="pointer-events-none absolute top-1/2 left-full w-max -translate-y-1/2 translate-x-2 rounded-md bg-gray-900 px-3 py-1 text-[11px] font-medium text-white shadow transition-opacity duration-150"
                style={{ opacity: 0, visibility: 'hidden' }}
              >
                고장 설비는 성능 비교가 불가능합니다.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <CommonButton onClick={onOpenEditModal} variant="blue" className="px-4 py-2 text-sm">
                  수정
                </CommonButton>
                <CommonButton onClick={onDelete} disabled={isDeleting} variant="red" className="px-4 py-2 text-sm">
                  {isDeleting ? '삭제 중...' : '삭제'}
                </CommonButton>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="ml-2 rounded-full p-2 text-gray-400 transition-colors hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="설비 상세 닫기"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="text-gray-500">설비 상세 정보를 불러오는 중...</div>
        </div>
      )}

      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
      {deleteError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 text-sm">{deleteError}</p>
        </div>
      )}

      {!isLoading && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-6">
            <div className="md:col-span-1">
              <label className="text-sm font-medium text-gray-500 mb-1 block">모델명</label>
              <p className="text-sm text-gray-900">{renderValue(facility.modelName)}</p>
            </div>
            <div className="md:col-span-1">
              <label className="text-sm font-medium text-gray-500 mb-1 block">설비상태</label>
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${statusBadgeClass}`}>{statusLabel}</span>
            </div>
            <div className="md:col-span-1">
              <label className="text-sm font-medium text-gray-500 mb-1 block">진행상태</label>
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${processBadgeClass}`}>{processLabel}</span>
            </div>
            <div className="md:col-span-1">
              <label className="text-sm font-medium text-gray-500 mb-1 block">설치일</label>
              <p className="text-sm text-gray-900">{renderValue(formattedInstallDate)}</p>
            </div>
            <div className="md:col-span-1">
              <label className="text-sm font-medium text-gray-500 mb-1 block">위치</label>
              <p className="text-sm text-gray-900">
                {facility.canvasX !== undefined && facility.canvasY !== undefined
                  ? `X: ${facility.canvasX}, Y: ${facility.canvasY}`
                  : '-'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 items-start">
            <div>
              <label className="text-sm font-medium text-gray-500 mb-1 block">CPU</label>
              <p className="text-sm text-gray-900">{renderValue(facility.cpu)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 mb-1 block">GPU</label>
              <p className="text-sm text-gray-900">{renderValue(facility.gpu)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 mb-1 block">RAM</label>
              <p className="text-sm text-gray-900">{renderValue(facility.ram)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 mb-1 block">VRAM</label>
              <p className="text-sm text-gray-900">{renderValue(facility.vram)}</p>
            </div>
            <div className="flex items-center justify-end">
              <CommonButton
                type="button"
                variant={isTaskSectionVisible ? 'gray' : 'blue'}
                className="px-4 py-2 text-sm"
                onClick={onToggleTaskSections}
              >
                {isTaskSectionVisible ? '닫기' : '작업조회'}
              </CommonButton>
            </div>
          </div>
        </>
      )}
    </CommonContainerBox>
  );
}

