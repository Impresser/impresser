import React, { useMemo } from 'react';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import type { PrintSimulationPlanEntry } from './PrintSimulationPlan';
import type { BmpDetailResult } from '@/types/imageGenerator';
import type { SelectedGoal } from './SelectedGoalList';
import {
  INK_TANK_CAPACITY_ML,
  INK_REFILL_TIME_MINUTES,
} from '../data/inkConfig';

interface InkConsumptionSummaryProps {
  plan: PrintSimulationPlanEntry[];
  selectedAssignments: Record<string, BmpDetailResult | undefined>;
  compressionTimeSeconds: number | null; // 압축 시간 (장당 초, null이면 기본값 사용)
  compressionTimeSlow: number | null; // 느린 압축 시간 (단축률 계산용)
  printTimeSeconds: number; // 인쇄 시간 (장당 초)
  confirmedGoals: SelectedGoal[]; // 확정된 생산 목표 (제품 및 수량)
}

function formatMinutes(value: number) {
  return value <= 0 ? '0분' : `${Math.ceil(value)}분`;
}

function formatDurationDetail(value: number) {
  if (value <= 60) {
    return '';
  }
  if (value <= 0) {
    return '0일 0시간 0분';
  }
  const minutes = Math.ceil(value);
  const days = Math.floor(minutes / (60 * 24));
  const remainingMinutesAfterDays = minutes % (60 * 24);
  const hours = Math.floor(remainingMinutesAfterDays / 60);
  const mins = remainingMinutesAfterDays % 60;
  const parts: string[] = [];
  if (days > 0) {
    parts.push(`${days}일`);
  }
  if (hours > 0) {
    parts.push(`${hours}시간`);
  }
  if (mins > 0 || parts.length === 0) {
    parts.push(`${mins}분`);
  }
  return parts.join(' ');
}

const PIXELS_PER_ML = 1000;

function computeColorUsage(detail: BmpDetailResult, color: 'red' | 'green' | 'blue', sheets: number) {
  const countX = detail[`${color}CountX` as const] ?? 0;
  const countY = detail[`${color}CountY` as const] ?? 0;
  const sizeX = detail[`${color}SizeX` as const] ?? 0;
  const sizeY = detail[`${color}SizeY` as const] ?? 0;
  const pixelsPerSheet = Math.max(countX, 0) * Math.max(countY, 0) * Math.max(sizeX, 0) * Math.max(sizeY, 0);
  const totalPixels = pixelsPerSheet * Math.max(sheets, 0);
  const usageMl = totalPixels / PIXELS_PER_ML;
  return { pixelsPerSheet, totalPixels, usageMl };
}

function computeRemainingAfterUsage(usageMl: number) {
  if (usageMl <= 0) {
    return {
      remainingMl: INK_TANK_CAPACITY_ML,
      percent: 100,
    };
  }

  const mod = usageMl % INK_TANK_CAPACITY_ML;
  if (mod === 0) {
    return {
      remainingMl: 0,
      percent: 0,
    };
  }

  const remainingMl = INK_TANK_CAPACITY_ML - mod;
  return {
    remainingMl,
    percent: (remainingMl / INK_TANK_CAPACITY_ML) * 100,
  };
}

export default function InkConsumptionSummary({ 
  plan, 
  selectedAssignments,
  compressionTimeSeconds,
  compressionTimeSlow,
  printTimeSeconds,
  confirmedGoals,
}: InkConsumptionSummaryProps) {
  // 압축 시간 기본값 (데이터가 없을 경우)
  const DEFAULT_COMPRESSION_TIME_SECONDS = 5;
  const actualCompressionTimeSeconds = compressionTimeSeconds ?? DEFAULT_COMPRESSION_TIME_SECONDS;
  
  const printerMetrics = useMemo(() => {
    return plan.flatMap((entry) =>
      entry.assignments.map((assignment) => {
        const assignedSheets = assignment.assignedSheets;
        const detail = selectedAssignments[assignment.assignmentId];
        const sheets = assignedSheets;

        const redUsage = detail ? computeColorUsage(detail, 'red', sheets) : { pixelsPerSheet: 0, totalPixels: 0, usageMl: 0 };
        const greenUsage = detail ? computeColorUsage(detail, 'green', sheets) : { pixelsPerSheet: 0, totalPixels: 0, usageMl: 0 };
        const blueUsage = detail ? computeColorUsage(detail, 'blue', sheets) : { pixelsPerSheet: 0, totalPixels: 0, usageMl: 0 };

        const usagePerColor = {
          red: redUsage.usageMl,
          green: greenUsage.usageMl,
          blue: blueUsage.usageMl,
        };

        const totalUsageMl = redUsage.usageMl + greenUsage.usageMl + blueUsage.usageMl;
        const totalPixels = redUsage.totalPixels + greenUsage.totalPixels + blueUsage.totalPixels;

        const remainingPerColor = {
          red: computeRemainingAfterUsage(redUsage.usageMl),
          green: computeRemainingAfterUsage(greenUsage.usageMl),
          blue: computeRemainingAfterUsage(blueUsage.usageMl),
        };

        const refillCounts = {
          red: Math.max(0, Math.ceil(redUsage.usageMl / INK_TANK_CAPACITY_ML) - 1),
          green: Math.max(0, Math.ceil(greenUsage.usageMl / INK_TANK_CAPACITY_ML) - 1),
          blue: Math.max(0, Math.ceil(blueUsage.usageMl / INK_TANK_CAPACITY_ML) - 1),
        };
        const totalRefillEvents = refillCounts.red + refillCounts.green + refillCounts.blue;
        const refillTime = totalRefillEvents * INK_REFILL_TIME_MINUTES;
        const printTime = (assignedSheets * printTimeSeconds) / 60; // 분 단위
        const compressionTime = (assignedSheets * actualCompressionTimeSeconds) / 60; // 분 단위
        const totalTime = refillTime + printTime + compressionTime;

        return {
          motherGlassName: entry.motherGlassName,
          printerName: assignment.printerName,
          modelName: assignment.modelName,
          assignedSheets,
          usagePerColor,
          remainingPerColor,
          refillEventsPerColor: refillCounts,
          totalRefillEvents,
          refillTime,
          printTime,
          compressionTime,
          totalTime,
          totalUsageMl,
          totalPixels,
        };
      }),
    ).filter((metric) => metric.assignedSheets > 0);
  }, [plan, selectedAssignments, printTimeSeconds, actualCompressionTimeSeconds]);

  const totals = useMemo(() => {
    return printerMetrics.reduce(
      (acc, metric) => {
        acc.sheetCount += metric.assignedSheets;
        acc.totalPixels += metric.totalPixels;
        acc.usagePerColor.red += metric.usagePerColor.red;
        acc.usagePerColor.green += metric.usagePerColor.green;
        acc.usagePerColor.blue += metric.usagePerColor.blue;
        acc.refillEvents += metric.totalRefillEvents;
        acc.refillEventsPerColor.red += metric.refillEventsPerColor.red;
        acc.refillEventsPerColor.green += metric.refillEventsPerColor.green;
        acc.refillEventsPerColor.blue += metric.refillEventsPerColor.blue;
        acc.refillTime += metric.refillTime;
        acc.printTime += metric.printTime;
        acc.compressionTime += metric.compressionTime;
        acc.totalTime += metric.totalTime;
        return acc;
      },
      {
        sheetCount: 0,
        totalPixels: 0,
        usagePerColor: { red: 0, green: 0, blue: 0 },
        refillEvents: 0,
        refillEventsPerColor: { red: 0, green: 0, blue: 0 },
        refillTime: 0,
        printTime: 0,
        compressionTime: 0,
        totalTime: 0,
      },
    );
  }, [printerMetrics]);

  const totalUsageMl =
    totals.usagePerColor.red + totals.usagePerColor.green + totals.usagePerColor.blue;
  const maxTimes = printerMetrics.reduce(
    (acc, metric) => {
      return {
        total: Math.max(acc.total, metric.totalTime),
        refill: Math.max(acc.refill, metric.refillTime),
        print: Math.max(acc.print, metric.printTime),
        compression: Math.max(acc.compression, metric.compressionTime),
      };
    },
    { total: 0, refill: 0, print: 0, compression: 0 },
  );

  // 느린 압축 방식 대비 빠른 압축 방식으로 인한 생산 시간 단축 퍼센트 계산
  const timeReductionPercent = useMemo(() => {
    if (!compressionTimeSlow || !compressionTimeSeconds || compressionTimeSlow <= compressionTimeSeconds) {
      return null;
    }

    // 가장 오래 걸린 설비의 메트릭 찾기
    const slowestMetric = printerMetrics.find((metric) => metric.totalTime === maxTimes.total);
    if (!slowestMetric) {
      return null;
    }

    // 느린 압축 시간과 빠른 압축 시간 차이 계산 (분 단위)
    const slowCompressionTimeForMetric = (slowestMetric.assignedSheets * compressionTimeSlow) / 60;
    const fastCompressionTimeForMetric = (slowestMetric.assignedSheets * compressionTimeSeconds) / 60;
    
    // 느린 방식 기준 총 생산 시간 = 현재 총 시간 - 빠른 압축 시간 + 느린 압축 시간
    const slowTotalTime = maxTimes.total - slowestMetric.compressionTime + slowCompressionTimeForMetric;
    
    // 빠른 방식 기준 총 생산 시간 (현재 계산된 값)
    const fastTotalTime = maxTimes.total;
    
    if (slowTotalTime <= 0 || slowTotalTime <= fastTotalTime) {
      return null;
    }

    // 단축 퍼센트 = (느린 시간 - 빠른 시간) / 느린 시간 * 100
    const reduction = ((slowTotalTime - fastTotalTime) / slowTotalTime) * 100;
    return Math.max(0, Math.min(100, reduction)); // 0~100% 범위로 제한
  }, [compressionTimeSlow, compressionTimeSeconds, maxTimes, printerMetrics]);

  return (
    <div id="ink-consumption-summary" className="space-y-6">
      {/* 잉크 사용량 섹션 */}
      <CommonContainerBox className="px-4 py-4 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">잉크 사용량 계산</h3>
          <p className="mt-1 text-sm text-gray-500">
            이미지 픽셀 수와 인쇄 수량을 반영해 색상별 잉크 사용량을 계산합니다. 1,000px당 1ml 기준으로 환산합니다.
          </p>
        </div>

      {printerMetrics.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          배정된 설비가 없습니다. 생산 목표를 확정하면 잉크 사용량이 계산됩니다.
        </div>
      ) : (
        <div className="space-y-4">
          {printerMetrics.map((metric) => {
            const totalDetail = formatDurationDetail(metric.totalTime);
            return (
              <React.Fragment key={`${metric.motherGlassName}-${metric.printerName}`}>
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex flex-col gap-4">
                  {/* 설비 정보 - 상단 타이틀 줄 */}
                  <div className="flex flex-wrap items-center gap-4 pb-3 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">{metric.printerName}</h3>
                    <span className="text-sm text-gray-500">모델명: {metric.modelName}</span>
                    <span className="text-sm text-gray-500">
                      {metric.motherGlassName} · {metric.assignedSheets.toLocaleString()} 장 배정
                    </span>
                  </div>

                  {/* 설비 사진, 통계, 잉크 탱크 - 같은 줄 */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
                    {/* 설비 사진 - 왼쪽 */}
                    <div className="h-full min-h-[135px] rounded-lg border border-gray-200 bg-white flex items-center justify-center p-2">
                      <img
                        src="/images/facilities/inkjet_detail01.png"
                        alt={`${metric.printerName} 이미지`}
                        className="max-h-full max-w-full object-contain w-[77%] h-[77%]"
                      />
                    </div>

                    {/* 잉크 탱크 - 가운데 */}
                    <div className="h-full space-y-3 flex flex-col">
                      <div className="text-base font-semibold text-gray-900">
                        잉크 탱크 사용량 (각 탱크 용량 {INK_TANK_CAPACITY_ML.toLocaleString()} ml)
                      </div>
                      <div className="flex flex-col gap-3">
                        {(['red', 'green', 'blue'] as const).map((color) => {
                          const label = color === 'red' ? 'Red' : color === 'green' ? 'Green' : 'Blue';
                          const usage = metric.usagePerColor[color];
                          const remaining = metric.remainingPerColor[color];
                          const remainingPercent = Math.max(0, Math.min(100, remaining.percent));
                          const barColor = color === 'red' ? 'bg-rose-500' : color === 'green' ? 'bg-green-500' : 'bg-blue-500';
                          return (
                            <div key={color}>
                              <div className="flex items-center justify-between text-[14px] text-gray-600 mb-1">
                                <span className={color === 'red' ? 'text-rose-600' : color === 'green' ? 'text-green-600' : 'text-blue-600'}>
                                  {label}
                                </span>
                                <span className="text-gray-500 text-xs">
                                  남은 잉크 {remaining.remainingMl.toLocaleString(undefined, { maximumFractionDigits: 1 })} ml ({remainingPercent.toFixed(1)}%)
                                </span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-gray-200">
                                <div
                                  className={`h-full rounded-full transition-all ${barColor}`}
                                  style={{ width: `${remainingPercent}%` }}
                                />
                              </div>
                              <div className="mt-1 text-[11px] text-gray-400">
                                총 사용 {usage.toLocaleString(undefined, { maximumFractionDigits: 1 })} ml
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 인쇄 통계 - 오른쪽, 파란색 테마 */}
                    <div className="h-full rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 flex flex-col">
                      <div className="text-base font-semibold text-blue-900 mb-3">인쇄 통계</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex flex-col">
                          <span className="text-blue-600 font-semibold mb-1">총 픽셀</span>
                          <span className="text-blue-900 font-medium">{metric.totalPixels.toLocaleString()} px</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-blue-600 font-semibold mb-1">인쇄 수량</span>
                          <span className="text-blue-900 font-medium">{metric.assignedSheets.toLocaleString()} 장</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-blue-600 font-semibold mb-1">총 잉크 사용량</span>
                          <span className="text-blue-900 font-medium">{metric.totalUsageMl.toLocaleString(undefined, { maximumFractionDigits: 1 })} ml</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-blue-600 font-semibold mb-1">충전 횟수</span>
                          <span className="text-blue-900 font-medium">{metric.totalRefillEvents.toLocaleString()} 회</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-blue-600 font-semibold mb-1">압축시간</span>
                          <span className="text-blue-900 font-medium">{formatMinutes(metric.compressionTime)}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-blue-600 font-semibold mb-1">인쇄시간</span>
                          <span className="text-blue-900 font-medium">{formatMinutes(metric.printTime)}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-blue-600 font-semibold mb-1">충전시간</span>
                          <span className="text-blue-900 font-medium">{formatMinutes(metric.refillTime)}</span>
                        </div>
                      </div>
                      {metric.refillEventsPerColor.red > 0 || metric.refillEventsPerColor.green > 0 || metric.refillEventsPerColor.blue > 0 ? (
                        <div className="mt-2 pt-2 border-t border-blue-200 flex flex-wrap gap-2 text-[11px]">
                          {metric.refillEventsPerColor.red > 0 && (
                            <span className="text-rose-600 font-medium">Red {metric.refillEventsPerColor.red.toLocaleString()}회</span>
                          )}
                          {metric.refillEventsPerColor.green > 0 && (
                            <span className="text-green-600 font-medium">Green {metric.refillEventsPerColor.green.toLocaleString()}회</span>
                          )}
                          {metric.refillEventsPerColor.blue > 0 && (
                            <span className="text-blue-600 font-medium">Blue {metric.refillEventsPerColor.blue.toLocaleString()}회</span>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
              </React.Fragment>
            );
          })}

          {/* 잉크 사용량 요약 */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-500">총 인쇄 수량</span>
                <span className="text-sm text-gray-800">{totals.sheetCount.toLocaleString()} 장</span>
              </div>
              <div className="h-4 w-px bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-500">총 픽셀 수</span>
                <span className="text-sm text-gray-800">{totals.totalPixels.toLocaleString()} px</span>
              </div>
              <div className="h-4 w-px bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-500">총 잉크 사용량</span>
                <span className="text-sm text-gray-600">
                  <span className="text-rose-500">Red {totals.usagePerColor.red.toLocaleString(undefined, { maximumFractionDigits: 1 })} ml</span> ·{' '}
                  <span className="text-green-600">Green {totals.usagePerColor.green.toLocaleString(undefined, { maximumFractionDigits: 1 })} ml</span> ·{' '}
                  <span className="text-blue-600">Blue {totals.usagePerColor.blue.toLocaleString(undefined, { maximumFractionDigits: 1 })} ml</span>
                </span>
                <span className="text-sm font-semibold text-gray-800">
                  합계: {totalUsageMl.toLocaleString(undefined, { maximumFractionDigits: 1 })} ml
                </span>
              </div>
              <div className="h-4 w-px bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-500">총 충전 횟수</span>
                <span className="text-sm text-gray-800">{totals.refillEvents.toLocaleString()} 회</span>
              </div>
              {totals.refillEventsPerColor.red > 0 || totals.refillEventsPerColor.green > 0 || totals.refillEventsPerColor.blue > 0 ? (
                <>
                  <div className="h-4 w-px bg-gray-300"></div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-500">색상별 충전 횟수</span>
                    <span className="text-sm text-gray-600">
                      {totals.refillEventsPerColor.red > 0 && (
                        <>
                          <span className="text-rose-500">Red {totals.refillEventsPerColor.red.toLocaleString()}회</span>
                          {(totals.refillEventsPerColor.green > 0 || totals.refillEventsPerColor.blue > 0) && ' · '}
                        </>
                      )}
                      {totals.refillEventsPerColor.green > 0 && (
                        <>
                          <span className="text-green-600">Green {totals.refillEventsPerColor.green.toLocaleString()}회</span>
                          {totals.refillEventsPerColor.blue > 0 && ' · '}
                        </>
                      )}
                      {totals.refillEventsPerColor.blue > 0 && (
                        <span className="text-blue-600">Blue {totals.refillEventsPerColor.blue.toLocaleString()}회</span>
                      )}
                    </span>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
      </CommonContainerBox>

      {/* 최종 예상 시간 섹션 */}
      {printerMetrics.length > 0 && (
        <CommonContainerBox className="px-4 py-4 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">최종 예상 시간</h3>
            <p className="mt-1 text-sm text-gray-500">
              설비별 충전, 인쇄, 압축 시간을 계산하여 최종 생산 소요 시간을 예측합니다.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#0059FF]/20">
            <table className="min-w-full divide-y divide-[#0059FF]/10">
              <thead className="bg-[#0059FF]/5">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#0059FF] uppercase tracking-wider">
                    설비명
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#0059FF] uppercase tracking-wider">
                    원장 세대
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-[#0059FF] uppercase tracking-wider">
                    배정 수량
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-[#0059FF] uppercase tracking-wider">
                    총 충전시간
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-[#0059FF] uppercase tracking-wider">
                    인쇄시간
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-[#0059FF] uppercase tracking-wider">
                    압축시간
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-[#0059FF] uppercase tracking-wider">
                    총 예상시간
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#0059FF]/10">
                {printerMetrics.map((metric) => {
                  const totalDetail = formatDurationDetail(metric.totalTime);
                  return (
                    <tr key={`${metric.motherGlassName}-${metric.printerName}`} className="hover:bg-[#0059FF]/5">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{metric.printerName}</div>
                        <div className="text-xs text-gray-500">{metric.modelName}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{metric.motherGlassName}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className="text-sm text-gray-900">{metric.assignedSheets.toLocaleString()} 장</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className="text-sm text-gray-800">{formatMinutes(metric.refillTime)}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className="text-sm text-gray-800">{formatMinutes(metric.printTime)}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className="text-sm text-gray-800">{formatMinutes(metric.compressionTime)}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-semibold text-gray-900">
                            {formatMinutes(metric.totalTime)}
                          </span>
                          {totalDetail && (
                            <span className="text-xs text-gray-500 mt-0.5">{totalDetail}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 최종 요약 */}
          {(() => {
            const maxTotalDetail = formatDurationDetail(maxTimes.total);
            const maxRefillDetail = formatDurationDetail(maxTimes.refill);
            const maxPrintDetail = formatDurationDetail(maxTimes.print);
            const maxCompressionDetail = formatDurationDetail(maxTimes.compression);
            const timeParts = [
              maxRefillDetail ? `충전 ${maxRefillDetail}` : null,
              maxPrintDetail ? `인쇄 ${maxPrintDetail}` : null,
              maxCompressionDetail ? `압축 ${maxCompressionDetail}` : null,
            ].filter(Boolean).join(' · ');
            return (
              <div className="space-y-4">
                {/* 시간 요약 */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <div className="flex items-center justify-between flex-nowrap overflow-x-auto w-full">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-500">최대 예상 시간</span>
                      <span className="text-base font-semibold text-gray-900">
                        {formatMinutes(maxTimes.total)}
                        {maxTotalDetail ? ` (${maxTotalDetail})` : ''}
                      </span>
                    </div>
                    <div className="h-4 w-px bg-gray-300 flex-shrink-0 mx-4"></div>
                    <div className="flex items-center gap-1 text-sm text-gray-600 whitespace-nowrap">
                      <span>충전시간</span>
                      <span className="font-medium text-gray-800">
                        {formatMinutes(maxTimes.refill)}
                        {maxRefillDetail ? ` (${maxRefillDetail})` : ''}
                      </span>
                    </div>
                    <div className="h-4 w-px bg-gray-300 flex-shrink-0 mx-4"></div>
                    <div className="flex items-center gap-1 text-sm text-gray-600 whitespace-nowrap">
                      <span>인쇄시간</span>
                      <span className="font-medium text-gray-800">
                        {formatMinutes(maxTimes.print)}
                        {maxPrintDetail ? ` (${maxPrintDetail})` : ''}
                      </span>
                    </div>
                    <div className="h-4 w-px bg-gray-300 flex-shrink-0 mx-4"></div>
                    <div className="flex items-center gap-1 text-sm text-gray-600 whitespace-nowrap">
                      <span>압축시간</span>
                      <span className="font-medium text-gray-800">
                        {formatMinutes(maxTimes.compression)}
                        {maxCompressionDetail ? ` (${maxCompressionDetail})` : ''}
                      </span>
                    </div>
                  </div>
                  {timeReductionPercent !== null && (
                    <div className="flex flex-col mt-3">
                      <span className="text-xs font-semibold text-gray-500">생산 시간 단축</span>
                      <div className="mt-1 rounded-md bg-green-50 border border-green-200 px-3 py-2">
                        <span className="text-base font-semibold text-green-800">
                          {timeReductionPercent.toFixed(1)}%
                        </span>
                        <p className="text-xs text-green-700 mt-1">
                          느린 압축 방식 대비 빠른 압축 방식 적용으로 생산 시간이 단축되었습니다.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 생산 목표 정보 */}
                {confirmedGoals.length > 0 && (
                  <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
                    <div className="mb-3">
                      <span className="text-base font-semibold text-gray-900">생산 목표</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {confirmedGoals.map((goal) => (
                        <div key={goal.product.id} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
                          <img
                            src={goal.product.imageUrl}
                            alt={goal.product.productName}
                            className="h-12 w-12 rounded object-contain"
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-900">{goal.product.productName}</span>
                            <span className="text-sm text-gray-500">수량: {goal.quantity.toLocaleString()} 개</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-right text-[#0059FF]">
                        총 <span className="font-semibold">{confirmedGoals.reduce((sum, goal) => sum + goal.quantity, 0).toLocaleString()} 개의 제품을 </span> 생산하기 위해{' '}
                        <span className="font-semibold">
                          {formatMinutes(maxTimes.total)}
                          {maxTotalDetail ? ` (${maxTotalDetail})` : ''}
                        </span>의 시간이 소요됩니다.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </CommonContainerBox>
      )}
    </div>
  );
}
