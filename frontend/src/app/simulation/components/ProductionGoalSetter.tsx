'use client';

import React from 'react';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import ProductionProductCard from './ProductionProductCard';
import { products } from '../data/ProductionProducts';

interface ProductionGoalSetterProps {
  className?: string;
}

export default function ProductionGoalSetter({ className = '' }: ProductionGoalSetterProps) {
  return (
    <section className={`${className}`}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">생산 목표 선택</h2>
      </div>
      <CommonContainerBox className="space-y-6">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-gray-900">제품을 선택하세요</h3>
          <p className="mt-1 text-sm text-gray-500">
            목표 생산 제품을 선택하고 설정할 수 있습니다.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <ProductionProductCard key={product.id} product={product} />
          ))}
        </div>
      </CommonContainerBox>
    </section>
  );
}
