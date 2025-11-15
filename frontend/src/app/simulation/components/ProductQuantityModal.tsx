'use client';

import React, { useEffect, useRef } from 'react';
import CommonModal from '@/components/ui/CommonModal';
import CommonButton from '@/components/ui/CommonButton';
import type { ProductInfo } from './ProductCard';

interface ProductQuantityModalProps {
  isOpen: boolean;
  product: ProductInfo | null;
  quantity: string;
  onQuantityChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ProductQuantityModal({
  isOpen,
  product,
  quantity,
  onQuantityChange,
  onConfirm,
  onClose,
}: ProductQuantityModalProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscapeKey);

    return () => {
      window.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onConfirm();
    }
  };

  return (
    <CommonModal isOpen={isOpen} onClose={onClose} hideBackdrop className="w-full max-w-[40rem]">
      {product && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-40 w-full items-center justify-center overflow-hidden rounded-lg bg-gray-100 sm:w-40">
              <img
                src={product.imageUrl}
                alt={`${product.productName} 이미지`}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="flex flex-1 flex-col justify-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">{product.productName}</h3>
              <p className="text-sm text-gray-600">모델명: {product.modelName}</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <label htmlFor="product-quantity" className="text-sm font-medium text-gray-700 whitespace-nowrap">
              수량
            </label>
            <input
              ref={inputRef}
              id="product-quantity"
              type="number"
              min={1}
              value={quantity}
              onChange={onQuantityChange}
              onKeyDown={handleKeyDown}
              className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="1"
            />
          </div>

          <div className="flex justify-end gap-3">
            <CommonButton variant="gray" onClick={onClose}>
              취소
            </CommonButton>
            <CommonButton onClick={onConfirm}>확인</CommonButton>
          </div>
        </div>
      )}
    </CommonModal>
  );
}
