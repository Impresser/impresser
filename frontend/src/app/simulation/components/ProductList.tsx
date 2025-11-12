'use client';

import React, { useEffect, useMemo, useState } from 'react';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import ProductCard, { ProductInfo } from './ProductCard';
import ProductQuantityModal from './ProductQuantityModal';
import { products } from '../data/productionProducts';

interface ProductListProps {
  className?: string;
  onConfirmGoal?: (productId: string, quantity: number) => void;
  selectedGoals?: { productId: string; quantity: number }[];
  activeProductId?: string | null;
  onModalClose?: () => void;
}

export default function ProductList({
  className = '',
  onConfirmGoal,
  selectedGoals = [],
  activeProductId = null,
  onModalClose,
}: ProductListProps) {
  const [selectedProduct, setSelectedProduct] = useState<ProductInfo | null>(null);
  const [quantity, setQuantity] = useState<string>('1');

  const goalMap = useMemo(() => {
    return new Map(selectedGoals.map((goal) => [goal.productId, goal.quantity]));
  }, [selectedGoals]);

  useEffect(() => {
    if (selectedProduct) {
      const existingQuantity = goalMap.get(selectedProduct.id);
      if (existingQuantity !== undefined) {
        setQuantity(String(existingQuantity));
      }
    }
  }, [goalMap, selectedProduct]);

  useEffect(() => {
    if (activeProductId) {
      const product = products.find((item) => item.id === activeProductId) ?? null;
      setSelectedProduct(product);
      if (product) {
        const existingQuantity = goalMap.get(product.id);
        setQuantity(existingQuantity !== undefined ? String(existingQuantity) : '1');
      }
    }
  }, [activeProductId, goalMap]);

  const handleSelectProduct = (product: ProductInfo) => {
    setSelectedProduct(product);
    const existingQuantity = goalMap.get(product.id);
    setQuantity(existingQuantity !== undefined ? String(existingQuantity) : '1');
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
    setQuantity('1');
    onModalClose?.();
  };

  const handleQuantityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;

    if (value === '') {
      setQuantity('');
      return;
    }

    const parsed = Number(value);
    if (!Number.isNaN(parsed) && parsed >= 1) {
      setQuantity(String(Math.floor(parsed)));
    }
  };

  const handleConfirm = () => {
    if (!selectedProduct) {
      return;
    }

    const parsedQuantity = quantity === '' ? 1 : Math.max(1, Number(quantity));
    setQuantity(String(parsedQuantity));

    onConfirmGoal?.(selectedProduct.id, parsedQuantity);

    handleCloseModal();
  };

  const isModalOpen = Boolean(selectedProduct);

  return (
    <section className={`${className}`}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">생산 목표 선택</h2>
      </div>
      <CommonContainerBox className="space-y-6">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-gray-900">제품을 선택하세요</h3>
          <p className="mt-1 text-sm text-gray-500">
            선택한 제품의 생산 목표 수량을 입력할 수 있습니다.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} onSelect={handleSelectProduct} />
          ))}
        </div>
      </CommonContainerBox>

      <ProductQuantityModal
        isOpen={isModalOpen}
        product={selectedProduct}
        quantity={quantity}
        onQuantityChange={handleQuantityChange}
        onConfirm={handleConfirm}
        onClose={handleCloseModal}
      />
    </section>
  );
}
