'use client';

import React, { useMemo } from 'react';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import type { LayoutComputationResult } from '../utils/layoutCalculations';

interface GenerationOverallSummary {
  motherGlassName: string;
  productSummary: string;
  averageUsedPercent: number;
  averageRemainingPercent: number;
  sheetCount: number;
}

interface MotherGlassLayoutPreviewProps {
  layoutResult: LayoutComputationResult;
  overallSummary?: GenerationOverallSummary[];
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

export default function MotherGlassLayoutPreview({ layoutResult, overallSummary }: MotherGlassLayoutPreviewProps) {
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

    return Array.from(groups.values());
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

  const overallGenerationSummary = overallSummary ?? [];

  return (
    <CommonContainerBox className="px-4 py-4">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {motherGlass.generationName || '-'} 원장 배치도
          </h3>
        </div>
        <div className="rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600">
          원장 크기: {motherGlass.widthMm.toLocaleString()}mm × {motherGlass.heightMm.toLocaleString()}mm
        </div>
      </div>

      {!hasPlacements ? (
        <div className="rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
          현재 선택한 제품 조합은 원장에 배치되지 않았습니다. 제품 수량이나 원장을 다시 확인해주세요.
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <div className="mt-2 grid gap-4 lg:grid-cols-2">
              {uniqueSheetsForVisualization.map((sheet, index) => {
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

                return (
                  <div key={`sheet-${sheet.sheetIndex}`} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between text-sm">
                      <span className="font-semibold text-gray-900">배치 유형 #{index + 1}</span>
                      <span className="text-sm text-gray-500">
                        실제 사용: {groupedSheets[index].sheetIndices.length.toLocaleString()}장
                      </span>
                    </div>
                    <div
                      className="relative overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50"
                      style={{
                        width: '75%',
                        paddingTop: `${(motherGlass.heightMm / motherGlass.widthMm) * 75}%`,
                        margin: '0 auto',
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
            </div>
            <p className="mt-2 text-sm text-gray-500">
              * 배치는 제품 회전 가능 여부를 자동 판단하여 구성되며, 실제 생산에서는 추가 최적화가 필요할 수 있습니다. 실제 사용된 원장 수: {totalMotherGlassesUsed.toLocaleString()} 장
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-base font-semibold text-gray-900">패널 배치 요약</h4>
              <div className="mt-2 overflow-hidden rounded-xl border border-gray-200">
                <div className="grid grid-cols-[0.5fr_0.5fr_3fr_1fr_1fr] gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-600 text-center">
                  <span>원장 종류</span>
                  <span>배치 유형</span>
                  <span>포함 제품</span>
                  <span>사용 면적</span>
                  <span>사용 장수</span>
                </div>
                <div className="divide-y divide-gray-100 text-sm text-gray-700">
                  {groupedSheets.map((sheet, index) => (
                    <div key={`sheet-summary-${sheet.signature}`} className="grid grid-cols-[0.5fr_0.5fr_3fr_1fr_1fr] gap-2 px-4 py-2">
                      <span className="text-center text-sm font-medium text-gray-900">{sheet.motherGlassName}</span>
                      <span className="text-center text-gray-900">유형 #{index + 1}</span>
                      <span className="text-right text-gray-600 whitespace-pre-line">{sheet.productSummary}</span>
                      <span className="text-right text-blue-600">{sheet.areaUsedPercent.toFixed(1)}% 사용<br />
                        <span className="text-[12px] text-gray-400">잔여 {sheet.areaRemainingPercent.toFixed(1)}%</span>
                      </span>
                      <span className="text-right text-gray-900">{sheet.sheetIndices.length.toLocaleString()} 장</span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-[0.5fr_0.5fr_3fr_1fr_1fr] gap-2 border-t border-gray-100 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700">
                  <span className="text-left">총계</span>
                  <span className="text-left">-</span>
                  <span className="text-right text-gray-500">총 배치 {totalPlacedProducts.toLocaleString()} 개</span>
                  <span className="text-right text-blue-600">평균 효율 {overallAreaUtilizationPercent.toFixed(1)}%</span>
                  <span className="text-right">{totalMotherGlassesUsed.toLocaleString()} 장</span>
                </div>
              </div>
            </div>

            {overallGenerationSummary.length > 0 && (
              <div>
                <h4 className="text-base font-semibold text-gray-900">전체 배치 요약</h4>
                <div className="mt-2 overflow-hidden rounded-xl border border-[#0059FF]/20">
                  <div className="grid grid-cols-[1.2fr_2.8fr_1fr_1fr] gap-2 border-b border-[#0059FF]/10 bg-[#0059FF]/5 px-4 py-2 text-sm font-semibold text-[#0059FF] text-center">
                    <span>원장 세대</span>
                    <span>포함 제품</span>
                    <span>평균 사용 면적</span>
                    <span>사용 장수</span>
                  </div>
                  <div className="divide-y divide-[#0059FF]/10 text-sm text-gray-700">
                    {overallGenerationSummary.map((summary) => (
                      <div key={`overall-summary-${summary.motherGlassName}`} className="grid grid-cols-[1.2fr_2.8fr_1fr_1fr] gap-2 px-4 py-2">
                        <span className="text-sm font-semibold text-gray-900">{summary.motherGlassName}</span>
                        <span className="text-right text-gray-600 whitespace-pre-line">{summary.productSummary}</span>
                        <span className="text-right text-[#0059FF]">{summary.averageUsedPercent.toFixed(1)}% 사용<br />
                          <span className="text-[10px] text-gray-400">잔여 {summary.averageRemainingPercent.toFixed(1)}%</span>
                        </span>
                        <span className="text-right text-gray-900">{summary.sheetCount.toLocaleString()} 장</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </CommonContainerBox>
  );
}
