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

interface ProductionProductCardProps {
  product: ProductInfo;
}

export default function ProductionProductCard({ product }: ProductionProductCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-transform duration-200 hover:scale-105">
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
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-gray-600">
        <div className="col-span-2 flex items-center justify-between">
          <dt className="text-gray-500">모델명</dt>
          <dd className="font-medium text-gray-900">{product.modelName}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-gray-500">대각선 (cm)</dt>
          <dd className="font-medium text-gray-900">{product.diagonalCm}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-gray-500">대각선 (inch)</dt>
          <dd className="font-medium text-gray-900">{product.diagonalInch}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-gray-500">화면비</dt>
          <dd className="font-medium text-gray-900">{product.aspectRatio}</dd>
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
