'use client';

import React, { useMemo } from 'react';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import CommonButton from '@/components/ui/CommonButton';
import type { LayoutComputationResult } from '../utils/layoutCalculations';
import LayoutSlider from './LayoutSlider';

interface MotherGlassLayoutPreviewProps {
  layoutResult: LayoutComputationResult;
  currentIndex?: number;
  totalCount?: number;
  onNext?: () => void;
  showNavigation?: boolean;
}

interface SheetSummaryGroup {
  signature: string;
  sheetIndices: number[];
  placementCount: number;
  areaUsedPercent: number;
  areaRemainingPercent: number;
  productSummary: string;
  motherGlassName: string;
}

function createSheetSignature(sheet: LayoutComputationResult['sheets'][number]): string {
  const signatureParts = sheet.placements
    .map((placement) =>
      [
        placement.productId,
        placement.rotated ? '1' : '0',
        placement.x,
        placement.y,
        placement.widthMm,
        placement.heightMm,
      ].join('-'),
    )
    .sort();

  return signatureParts.join('|');
}

export default function MotherGlassLayoutPreview({ 
  layoutResult,
  currentIndex = 0,
  totalCount = 1,
  onNext,
  showNavigation = false,
}: MotherGlassLayoutPreviewProps) {
  const { motherGlass, sheets, summaries } = layoutResult;

  const groupedSheets = useMemo(() => {
    const groups = new Map<string, SheetSummaryGroup>();

    sheets.forEach((sheet) => {
      const signature = createSheetSignature(sheet);
      const areaUsedPercent = motherGlass.areaMm2 > 0
        ? (sheet.areaUsedMm2 * 100) / motherGlass.areaMm2
        : 0;
      const areaRemainingPercent = Math.max(0, 100 - areaUsedPercent);

      const productCounts = sheet.placements.reduce<Record<string, number>>((acc, placement) => {
        const key = `${placement.productName} (${placement.modelName})`;
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {});

      const productSummary = Object.entries(productCounts)
        .map(([key, count]) => `${key} × ${count}`)
        .join('\n');

      if (!groups.has(signature)) {
        groups.set(signature, {
          signature,
          sheetIndices: [sheet.sheetIndex],
          placementCount: sheet.placements.length,
          areaUsedPercent,
          areaRemainingPercent,
          productSummary: productSummary || '-',
          motherGlassName: motherGlass.generationName,
        });
      } else {
        const existing = groups.get(signature)!;
        existing.sheetIndices.push(sheet.sheetIndex);
        existing.placementCount = Math.max(existing.placementCount, sheet.placements.length);
        existing.areaUsedPercent = Math.max(existing.areaUsedPercent, areaUsedPercent);
        existing.areaRemainingPercent = Math.max(existing.areaRemainingPercent, areaRemainingPercent);
        if (existing.productSummary === '-' && productSummary) {
          existing.productSummary = productSummary;
        }
      }
    });

    const sortedGroups = Array.from(groups.values()).sort((a, b) => {
      if (b.areaUsedPercent !== a.areaUsedPercent) {
        return b.areaUsedPercent - a.areaUsedPercent;
      }
      return (a.sheetIndices[0] ?? 0) - (b.sheetIndices[0] ?? 0);
    });

    return sortedGroups;
  }, [sheets, motherGlass.areaMm2, motherGlass.generationName]);

  const uniqueSheetsForVisualization = useMemo(() => {
    return groupedSheets.map((group) => {
      const representativeIndex = sheets.findIndex((sheet) => createSheetSignature(sheet) === group.signature);
      return sheets[representativeIndex];
    });
  }, [groupedSheets, sheets]);

  const hasPlacements = uniqueSheetsForVisualization.some((sheet) => sheet.placements.length > 0);

  const totalMotherGlassesUsed = sheets.length;
  const totalPlacedProducts = useMemo(
    () => summaries.reduce((sum, item) => sum + item.placedQuantity, 0),
    [summaries],
  );
  const totalUnplacedProducts = useMemo(
    () => summaries.reduce((sum, item) => sum + item.unplacedQuantity, 0),
    [summaries],
  );
  const overallAreaUtilizationPercent = useMemo(() => {
    const totalAreaUsed = summaries.reduce((sum, item) => sum + item.totalAreaUsedMm2, 0);
    const totalMotherGlassArea = totalMotherGlassesUsed * motherGlass.areaMm2;
    return totalMotherGlassArea > 0 ? (totalAreaUsed * 100) / totalMotherGlassArea : 0;
  }, [summaries, totalMotherGlassesUsed, motherGlass.areaMm2]);

  return (
    <CommonContainerBox className="px-4 py-4">
      <div className="mb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <h3 className="text-lg font-semibold text-gray-900">
              {motherGlass.generationName || '-'} 원장 배치도
            </h3>
            <span className="text-sm text-gray-600">
              총 원장 수: {totalMotherGlassesUsed.toLocaleString()}장
            </span>
          </div>
          <div className="rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600">
            원장 크기: {motherGlass.widthMm.toLocaleString()}mm × {motherGlass.heightMm.toLocaleString()}mm
          </div>
        </div>
      </div>

      {!hasPlacements ? (
        <div className="rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-700 min-h-[500px] flex items-center justify-center">
          <p>현재 선택한 제품 조합은 원장에 배치되지 않았습니다. 제품 수량이나 원장을 다시 확인해주세요.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="min-h-[436px]">
            <LayoutSlider>
              {uniqueSheetsForVisualization.map((sheet, index) => {
                const groupedSheet = groupedSheets[index];
                const placements = sheet.placements;

                let offsetXPercent = 0;
                let offsetYPercent = 0;
                if (placements.length > 0) {
                  const minX = Math.min(...placements.map((placement) => placement.x));
                  const minY = Math.min(...placements.map((placement) => placement.y));
                  const maxRight = Math.max(...placements.map((placement) => placement.x + placement.widthMm));
                  const maxBottom = Math.max(...placements.map((placement) => placement.y + placement.heightMm));

                  const usedWidth = maxRight - minX;
                  const usedHeight = maxBottom - minY;

                  const horizontalGap = motherGlass.widthMm - usedWidth;
                  const verticalGap = motherGlass.heightMm - usedHeight;

                  const offsetX = horizontalGap > 0 ? horizontalGap / 2 - minX : -minX;
                  const offsetY = verticalGap > 0 ? verticalGap / 2 - minY : -minY;

                  offsetXPercent = (offsetX / motherGlass.widthMm) * 100;
                  offsetYPercent = (offsetY / motherGlass.heightMm) * 100;
                }

                // 원장 비율 계산
                const aspectRatio = motherGlass.widthMm / motherGlass.heightMm;
                const maxCardWidth = 500; // 최대 카드 너비
                const maxCardHeight = 400; // 최대 카드 높이
                
                let cardWidth: number;
                let cardHeight: number;
                
                if (aspectRatio > 1) {
                  // 가로가 더 긴 경우
                  cardWidth = Math.min(maxCardWidth, maxCardHeight * aspectRatio);
                  cardHeight = cardWidth / aspectRatio;
                } else {
                  // 세로가 더 긴 경우
                  cardHeight = Math.min(maxCardHeight, maxCardWidth / aspectRatio);
                  cardWidth = cardHeight * aspectRatio;
                }

                return (
                  <div 
                    key={`sheet-${sheet.sheetIndex}`} 
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm mx-auto"
                    style={{
                      width: `${cardWidth}px`,
                      maxWidth: '100%',
                    }}
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-base text-gray-900">배치 유형 #{index + 1}</span>
                        <span className="text-sm text-gray-600">
                          {groupedSheet.sheetIndices.length.toLocaleString()}장
                        </span>
                      </div>
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 sm:text-sm">
                        면취효율 {groupedSheet.areaUsedPercent.toFixed(1)}%
                      </span>
                    </div>
                    <div
                      className="relative overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50"
                      style={{
                        width: '100%',
                        paddingTop: `${(motherGlass.heightMm / motherGlass.widthMm) * 100}%`,
                      }}
                    >
                      <div className="absolute inset-0">
                        {placements.map((placement, placementIndex) => {
                          const widthPercent = (placement.widthMm / motherGlass.widthMm) * 100;
                          const heightPercent = (placement.heightMm / motherGlass.heightMm) * 100;
                          const left = (placement.x / motherGlass.widthMm) * 100 + offsetXPercent;
                          const top = (placement.y / motherGlass.heightMm) * 100 + offsetYPercent;

                          const spacingMmX = Math.min(10, motherGlass.widthMm * 0.01);
                          const spacingMmY = Math.min(10, motherGlass.heightMm * 0.01);
                          const spacingPercentX = (spacingMmX / motherGlass.widthMm) * 100;
                          const spacingPercentY = (spacingMmY / motherGlass.heightMm) * 100;

                          const adjustedWidthPercent = Math.max(widthPercent - spacingPercentX * 2, 0);
                          const adjustedHeightPercent = Math.max(heightPercent - spacingPercentY * 2, 0);
                          const adjustedLeft = left + spacingPercentX;
                          const adjustedTop = top + spacingPercentY;

                          return (
                            <div
                              key={`${placement.productId}-${placementIndex}`}
                              className="absolute flex items-center justify-center rounded-[4px] border border-blue-300 bg-blue-100 text-[13px] font-medium text-blue-800"
                              style={{
                                left: `${adjustedLeft}%`,
                                top: `${adjustedTop}%`,
                                width: `${adjustedWidthPercent}%`,
                                height: `${adjustedHeightPercent}%`,
                              }}
                            >
                              <span className="px-1 text-center leading-tight">
                                {placement.productName}
                                <br />
                                <span className="text-[12px] text-blue-700">
                                  {placement.modelName}
                                  {placement.rotated && ' (회전)'}
                                </span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </LayoutSlider>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between gap-4 mt-4 pt-4">
        <p className="text-left text-sm text-gray-500">
          * 배치는 제품 회전 가능 여부를 자동 판단하여 구성되며, 실제 생산에서는 추가 최적화가 필요할 수 있습니다.
        </p>
        {showNavigation && onNext && (
          <CommonButton
            variant="blue"
            className="px-6 py-2 text-sm"
            onClick={onNext}
          >
            {currentIndex === totalCount - 1 ? '이전' : '다음'}
          </CommonButton>
        )}
      </div>
    </CommonContainerBox>
  );
}
