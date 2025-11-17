import React from 'react';
import CommonContainerBox from '@/components/ui/CommonContainerBox';

export interface OverallProductionSummaryEntry {
  motherGlassName: string;
  productSummary: string;
  totalProductCount?: number;
  averageUsedPercent: number;
  averageRemainingPercent: number;
  sheetCount: number;
}

interface OverallProductionSummaryProps {
  summary: OverallProductionSummaryEntry[];
}

export default function OverallProductionSummary({ summary }: OverallProductionSummaryProps) {
  if (summary.length === 0) {
    return null;
  }

  return (
    <div id="overall-production-summary">
      <CommonContainerBox className="px-4 py-4">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">전체 배치 요약</h3>
        <p className="mt-1 text-sm text-gray-500">
          최적화 결과를 기반으로 세대별 사용 면적과 사용 장수를 집계한 요약입니다.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#0059FF]/20">
        <div className="min-w-[700px] grid grid-cols-[1fr_2.8fr_0.8fr_1fr_1fr] gap-2 border-b border-[#0059FF]/10 bg-[#0059FF]/5 px-4 py-2 text-sm font-semibold text-[#0059FF] text-center">
          <span>원장 세대</span>
          <span>포함 제품</span>
          <span>제품 수량</span>
          <span>평균 사용 면적</span>
          <span>사용 장수</span>
        </div>
        <div className="divide-y divide-[#0059FF]/10 text-sm text-gray-700">
          {summary.map((entry) => (
            <div key={`overall-summary-${entry.motherGlassName}`} className="min-w-[700px] grid grid-cols-[1fr_2.8fr_0.8fr_1fr_1fr] gap-2 px-4 py-2">
              <span className="text-center text-sm font-semibold text-gray-900">{entry.motherGlassName}</span>
              <span className="text-right text-gray-600 whitespace-pre-line">{entry.productSummary}</span>
              <span className="text-right text-gray-900">{entry.totalProductCount?.toLocaleString() || 0} 개</span>
              <span className="text-right text-[#0059FF]">{entry.averageUsedPercent.toFixed(1)}% 사용
                <br />
                <span className="text-[12px] text-gray-400">잔여 {entry.averageRemainingPercent.toFixed(1)}%</span>
              </span>
              <span className="text-right text-gray-900">{entry.sheetCount.toLocaleString()} 장</span>
            </div>
          ))}
        </div>
      </div>
      </CommonContainerBox>
    </div>
  );
}
