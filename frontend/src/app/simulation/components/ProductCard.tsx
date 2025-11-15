import React from 'react';

export interface ProductInfo {
  id: string;
  productName: string;
  modelName: string;
  imageUrl: string;
  diagonalCm: string;
  diagonalInch: string;
  aspectRatio: string;
  widthMm: string;
  heightMm: string;
  areaMm2: string;
}

interface ProductCardProps {
  product: ProductInfo;
  onSelect?: (product: ProductInfo) => void;
  isActive?: boolean;
}

export default function ProductCard({ product, onSelect, isActive = false }: ProductCardProps) {
  const handleSelect = () => {
    onSelect?.(product);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSelect();
    }
  };

  return (
    <div
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      className={`flex flex-col gap-3 rounded-xl border ${
        isActive
          ? 'border-[#0059FF] shadow-[0_0_0_1px_rgba(0,89,255,0.35)]'
          : 'border-gray-200 shadow-sm'
      } bg-white p-4 transition-transform duration-200 hover:scale-105 ${
        onSelect ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400' : ''
      }`}
    >
      <div className="aspect-video overflow-hidden rounded-lg bg-gray-100 flex items-center justify-center">
        <img
          src={product.imageUrl}
          alt={`${product.productName} 이미지`}
          className="max-h-full max-w-full object-contain"
        />
      </div>
      <div>
        <h3 className="text-base font-semibold text-gray-900">{product.productName}</h3>
      </div>
      <dl className="space-y-2 text-xs text-gray-600">
        <div className="flex items-center justify-between">
          <dt className="text-gray-500">모델명</dt>
          <dd className="font-medium text-gray-900">{product.modelName}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-gray-500">대각선(inch)</dt>
          <dd className="font-medium text-gray-900">{product.diagonalInch}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-gray-500">가로(mm)</dt>
          <dd className="font-medium text-gray-900">{product.widthMm}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-gray-500">세로(mm)</dt>
          <dd className="font-medium text-gray-900">{product.heightMm}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-gray-500">면적(mm²)</dt>
          <dd className="font-medium text-gray-900">{product.areaMm2}</dd>
        </div>
      </dl>
    </div>
  );
}
