'use client';

import React from 'react';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import type { MotherGlass } from '../data/motherGlasses';
import {
  GENERATION_CONFIG,
  STATUS_ORDER,
  type GenerationLabel,
  type GenerationStats,
  type GenerationStatsMap,
  type PrinterStatusKey,
} from '../utils/motherGlassAvailability';

interface MotherGlassInfoListProps {
  motherGlasses: MotherGlass[];
  className?: string;
  generationStats: GenerationStatsMap;
  totalAvailable: number;
  loading: boolean;
  error: string | null;
}

const STATUS_LABELS: Record<PrinterStatusKey, string> = {
  OPERATIONAL: '정상',
  UNDER_REPAIR: '점검중',
  BROKEN: '고장',
};

const STATUS_BADGE_STYLES: Record<PrinterStatusKey, string> = {
  OPERATIONAL: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  UNDER_REPAIR: 'bg-amber-50 text-amber-700 border border-amber-200',
  BROKEN: 'bg-rose-50 text-rose-700 border border-rose-200',
};

const STATUS_BADGE_DISABLED = 'border border-gray-300 bg-gray-200 text-gray-500';

export default function MotherGlassInfoList({
  motherGlasses,
  className = '',
  generationStats,
  totalAvailable,
  loading,
  error,
}: MotherGlassInfoListProps) {
  const motherGlassMap = React.useMemo(() => {
    return motherGlasses.reduce<Record<GenerationLabel, MotherGlass>>((acc, motherGlass) => {
      acc[motherGlass.generationName as GenerationLabel] = motherGlass;
      return acc;
    }, {} as Record<GenerationLabel, MotherGlass>);
  }, [motherGlasses]);

  const maxWidthMm = React.useMemo(() => {
    if (motherGlasses.length === 0) {
      return 1;
    }
    return motherGlasses.reduce((max, motherGlass) => Math.max(max, motherGlass.widthMm), 0);
  }, [motherGlasses]);

  const getStats = (label: GenerationLabel): GenerationStats => {
    const stats = generationStats[label];
    if (stats) {
      return stats;
    }
    return {
      total: 0,
      available: 0,
      byStatus: {
        OPERATIONAL: 0,
        UNDER_REPAIR: 0,
        BROKEN: 0,
      },
    };
  };

  return (
    <section className={`${className}`}>
      <CommonContainerBox className="space-y-6 px-4 py-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">가용 설비 현황</h3>
          <p className="mt-1 text-sm text-gray-500">
            인쇄 설비 목록을 조회하여 모델명 기준 세대별로 정상 설비 대수를 집계하고, 해당 세대의 대표 원장 규격을 시각적으로
            제공합니다. 정상 상태 설비만 실제 배치에 활용할 수 있습니다.
          </p>

          {loading ? (
            <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
              설비 정보를 불러오는 중입니다...
            </div>
          ) : error ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                현재 사용 가능한 설비는 총 <span className="font-semibold text-blue-900">{totalAvailable.toLocaleString()}대</span>
                입니다.
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {GENERATION_CONFIG.map((config) => {
                  const stats = getStats(config.label);
                  const isAvailable = stats.available > 0;
                  const cardBaseClass = isAvailable
                    ? 'border-gray-200 bg-white'
                    : 'border-gray-200 bg-gray-100 text-gray-500';
                  const availabilityHighlightClass = isAvailable
                    ? 'border-blue-200 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-gray-200 text-gray-500';
                  return (
                    <div
                      key={config.label}
                      className={`flex flex-col rounded-xl border p-4 shadow-sm transition-colors ${cardBaseClass}`}
                      aria-disabled={!isAvailable}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-base font-semibold ${isAvailable ? 'text-gray-900' : 'text-gray-500'}`}>
                          {config.label}
                        </span>
                        <span className={`text-sm font-medium ${isAvailable ? 'text-gray-500' : 'text-gray-400'}`}>
                          총 {stats.total.toLocaleString()}대
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {STATUS_ORDER.map((status) => (
                          <div
                            key={status}
                            className={`flex min-h-[38px] items-center justify-between rounded-lg px-3 py-2 text-sm font-medium ${
                              isAvailable ? STATUS_BADGE_STYLES[status] : STATUS_BADGE_DISABLED
                            }`}
                          >
                            <span>{STATUS_LABELS[status]}</span>
                            <span className="font-semibold">{stats.byStatus[status].toLocaleString()}대</span>
                          </div>
                        ))}
                      </div>

                      <div
                        className={`mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-right ${availabilityHighlightClass}`}
                      >
                        사용 가능: {stats.available.toLocaleString()}대
                        {!isAvailable && <span className="ml-1 font-normal">(사용불가)</span>}
                      </div>

                      {motherGlassMap[config.label] && maxWidthMm > 0 && (
                        <div className="mt-4">
                          <div className="mt-2 flex justify-center">
                            {(() => {
                              const motherGlass = motherGlassMap[config.label];
                              const baseWidthPx = 200;
                              const widthRatio = motherGlass.widthMm / maxWidthMm;
                              const previewWidth = Math.max(60, baseWidthPx * widthRatio);
                              const previewHeight = previewWidth * (motherGlass.heightMm / motherGlass.widthMm);

                              return (
                                <div
                                  className="flex flex-col items-center gap-1"
                                  style={{ width: `${previewWidth}px` }}
                                >
                                  <div
                                    className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 bg-gray-50 text-center"
                                    style={{
                                      width: `${previewWidth}px`,
                                      height: `${previewHeight}px`,
                                    }}
                                  >
                                    <span className="text-sm font-semibold text-gray-700">{motherGlass.generationName}</span>
                                    <span className="text-xs text-gray-500 leading-tight">
                                      {motherGlass.widthMm.toLocaleString()}mm × {motherGlass.heightMm.toLocaleString()}mm
                                    </span>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </CommonContainerBox>
    </section>
  );
}
