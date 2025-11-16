'use client';

import React, { useEffect, useState } from 'react';
import CommonButton from '@/components/ui/CommonButton';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import type { Facility } from '../types';
import { startInkjetPrinter, completeInkjetJob, getInkjetJobs } from '@/service/inkjet';

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
  onDelete: () => void;
  onOpenEditModal: () => void;
  onAddToPerformanceComparison: () => void;
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
  onDelete,
  onOpenEditModal,
  onAddToPerformanceComparison,
  onToggleTaskSections,
  isTaskSectionVisible,
}: FacilityInfoSectionProps) {
  const renderValue = (value?: string | number | null) =>
    value !== undefined && value !== null && value !== '' ? value : '-';
  const isPerformanceDisabled = facility.status === 'inactive' || facility.status === 'maintenance';
  const [isStarting, setIsStarting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [jobHistoryUuid, setJobHistoryUuid] = useState<string | null>(null);
  const isRunning = facility.processStatus === 'RUNNING';

  // RUNNING 상태로 진입했지만 jobHistoryUuid를 모를 때 최근 작업의 jobUuid를 사용하여 보완
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isRunning || jobHistoryUuid) return;
      try {
        const res = await getInkjetJobs(facility.id, { page: 0, size: 1 });
        const list = res?.result?.content?.content ?? [];
        const latest = list[0];
        if (!cancelled && latest?.jobUuid) {
          // 백엔드에서 완료 API는 jobHistoryUuid를 요구하지만 목록의 필드명이 jobUuid인 경우가 있어
          // 동일 식별자로 간주하고 사용 (스키마 정리 전 임시 보완)
          setJobHistoryUuid(latest.jobUuid);
        }
      } catch (e) {
        console.warn('최근 작업 조회 실패 (완료 버튼 보완용):', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [facility.id, isRunning, jobHistoryUuid]);

  const handleStart = async () => {
    try {
      setIsStarting(true);
      const res = await startInkjetPrinter(facility.id);
      const uuid = res?.result?.jobHistoryUuid;
      if (uuid) setJobHistoryUuid(uuid);
      // 간단 알림 (필요 시 CommonToast로 대체 가능)
      console.log('설비 가동 요청 성공');
    } catch (err) {
      console.error('설비 가동 요청 실패:', err);
    } finally {
      setIsStarting(false);
    }
  };

  const handleComplete = async () => {
    if (!jobHistoryUuid) {
      console.warn('jobHistoryUuid가 없어 완료 요청을 보낼 수 없습니다.');
      return;
    }
    try {
      setIsCompleting(true);
      await completeInkjetJob(facility.id, jobHistoryUuid);
      console.log('설비 가동 완료 요청 성공');
    } catch (err) {
      console.error('설비 가동 완료 요청 실패:', err);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <CommonContainerBox className="flex max-h-[220px] flex-col">
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-bold text-gray-900 break-words">{facility.name}</h2>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <CommonButton
                  type="button"
                  variant={isTaskSectionVisible ? 'gray' : 'blue'}
                  className="px-4 py-2 text-sm"
                  onClick={onToggleTaskSections}
                >
                  {isTaskSectionVisible ? '작업닫기' : '작업조회'}
                </CommonButton>
                <div
                  className="relative"
                  onMouseEnter={(event) => {
                    if (!isPerformanceDisabled) return;
                    const tooltip = event.currentTarget.querySelector('[data-tooltip]');
                    if (tooltip instanceof HTMLElement) {
                      tooltip.style.opacity = '1';
                      tooltip.style.visibility = 'visible';
                      const rect = event.currentTarget.getBoundingClientRect();
                      tooltip.style.left = `${event.clientX - rect.left}px`;
                      tooltip.style.top = `${event.clientY - rect.top + 12}px`;
                    }
                  }}
                  onMouseMove={(event) => {
                    if (!isPerformanceDisabled) return;
                    const tooltip = event.currentTarget.querySelector('[data-tooltip]');
                    if (tooltip instanceof HTMLElement) {
                      const rect = event.currentTarget.getBoundingClientRect();
                      tooltip.style.left = `${event.clientX - rect.left}px`;
                      tooltip.style.top = `${event.clientY - rect.top + 12}px`;
                    }
                  }}
                  onMouseLeave={(event) => {
                    if (!isPerformanceDisabled) return;
                    const tooltip = event.currentTarget.querySelector('[data-tooltip]');
                    if (tooltip instanceof HTMLElement) {
                      tooltip.style.opacity = '0';
                      tooltip.style.visibility = 'hidden';
                    }
                  }}
                >
                  <CommonButton
                    type="button"
                    variant={isPerformanceDisabled ? 'gray' : 'blue'}
                    className="px-5 py-2 text-sm"
                    onClick={() => {
                      if (isPerformanceDisabled) return;
                      onAddToPerformanceComparison();
                    }}
                    aria-disabled={isPerformanceDisabled}
                    tabIndex={isPerformanceDisabled ? -1 : 0}
                    disabled={isPerformanceDisabled}
                  >
                    설비선택
                  </CommonButton>
                  <div
                    data-tooltip
                    className="pointer-events-none absolute z-10 w-max -translate-x-1/2 rounded-md bg-gray-900 px-3 py-1 text-[11px] font-medium text-white shadow transition-opacity duration-150"
                    style={{ opacity: 0, visibility: 'hidden', top: '100%', left: '50%' }}
                  >
                    고장 또는 점검 설비는 성능 비교가 불가능합니다.
                  </div>
                </div>
                {isAdmin && (
                  <>
                    <CommonButton onClick={onOpenEditModal} variant="blue" className="px-5 py-2 text-sm">
                      수정
                    </CommonButton>
                    <CommonButton onClick={onDelete} disabled={isDeleting} variant="red" className="px-5 py-2 text-sm">
                      {isDeleting ? '삭제 중...' : '삭제'}
                    </CommonButton>
                    {isRunning ? (
                      <CommonButton
                        onClick={handleComplete}
                        disabled={isCompleting || !jobHistoryUuid}
                        variant="blue"
                        className="px-5 py-2 text-sm"
                      >
                        {isCompleting ? '완료 중...' : '완료'}
                      </CommonButton>
                    ) : (
                      <CommonButton
                        onClick={handleStart}
                        disabled={isStarting}
                        variant="blue"
                        className="px-5 py-2 text-sm"
                      >
                        {isStarting ? '가동 중...' : '가동'}
                      </CommonButton>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          {isLoading && (
            <div className="flex justify-center items-center py-4">
              <div className="text-gray-500">설비 상세 정보를 불러오는 중...</div>
            </div>
          )}

          {error && !isLoading && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          {deleteError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-800">{deleteError}</p>
            </div>
          )}

          {!isLoading && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">모델명</label>
                  <p className="text-sm text-gray-900">{renderValue(facility.modelName)}</p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">설비상태</label>
                  <span className={`inline-block rounded px-2 py-1 text-xs font-medium ${statusBadgeClass}`}>{statusLabel}</span>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">진행상태</label>
                  <span className={`inline-block rounded px-2 py-1 text-xs font-medium ${processBadgeClass}`}>{processLabel}</span>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">설치일</label>
                  <p className="text-sm text-gray-900">{renderValue(formattedInstallDate)}</p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">위치</label>
                  <p className="text-sm text-gray-900">
                    {facility.canvasX !== undefined && facility.canvasY !== undefined
                      ? `X: ${facility.canvasX}, Y: ${facility.canvasY}`
                      : '-'}
                  </p>
                </div>
              </div>

              <div className="grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">CPU</label>
                  <p className="text-sm text-gray-900">{renderValue(facility.cpu)}</p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">GPU</label>
                  <p className="text-sm text-gray-900">{renderValue(facility.gpu)}</p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">RAM</label>
                  <p className="text-sm text-gray-900">{renderValue(facility.ram)}</p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">VRAM</label>
                  <p className="text-sm text-gray-900">{renderValue(facility.vram)}</p>
                </div>
                
              </div>
            </div>
          )}
        </div>
      </div>
    </CommonContainerBox>
  );
}

