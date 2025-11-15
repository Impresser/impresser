import React, { useMemo } from 'react';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import type { PrintSimulationPlanEntry } from './PrintSimulationPlan';
import type { BmpDetailResult } from '@/types/imageGenerator';
import {
  INK_TANK_CAPACITY_ML,
  INK_REFILL_TIME_MINUTES,
  PRINT_TIME_PER_SHEET_SECONDS,
  COMPRESSION_TIME_PER_SHEET_SECONDS,
} from '../data/inkConfig';

interface InkConsumptionSummaryProps {
  plan: PrintSimulationPlanEntry[];
  selectedAssignments: Record<string, BmpDetailResult | undefined>;
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

const PIXELS_PER_ML = 10000;

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

export default function InkConsumptionSummary({ plan, selectedAssignments }: InkConsumptionSummaryProps) {
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
        const printTime = (assignedSheets * PRINT_TIME_PER_SHEET_SECONDS) / 60;
        const compressionTime = (assignedSheets * COMPRESSION_TIME_PER_SHEET_SECONDS) / 60;
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
  }, [plan, selectedAssignments]);

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

  return (
    <div id="ink-consumption-summary">
      <CommonContainerBox className="px-4 py-4 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">잉크 사용량 및 예상 시간 계산</h3>
        <p className="mt-1 text-sm text-gray-500">
          이미지 픽셀 수와 인쇄 수량을 반영해 색상별 잉크 사용량을 계산합니다. 10,000px당 1ml 기준으로 환산합니다.
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
              <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-48 w-64 rounded-lg border border-gray-200 bg-white flex items-center justify-center p-2">
                    <img
                      src="/images/facilities/inkjet_detail01.png"
                      alt={`${metric.printerName} 이미지`}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-gray-900">{metric.printerName}</p>
                    <p className="text-sm text-gray-500">모델명: {metric.modelName}</p>
                    <p className="text-sm text-gray-500">
                      {metric.motherGlassName} · {metric.assignedSheets.toLocaleString()} 장 배정
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:w-80">
                  <div className="text-sm font-semibold text-gray-900">
                    잉크 탱크 사용량 (각 탱크 용량 {INK_TANK_CAPACITY_ML.toLocaleString()} ml)
                  </div>
                  {(['red', 'green', 'blue'] as const).map((color) => {
                    const label = color === 'red' ? 'Red' : color === 'green' ? 'Green' : 'Blue';
                    const usage = metric.usagePerColor[color];
                    const remaining = metric.remainingPerColor[color];
                    const remainingPercent = Math.max(0, Math.min(100, remaining.percent));
                    const barColor = color === 'red' ? 'bg-rose-500' : color === 'green' ? 'bg-green-500' : 'bg-blue-500';
                    return (
                      <div key={color}>
                        <div className="flex items-center justify-between text-[13px] text-gray-600">
                          <span className={color === 'red' ? 'text-rose-600' : color === 'green' ? 'text-green-600' : 'text-blue-600'}>
                            {label}
                          </span>
                          <span className="text-gray-500">
                            남은 잉크 {remaining.remainingMl.toLocaleString(undefined, { maximumFractionDigits: 1 })} ml ({remainingPercent.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
                          <div
                            className={`h-full rounded-full transition-all ${barColor}`}
                            style={{ width: `${remainingPercent}%` }}
                          />
                        </div>
                        <div className="mt-1 text-[11px] text-gray-400">총 사용 {usage.toLocaleString(undefined, { maximumFractionDigits: 1 })} ml</div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-col gap-2 text-sm text-gray-600 sm:w-48">
                  <div className="flex items-center justify-between">
                    <span>총 충전시간</span>
                    <span>{formatMinutes(metric.refillTime)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>인쇄시간</span>
                    <span>{formatMinutes(metric.printTime)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>압축시간</span>
                    <span>{formatMinutes(metric.compressionTime)}</span>
                  </div>
                  <div className="flex flex-col text-right text-sm font-semibold text-gray-900">
                    <span className="flex items-center justify-between">
                      <span>총 예상시간</span>
                      <span>{formatMinutes(metric.totalTime)}</span>
                    </span>
                    {totalDetail && (
                      <span className="text-xs font-medium text-gray-500">{totalDetail}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="rounded-md bg-gray-50 px-3 py-2 text-[12px] text-gray-500">
                총 픽셀 {metric.totalPixels.toLocaleString()} px · 인쇄 수량 {metric.assignedSheets.toLocaleString()} · 총 잉크 사용량{' '}
                {metric.totalUsageMl.toLocaleString(undefined, { maximumFractionDigits: 1 })} ml · 충전 횟수 {metric.totalRefillEvents.toLocaleString()} 회
                {metric.refillEventsPerColor.red > 0 || metric.refillEventsPerColor.green > 0 || metric.refillEventsPerColor.blue > 0 ? (
                  <div className="mt-1 flex flex-wrap gap-3 text-[11px]">
                    {metric.refillEventsPerColor.red > 0 && (
                      <span className="text-rose-500">Red {metric.refillEventsPerColor.red.toLocaleString()}회</span>
                    )}
                    {metric.refillEventsPerColor.green > 0 && (
                      <span className="text-green-600">Green {metric.refillEventsPerColor.green.toLocaleString()}회</span>
                    )}
                    {metric.refillEventsPerColor.blue > 0 && (
                      <span className="text-blue-600">Blue {metric.refillEventsPerColor.blue.toLocaleString()}회</span>
                    )}
                  </div>
                ) : null}
              </div>
              </React.Fragment>
            );
          })}

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
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-gray-500">총 인쇄 수량</span>
                <span className="text-sm text-gray-800">{totals.sheetCount.toLocaleString()} 장</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-gray-500">총 픽셀 수</span>
                <span className="text-sm text-gray-800">{totals.totalPixels.toLocaleString()} px</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-gray-500">총 잉크 사용량</span>
                <span className="text-xs text-gray-600">
                  <span className="text-rose-500">Red {totals.usagePerColor.red.toLocaleString(undefined, { maximumFractionDigits: 1 })} ml</span> ·{' '}
                  <span className="text-green-600">Green {totals.usagePerColor.green.toLocaleString(undefined, { maximumFractionDigits: 1 })} ml</span> ·{' '}
                  <span className="text-blue-600">Blue {totals.usagePerColor.blue.toLocaleString(undefined, { maximumFractionDigits: 1 })} ml</span>
                </span>
                <span className="text-sm font-semibold text-gray-800 mt-1">
                  합계: {totalUsageMl.toLocaleString(undefined, { maximumFractionDigits: 1 })} ml
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-gray-500">총 충전 횟수</span>
                <span className="text-sm text-gray-800">{totals.refillEvents.toLocaleString()} 회</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-gray-500">색상별 충전 횟수</span>
                {totals.refillEventsPerColor.red > 0 || totals.refillEventsPerColor.green > 0 || totals.refillEventsPerColor.blue > 0 ? (
                  <span className="text-xs text-gray-600">
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
                ) : (
                  <span className="text-xs text-gray-400">-</span>
                )}
              </div>
              <div className="flex flex-col lg:col-span-2">
                <span className="text-xs font-semibold text-gray-500">최대 예상 시간(가장 오래 걸린 설비 기준)</span>
                <span className="text-sm text-gray-800">
                  {formatMinutes(maxTimes.total)}
                  {maxTotalDetail ? ` (${maxTotalDetail})` : ''}
                </span>
                <span className="text-xs text-gray-500">
                  {timeParts || '충전 0분 · 인쇄 0분 · 압축 0분'}
                </span>
              </div>
            </div>
          </div>
            );
          })()}
        </div>
      )}
      </CommonContainerBox>
    </div>
  );
}
