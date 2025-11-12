'use client';

import React from 'react';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import ProductCard, { ProductInfo } from './ProductCard';

interface ProductionGoalListProps {
  products: ProductInfo[];
  className?: string;
  emptyMessage?: string;
}

export default function ProductionGoalList({
  products,
  className = '',
  emptyMessage = '등록된 생산 목표가 없습니다.',
}: ProductionGoalListProps) {
  const containerClassName = `w-80 ${className}`.trim();

  return (
    <div className={containerClassName}>
      <CommonContainerBox className="relative flex h-full flex-col p-0">
        <div className="border-b border-gray-100 px-4 pb-3 pt-4">
          <h3 className="text-base font-semibold text-gray-900">생산 목표 목록</h3>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {products.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-gray-500">{emptyMessage}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </CommonContainerBox>
    </div>
  );
}
