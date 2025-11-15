import React from 'react';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import CommonButton from '@/components/ui/CommonButton';
import type { BmpDetailResult } from '@/types/imageGenerator';

export interface PrintSimulationPlanEntry {
  motherGlassName: string;
  sheetCount: number;
  assignments: {
    assignmentId: string;
    printerUuid?: string;
    printerName: string;
    modelName: string;
    assignedSheets: number;
  }[];
}

interface PrintSimulationPlanProps {
  plan: PrintSimulationPlanEntry[];
  selectedAssignments: Record<string, BmpDetailResult | undefined>;
  onRequestImport: (params: { motherGlassName: string; assignment: PrintSimulationPlanEntry['assignments'][number] }) => void;
  onClearSelection: (assignmentId: string) => void;
  onConfirm: () => void;
  isConfirmDisabled: boolean;
  isConfirmed: boolean;
}

function getPrintablePixels(detail: BmpDetailResult | undefined) {
  if (!detail) {
    return null;
  }
  const red = detail.redCountX * detail.redCountY * detail.redSizeX * detail.redSizeY;
  const green = detail.greenCountX * detail.greenCountY * detail.greenSizeX * detail.greenSizeY;
  const blue = detail.blueCountX * detail.blueCountY * detail.blueSizeX * detail.blueSizeY;
  return red + green + blue;
}

function formatKst(datetime?: string | null) {
  if (!datetime) {
    return '-';
  }
  const hasTimezone = /[Zz]|[+-]\d{2}:\d{2}$/.test(datetime);
  const normalized = hasTimezone ? datetime : `${datetime}Z`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return datetime;
  }
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function PrintSimulationPlan({
  plan,
  selectedAssignments,
  onRequestImport,
  onClearSelection,
  onConfirm,
  isConfirmDisabled,
  isConfirmed,
}: PrintSimulationPlanProps) {
  if (plan.length === 0) {
    return null;
  }

  return (
    <CommonContainerBox className="px-4 py-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">설비별 인쇄 계획</h3>
        <p className="mt-1 text-sm text-gray-500">
          확정된 배치 결과와 현재 설비 가용 현황을 기반으로 설비별 인쇄 장수를 배정했습니다.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#0059FF]/20">
        <div className="min-w-[800px] grid grid-cols-[1.2fr_1fr_1fr_1.2fr_1.2fr] gap-2 border-b border-[#0059FF]/10 bg-[#0059FF]/5 px-4 py-2 text-sm font-semibold text-[#0059FF] text-center">
          <span>원장 세대</span>
          <span>총 인쇄 수량</span>
          <span>사용 가능 설비</span>
          <span>배정 설비명</span>
          <span>배정 수량</span>
        </div>
        <div className="divide-y divide-[#0059FF]/10 text-sm text-gray-700">
          {plan.map((entry) => {
            const effectiveAssignments = entry.assignments.filter((assignment) => assignment.assignedSheets > 0);
            const printerNames =
              effectiveAssignments.length === 0
                ? '-'
                : effectiveAssignments.map((assignment) => assignment.printerName).join('\n');
            const assignedCounts =
              effectiveAssignments.length === 0
                ? '-'
                : effectiveAssignments.map((assignment) => `${assignment.assignedSheets.toLocaleString()} 장`).join('\n');
            return (
              <div key={`print-plan-${entry.motherGlassName}`} className="min-w-[800px] grid grid-cols-[1.2fr_1fr_1fr_1.2fr_1.2fr] gap-2 px-4 py-3">
                <span className="text-center text-sm font-semibold text-gray-900">{entry.motherGlassName}</span>
                <span className="text-right text-gray-900">{entry.sheetCount.toLocaleString()} 장</span>
                <span className="text-right text-gray-700">{effectiveAssignments.length.toLocaleString()} 대</span>
                <span className="whitespace-pre-line text-right text-gray-700">{printerNames}</span>
                <span className="whitespace-pre-line text-right text-gray-700">{assignedCounts}</span>
              </div>
            );
          })}
        </div>
      </div>

      {(plan.some((entry) => entry.assignments.some((assignment) => assignment.assignedSheets > 0)) || !isConfirmed) && (
        <div className="mt-6 space-y-4">
          {plan.some((entry) => entry.assignments.some((assignment) => assignment.assignedSheets > 0)) && (
            <>
              <h4 className="text-lg font-semibold text-gray-900">인쇄 이미지 등록</h4>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {plan.flatMap((entry) =>
                  entry.assignments
                    .filter((assignment) => assignment.assignedSheets > 0)
                    .map((assignment) => {
                      const detail = selectedAssignments[assignment.assignmentId];
                      const hasSelection = Boolean(detail);
                      const isImportDisabled = assignment.assignedSheets === 0;
                      const handleOpenModal = () => {
                        if (isImportDisabled) {
                          return;
                        }
                        onRequestImport({ motherGlassName: entry.motherGlassName, assignment });
                      };
                      return (
                        <div
                          key={`${entry.motherGlassName}-${assignment.assignmentId}`}
                          onClick={handleOpenModal}
                          className={`rounded-lg border px-4 py-3 transition-transform duration-200 ${
                            hasSelection
                              ? 'border-blue-200 bg-blue-50 hover:-translate-y-1 hover:shadow-md'
                              : 'border-gray-200 bg-white hover:-translate-y-1 hover:border-blue-200 hover:shadow-md'
                          }`}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {assignment.printerName}{' '}
                                <span className="text-xs text-gray-500">({assignment.modelName})</span>
                              </div>
                              <div className="text-xs text-gray-500">
                                {entry.motherGlassName} · 배정 {assignment.assignedSheets.toLocaleString()} 장
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {hasSelection ? (
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    onRequestImport({ motherGlassName: entry.motherGlassName, assignment });
                                  }}
                                  className="rounded-md border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-600 hover:border-blue-300 hover:bg-blue-50"
                                >
                                  재선택
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    onRequestImport({ motherGlassName: entry.motherGlassName, assignment });
                                  }}
                                  disabled={isImportDisabled}
                                  className={`rounded-md border px-3 py-1 text-xs font-semibold ${
                                    isImportDisabled
                                      ? 'cursor-not-allowed border-gray-200 text-gray-400'
                                      : 'border-blue-200 text-blue-600 hover:border-blue-300 hover:bg-blue-50'
                                  }`}
                                >
                                  선택
                                </button>
                              )}
                            </div>
                          </div>
                          {hasSelection ? (
                            <div className="mt-2 text-xs text-gray-600">
                              <span>실제 인쇄 픽셀 {getPrintablePixels(detail)?.toLocaleString()}</span>
                            </div>
                          ) : (
                            <div className="mt-2 text-xs text-gray-400">
                              이미지 정보를 가져오면 잉크 사용량 계산에 반영됩니다.
                            </div>
                          )}
                        </div>
                      );
                    }),
                )}
              </div>
            </>
          )}

          <div className="relative flex justify-end">
            <div
              className="relative"
              onMouseEnter={(event) => {
                if (!isConfirmDisabled) return;
                const tooltip = event.currentTarget.querySelector('[data-tooltip]');
                if (tooltip instanceof HTMLElement) {
                  const rect = event.currentTarget.getBoundingClientRect();
                  const tooltipWidth = tooltip.offsetWidth || 200;
                  tooltip.style.opacity = '1';
                  tooltip.style.visibility = 'visible';
                  tooltip.style.left = `${event.clientX - rect.left - tooltipWidth - 8}px`;
                  tooltip.style.top = `${event.clientY - rect.top - 8}px`;
                }
              }}
              onMouseMove={(event) => {
                if (!isConfirmDisabled) return;
                const tooltip = event.currentTarget.querySelector('[data-tooltip]');
                if (tooltip instanceof HTMLElement) {
                  const rect = event.currentTarget.getBoundingClientRect();
                  const tooltipWidth = tooltip.offsetWidth || 200;
                  tooltip.style.left = `${event.clientX - rect.left - tooltipWidth - 8}px`;
                  tooltip.style.top = `${event.clientY - rect.top - 8}px`;
                }
              }}
              onMouseLeave={(event) => {
                if (!isConfirmDisabled) return;
                const tooltip = event.currentTarget.querySelector('[data-tooltip]');
                if (tooltip instanceof HTMLElement) {
                  tooltip.style.opacity = '0';
                  tooltip.style.visibility = 'hidden';
                }
              }}
            >
              <CommonButton
                variant="blue"
                disabled={isConfirmDisabled}
                onClick={onConfirm}
                className="px-4 py-2 text-sm font-semibold"
              >
                확인
              </CommonButton>
              {isConfirmDisabled && (
                <div
                  data-tooltip
                  className="pointer-events-none absolute z-10 w-max rounded-md bg-gray-900 px-3 py-1 text-[11px] font-medium text-white shadow transition-opacity duration-150"
                  style={{ opacity: 0, visibility: 'hidden' }}
                >
                  설비를 클릭한 뒤 인쇄할 이미지 정보를 등록해 주세요.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500">
        * 설비가 부족한 경우 추가 설비 투입 또는 배치 계획 수정을 검토해주세요.
      </p>
    </CommonContainerBox>
  );
}
