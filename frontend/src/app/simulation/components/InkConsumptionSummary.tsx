import React, { useMemo } from 'react';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import type { PrintSimulationPlanEntry } from './PrintSimulationPlan';
import {
  INK_TANK_CAPACITY_ML,
  COLOR_USAGE_PER_SHEET_ML,
  INK_REFILL_TIME_MINUTES,
  PRINT_TIME_PER_SHEET_SECONDS,
  COMPRESSION_TIME_PER_SHEET_SECONDS,
} from '../data/inkConfig';

interface InkConsumptionSummaryProps {
  plan: PrintSimulationPlanEntry[];
}

function formatMinutes(value: number) {
  return value <= 0 ? '0분' : `${Math.ceil(value)}분`;
}

export default function InkConsumptionSummary({ plan }: InkConsumptionSummaryProps) {
  const printerMetrics = useMemo(() => {
    return plan.flatMap((entry) =>
      entry.assignments.map((assignment) => {
        const assignedSheets = assignment.assignedSheets;
        const usagePerColor = assignedSheets * COLOR_USAGE_PER_SHEET_ML;
        const refillCounts = Math.max(0, Math.ceil(usagePerColor / INK_TANK_CAPACITY_ML) - 1);
        const totalRefillEvents = refillCounts * 3;
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
          refillEventsPerColor: refillCounts,
          refillTime,
          printTime,
          compressionTime,
          totalTime,
        };
      }),
    );
  }, [plan]);

  const totals = useMemo(() => {
    return printerMetrics.reduce(
      (acc, metric) => {
        acc.sheetCount += metric.assignedSheets;
        acc.usagePerColor += metric.usagePerColor;
        acc.refillEvents += metric.refillEventsPerColor * 3;
        acc.refillTime += metric.refillTime;
        acc.printTime += metric.printTime;
        acc.compressionTime += metric.compressionTime;
        acc.totalTime += metric.totalTime;
        return acc;
      },
      {
        sheetCount: 0,
        usagePerColor: 0,
        refillEvents: 0,
        refillTime: 0,
        printTime: 0,
        compressionTime: 0,
        totalTime: 0,
      },
    );
  }, [printerMetrics]);

  return (
    <CommonContainerBox className="px-4 py-4 space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">잉크 소모량 및 예상 시간 계산</h3>
        <p className="mt-1 text-sm text-gray-500">
          설비별 배정 장수를 기준으로 잉크 소비량과 충전/인쇄 시간을 추정합니다. 색상별 사용량은 동일하게 가정했습니다.
        </p>
      </div>

      {printerMetrics.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          배정된 설비가 없습니다. 생산 목표를 확정하면 잉크 사용량이 계산됩니다.
        </div>
      ) : (
        <div className="space-y-4">
          {printerMetrics.map((metric) => (
            <div key={`${metric.motherGlassName}-${metric.printerName}`} className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="h-24 w-32 rounded-lg border border-gray-200 bg-white flex items-center justify-center p-2">
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
                <div className="text-sm font-semibold text-gray-900">잉크 탱크 사용량 (각 탱크 용량 {INK_TANK_CAPACITY_ML.toLocaleString()} ml)</div>
                {(['red', 'green', 'blue'] as const).map((color) => {
                  const label = color === 'red' ? 'Red' : color === 'green' ? 'Green' : 'Blue';
                  const usage = metric.usagePerColor;
                  const percent = Math.min(100, (usage / INK_TANK_CAPACITY_ML) * 100);
                  const barColor = color === 'red' ? 'bg-rose-500' : color === 'green' ? 'bg-green-500' : 'bg-blue-500';
                  return (
                    <div key={color}>
                      <div className="flex items-center justify-between text-[13px] text-gray-600">
                        <span className={color === 'red' ? 'text-rose-600' : color === 'green' ? 'text-green-600' : 'text-blue-600'}>
                          {label}
                        </span>
                        <span>{usage.toLocaleString()} ml ({percent.toFixed(1)}%)</span>
                      </div>
                      <div className="mt-1 h-2 w-full rounded-full bg-gray-100">
                        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col gap-2 text-sm text-gray-600 sm:w-48">
                <div className="flex items-center justify-between">
                  <span>총 리필 시간</span>
                  <span>{formatMinutes(metric.refillTime)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>인쇄 시간</span>
                  <span>{formatMinutes(metric.printTime)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>압축 시간</span>
                  <span>{formatMinutes(metric.compressionTime)}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-semibold text-gray-900">
                  <span>총 예상 시간</span>
                  <span>{formatMinutes(metric.totalTime)}</span>
                </div>
              </div>
            </div>
          ))}

          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            <div className="flex flex-wrap gap-4">
              <span>총 인쇄 장수 · {totals.sheetCount.toLocaleString()} 장</span>
              <span>총 리필 횟수 · {totals.refillEvents.toLocaleString()} 회</span>
              <span>
                총 예상 시간 · {formatMinutes(totals.totalTime)} (리필 {formatMinutes(totals.refillTime)} / 인쇄 {formatMinutes(totals.printTime)} / 압축 {formatMinutes(totals.compressionTime)})
              </span>
            </div>
          </div>
        </div>
      )}
    </CommonContainerBox>
  );
}
