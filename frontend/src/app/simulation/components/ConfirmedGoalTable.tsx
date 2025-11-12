'use client';

import React, { useMemo } from 'react';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import type { SelectedGoal } from './SelectedGoalList';

interface ConfirmedGoalTableProps {
  goals: SelectedGoal[];
  className?: string;
}

export default function ConfirmedGoalTable({ goals, className = '' }: ConfirmedGoalTableProps) {
  const totalQuantity = useMemo(
    () => goals.reduce((sum, goal) => sum + goal.quantity, 0),
    [goals]
  );

  return (
    <CommonContainerBox className={`px-4 py-4 ${className}`.trim()}>
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900">확정된 생산 목표</h3>
        <p className="mt-1 text-sm text-gray-500">
          확인된 생산 목표 목록입니다. 필요 시 다시 선택하여 수량을 조정할 수 있습니다.
        </p>
      </div>
      {goals.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500">
          아직 확정된 생산 목표가 없습니다.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_1fr] gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600">
            <span>제품명</span>
            <span>모델명</span>
            <span className="text-right">가로(mm)</span>
            <span className="text-right">세로(mm)</span>
            <span className="text-right">면적(mm²)</span>
            <span className="text-right">수량</span>
          </div>
          <div className="divide-y divide-gray-100">
            {goals.map((goal) => (
              <div
                key={`confirmed-${goal.product.id}`}
                className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_1fr] gap-2 px-4 py-2 text-xs text-gray-700"
              >
                <span className="truncate" title={goal.product.productName}>
                  {goal.product.productName}
                </span>
                <span className="truncate" title={goal.product.modelName}>
                  {goal.product.modelName}
                </span>
                <span className="text-right">{goal.product.widthMm}</span>
                <span className="text-right">{goal.product.heightMm}</span>
                <span className="text-right">{goal.product.areaMm2}</span>
                <span className="text-right font-semibold text-gray-900">{goal.quantity.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_1fr] gap-2 border-t border-gray-100 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-700">
            <span className="col-span-5 text-right">총 수량</span>
            <span className="text-right text-blue-600">{totalQuantity.toLocaleString()}</span>
          </div>
        </div>
      )}
    </CommonContainerBox>
  );
}
