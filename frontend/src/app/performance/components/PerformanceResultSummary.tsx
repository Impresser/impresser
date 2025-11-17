'use client';

import React, { useMemo } from 'react';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import type { ResultComparisonItem } from './PerformanceResultComparisonTable';
import type { Facility } from '../types';

interface PerformanceResultSummaryProps {
  items: ResultComparisonItem[];
  slot1Facility?: Facility | null;
  slot2Facility?: Facility | null;
}

type ComboKey = string;

function bytesToMB(bytes: number): string {
  if (!bytes) return '0 MB';
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function PerformanceResultSummary({ items, slot1Facility, slot2Facility }: PerformanceResultSummaryProps) {
  // 슬롯 1(기존 압축법)과 슬롯 2(신규 압축법)를 고정하여 비교
  const { comboA, comboB } = useMemo(() => {
    let slot1Item: ResultComparisonItem | null = null;
    let slot2Item: ResultComparisonItem | null = null;

    // 슬롯 1(기존 압축법)의 최근 결과 찾기
    if (slot1Facility) {
      const slot1Items = items.filter((it) => it.facilityId === slot1Facility.id);
      if (slot1Items.length > 0) {
        slot1Item = slot1Items.sort((a, b) => b.completedTime.getTime() - a.completedTime.getTime())[0];
      }
    }

    // 슬롯 2(신규 압축법)의 최근 결과 찾기
    if (slot2Facility) {
      const slot2Items = items.filter((it) => it.facilityId === slot2Facility.id);
      if (slot2Items.length > 0) {
        slot2Item = slot2Items.sort((a, b) => b.completedTime.getTime() - a.completedTime.getTime())[0];
      }
    }

    return {
      comboA: slot1Item || null,
      comboB: slot2Item || null,
    };
  }, [items, slot1Facility, slot2Facility]);

  if (!comboA || !comboB) {
    return (
      <CommonContainerBox className="mt-4">
        <div className="text-sm text-gray-600">비교할 결과가 부족합니다. 서로 다른 설정의 결과가 최소 2개 이상 필요합니다.</div>
      </CommonContainerBox>
    );
  }

  // 비교 계산 (소요시간 elapsedTime은 고려하지 않음)
  const aTime = typeof comboA.compressionTime === 'number' ? comboA.compressionTime : undefined;
  const bTime = typeof comboB.compressionTime === 'number' ? comboB.compressionTime : undefined;
  const hasTime = typeof aTime === 'number' && typeof bTime === 'number' && aTime! > 0 && bTime! > 0;
  const faster = hasTime ? (aTime! <= bTime! ? 'LEGACY' : 'NEW') : undefined;
  const timeImprovePct =
    hasTime
      ? ((Math.max(aTime!, bTime!) - Math.min(aTime!, bTime!)) / Math.max(aTime!, bTime!)) * 100
      : undefined;

  // 압축률(%) 비교 - compressionRatio는 백분율로 환산해서 표기
  // 응답이 정수(예: 100)라면 100%로 간주
  const aRatio = comboA.compressionRatio;
  const bRatio = comboB.compressionRatio;
  const hasRatio = typeof aRatio === 'number' && typeof bRatio === 'number';
  const betterRatio = hasRatio ? (aRatio >= bRatio ? 'LEGACY' : 'NEW') : undefined; // 더 높은 비율이 우수한 것으로 가정
  const ratioDiffAbs = hasRatio ? Math.abs(aRatio - bRatio) : undefined;

  // 파일 크기 비교(결과 TIFF 기준, 참고용)
  const aSize = comboA.fileSizeBytes;
  const bSize = comboB.fileSizeBytes;
  const hasSize = typeof aSize === 'number' && typeof bSize === 'number' && aSize > 0 && bSize > 0;
  const smallerSize = hasSize ? (aSize <= bSize ? 'LEGACY' : 'NEW') : undefined;

  // 우수한 알고리즘 판단: 압축시간 작음, 압축률 높음, TIFF 크기 작음
  const getBetterAlgorithm = (): 'LEGACY' | 'NEW' | null => {
    let legacyScore = 0;
    let newScore = 0;

    if (hasTime) {
      if (aTime! < bTime!) legacyScore++;
      else if (bTime! < aTime!) newScore++;
    }

    if (hasRatio) {
      // 압축률이 높을수록 좋다고 가정 (더 높은 비율이 우수)
      if (aRatio! > bRatio!) legacyScore++;
      else if (bRatio! > aRatio!) newScore++;
    }

    if (hasSize) {
      if (aSize <= bSize) legacyScore++;
      else newScore++;
    }

    if (legacyScore > newScore) return 'LEGACY';
    if (newScore > legacyScore) return 'NEW';
    return null;
  };

  const betterAlgorithm = getBetterAlgorithm();

  const Chip = ({ children, color = 'gray' }: { children: React.ReactNode; color?: 'blue' | 'amber' | 'gray' }) => {
    const style =
      color === 'blue'
        ? 'border-blue-200 bg-blue-50 text-blue-700'
        : color === 'amber'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-gray-200 bg-gray-100 text-gray-700';
    return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${style}`}>{children}</span>;
  };

  const Block = ({ title, value, isBetter }: { title: string; value: React.ReactNode; isBetter?: boolean }) => (
    <div className="flex flex-row items-center justify-between gap-2 w-full">
      <span className="text-xs font-medium text-gray-500 flex-shrink-0">{title}</span>
      <span className={`text-sm font-semibold text-right flex-1 ${isBetter ? 'text-[#0059FF]' : 'text-gray-900'}`}>{value}</span>
    </div>
  );

  return (
    <div className="mt-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 기존 압축법 */}
        <div className={`rounded-lg border p-3 ${betterAlgorithm === 'LEGACY' ? 'border-[#0059FF]/30 bg-[#0059FF]/5' : 'border-gray-200 bg-white'}`}>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-base font-semibold ${betterAlgorithm === 'LEGACY' ? 'text-[#0059FF]' : 'text-gray-900'}`}>기존 압축 설정</span>
              {slot1Facility?.name && (
                <span className="text-xs text-gray-500">{slot1Facility.name}</span>
              )}
            </div>
            <Chip color="blue">{comboA.processingMethod.toUpperCase()}</Chip>
          </div>
          <div className="space-y-2">
            <Block title="알고리즘" value={comboA.algorithm} />
            <Block title="버전" value={`v${comboA.version}`} />
            <Block 
              title="압축시간" 
              value={typeof aTime === 'number' ? `${aTime.toFixed(2)}초` : '-'}
              isBetter={hasTime && aTime! < bTime!}
            />
            <Block 
              title="압축률" 
              value={typeof aRatio === 'number' ? `${aRatio.toFixed(2)}%` : '-'}
              isBetter={hasRatio && aRatio! > bRatio!}
            />
            <Block 
              title="결과 TIFF 크기" 
              value={bytesToMB(aSize)}
              isBetter={hasSize && aSize <= bSize}
            />
          </div>
        </div>

        {/* 신규 압축법 */}
        <div className={`rounded-lg border p-3 ${betterAlgorithm === 'NEW' ? 'border-[#0059FF]/30 bg-[#0059FF]/5' : 'border-gray-200 bg-white'}`}>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-base font-semibold ${betterAlgorithm === 'NEW' ? 'text-[#0059FF]' : 'text-gray-900'}`}>신규 압축 설정</span>
              {slot2Facility?.name && (
                <span className="text-xs text-gray-500">{slot2Facility.name}</span>
              )}
            </div>
            <Chip color="amber">{comboB.processingMethod.toUpperCase()}</Chip>
          </div>
          <div className="space-y-2">
            <Block title="알고리즘" value={comboB.algorithm} />
            <Block title="버전" value={`v${comboB.version}`} />
            <Block 
              title="압축시간" 
              value={typeof bTime === 'number' ? `${bTime.toFixed(2)}초` : '-'}
              isBetter={hasTime && bTime! < aTime!}
            />
            <Block 
              title="압축률" 
              value={typeof bRatio === 'number' ? `${bRatio.toFixed(2)}%` : '-'}
              isBetter={hasRatio && bRatio! > aRatio!}
            />
            <Block 
              title="결과 TIFF 크기" 
              value={bytesToMB(bSize)}
              isBetter={hasSize && bSize < aSize}
            />
          </div>
        </div>

        {/* 비교 결과 */}
        <div className="rounded-lg border border-gray-200 p-3 bg-white">
          <div className="mb-2">
            <span className="text-base font-semibold text-gray-900">비교 결과</span>
          </div>
          <div className="space-y-3 text-sm">
            <div className="rounded-md bg-blue-50 border border-blue-200 p-2">
              <div className="text-blue-800 font-semibold mb-1">속도 비교 (압축시간)</div>
              {hasTime ? (
                <div className="text-blue-900">
                  {faster === 'LEGACY' ? '기존 알고리즘' : '신규 알고리즘'}이 빠름 · 약{' '}
                  <span className="font-semibold">{timeImprovePct!.toFixed(2)}%</span> 단축
                </div>
              ) : (
                <div className="text-blue-900">비교할 압축시간 정보가 부족합니다.</div>
              )}
            </div>

            <div className="rounded-md bg-emerald-50 border border-emerald-200 p-2">
              <div className="text-emerald-800 font-semibold mb-1">압축률 비교</div>
              {hasRatio ? (
                ratioDiffAbs === 0 ? (
                  <div className="text-emerald-900">
                    압축률이 동일함 · <span className="font-semibold">{aRatio!.toFixed(2)}%</span>
                  </div>
                ) : (
                  <div className="text-emerald-900">
                    {betterRatio === 'LEGACY' ? '기존 알고리즘' : '신규 알고리즘'}이 우수함 · 압축률{' '}
                    <span className="font-semibold">{ratioDiffAbs!.toFixed(2)}%</span> 차이
                  </div>
                )
              ) : (
                <div className="text-emerald-900">비교할 압축률 정보가 부족합니다.</div>
              )}
            </div>

            <div className="rounded-md bg-gray-50 border border-gray-200 p-2">
              <div className="text-gray-800 font-semibold mb-1">설정 요약</div>
              <div className="text-gray-700">
                기존 알고리즘: {comboA.algorithm} · v{comboA.version} · {comboA.processingMethod.toUpperCase()}
              </div>
              <div className="text-gray-700">
                신규 알고리즘: {comboB.algorithm} · v{comboB.version} · {comboB.processingMethod.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


