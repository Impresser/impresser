import React from 'react';
import CommonContainerBox from '@/components/ui/CommonContainerBox';

export interface PrintSimulationPlanEntry {
  motherGlassName: string;
  sheetCount: number;
  assignments: {
    printerUuid?: string;
    printerName: string;
    modelName: string;
    assignedSheets: number;
  }[];
}

interface PrintSimulationPlanProps {
  plan: PrintSimulationPlanEntry[];
}

export default function PrintSimulationPlan({ plan }: PrintSimulationPlanProps) {
  if (plan.length === 0) {
    return null;
  }

  return (
    <CommonContainerBox className="px-4 py-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">예상 인쇄 계획</h3>
        <p className="mt-1 text-sm text-gray-500">
          확정된 배치 결과와 현재 설비 가용 현황을 기반으로 설비별 인쇄 장수를 배정했습니다.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#0059FF]/20">
        <div className="grid grid-cols-[1.2fr_1fr_1fr_1.6fr] gap-2 border-b border-[#0059FF]/10 bg-[#0059FF]/5 px-4 py-2 text-sm font-semibold text-[#0059FF] text-center">
          <span>원장 세대</span>
          <span>총 인쇄 장수</span>
          <span>사용 가능 설비</span>
          <span>설비별 배정 현황</span>
        </div>
        <div className="divide-y divide-[#0059FF]/10 text-sm text-gray-700">
          {plan.map((entry) => (
            <div key={`print-plan-${entry.motherGlassName}`} className="grid grid-cols-[1.2fr_1fr_1fr_1.6fr] gap-2 px-4 py-2">
              <span className="text-center text-sm font-semibold text-gray-900">{entry.motherGlassName}</span>
              <span className="text-right text-gray-900">{entry.sheetCount.toLocaleString()} 장</span>
              <span className="text-right text-gray-700">{entry.assignments.length.toLocaleString()} 대</span>
              <span className="whitespace-pre-line text-right text-gray-700">
                {entry.assignments.length === 0
                  ? '-'
                  : entry.assignments
                      .map((assignment) => `• ${assignment.printerName} (${assignment.modelName})\n  ${assignment.assignedSheets.toLocaleString()} 장`)
                      .join('\n')}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-2 text-xs text-gray-500">
        * 설비가 부족한 경우 추가 설비 투입 또는 배치 계획 수정을 검토해주세요.
      </p>
    </CommonContainerBox>
  );
}
