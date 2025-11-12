'use client';

import React from 'react';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import CommonButton from '@/components/ui/CommonButton';
import type { ProductInfo } from './ProductCard';

export interface SelectedGoal {
  product: ProductInfo;
  quantity: number;
}

interface SelectedGoalListProps {
  goals: SelectedGoal[];
  onRemove?: (productId: string) => void;
  onEdit?: (product: ProductInfo) => void;
  onConfirm?: () => void;
  className?: string;
  emptyMessage?: string;
}

export default function SelectedGoalList({
  goals,
  onRemove,
  onEdit,
  onConfirm,
  className = '',
  emptyMessage = '선택된 생산 목표가 없습니다.',
}: SelectedGoalListProps) {
  const containerClassName = `w-80 mt-10 ${className}`.trim();

  return (
    <div className={containerClassName}>
      <CommonContainerBox className="flex h-full flex-col space-y-4 px-4 py-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">선택된 생산 목표</h3>
        </div>
        {goals.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-sm text-gray-500 text-center leading-relaxed">
            {emptyMessage}
          </div>
        ) : (
          <div className="flex-1 space-y-3">
            {goals.map((goal) => (
              <div
                key={goal.product.id}
                role={onEdit ? 'button' : undefined}
                tabIndex={onEdit ? 0 : undefined}
                onClick={() => onEdit?.(goal.product)}
                onKeyDown={(event) => {
                  if (!onEdit) return;
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onEdit(goal.product);
                  }
                }}
                className={`${
                  onEdit ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400' : ''
                } group`}
              >
                <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm transition-transform duration-200 group-hover:scale-105 group-hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-gray-900">{goal.product.productName}</p>
                      <p className="text-xs text-gray-500">모델명: {goal.product.modelName}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                    <span>수량</span>
                    <span className="font-semibold text-gray-900">{goal.quantity.toLocaleString()} 개</span>
                  </div>
                  {onRemove && (
                    <div className="mt-3 flex justify-end">
                      <CommonButton
                        variant="gray"
                        className="!px-3 !py-1 text-xs"
                        onClick={(event) => {
                          event.stopPropagation();
                          onRemove(goal.product.id);
                        }}
                      >
                        제거
                      </CommonButton>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-end pt-2">
          <CommonButton
            variant="blue"
            className="px-4 py-2 text-sm"
            onClick={onConfirm}
            disabled={!goals.length}
          >
            확인
          </CommonButton>
        </div>
      </CommonContainerBox>
    </div>
  );
}
