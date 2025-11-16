'use client';

import React, { useMemo } from 'react';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import type { ResultComparisonItem } from './PerformanceResultComparisonTable';

interface PerformanceResultSummaryProps {
  items: ResultComparisonItem[];
}

type ComboKey = string;

function bytesToMB(bytes: number): string {
  if (!bytes) return '0 MB';
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function PerformanceResultSummary({ items }: PerformanceResultSummaryProps) {
  // 최근 결과 기준으로 서로 다른 2개의 조합(알고리즘/버전/처리방식)을 골라 비교
  const { comboA, comboB } = useMemo(() => {
    const map = new Map<ComboKey, ResultComparisonItem>();
    for (const it of items) {
      const key: ComboKey = `${it.algorithm}|${it.version}|${it.processingMethod.toUpperCase()}`;
      const prev = map.get(key);
      if (!prev || it.completedTime.getTime() > prev.completedTime.getTime()) {
        map.set(key, it);
      }
    }
    const list = Array.from(map.values()).sort((a, b) => b.completedTime.getTime() - a.completedTime.getTime());
    return {
      comboA: list[0],
      comboB: list[1],
    };
  }, [items]);

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
  const betterRatio = hasRatio ? (aRatio <= bRatio ? 'LEGACY' : 'NEW') : undefined; // 더 낮은 비율이 우수한 것으로 가정
  const ratioDiffAbs = hasRatio ? Math.abs(aRatio - bRatio) : undefined;

  // 파일 크기 비교(결과 TIFF 기준, 참고용)
  const aSize = comboA.fileSizeBytes;
  const bSize = comboB.fileSizeBytes;

  const Chip = ({ children, color = 'gray' }: { children: React.ReactNode; color?: 'blue' | 'amber' | 'gray' }) => {
    const style =
      color === 'blue'
        ? 'border-blue-200 bg-blue-50 text-blue-700'
        : color === 'amber'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-gray-200 bg-gray-100 text-gray-700';
    return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${style}`}>{children}</span>;
  };

  const Block = ({ title, value }: { title: string; value: React.ReactNode }) => (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-500">{title}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  );

  return (
    <CommonContainerBox className="mt-4">
      <h4 className="text-base font-semibold text-gray-900 mb-3">결과 비교 요약</h4>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 기존 압축법 */}
        <div className="rounded-lg border border-gray-200 p-3 bg-white">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">기존 압축법</span>
            <Chip color="blue">{comboA.processingMethod.toUpperCase()}</Chip>
          </div>
          <div className="space-y-2">
            <Block title="알고리즘" value={comboA.algorithm} />
            <Block title="버전" value={`v${comboA.version}`} />
            <Block title="압축시간" value={typeof aTime === 'number' ? `${aTime.toFixed(2)}초` : '-'} />
            <Block title="압축률" value={typeof aRatio === 'number' ? `${aRatio.toFixed(2)}%` : '-'} />
            <Block title="결과 TIFF 크기" value={bytesToMB(aSize)} />
          </div>
        </div>

        {/* 신규 압축법 */}
        <div className="rounded-lg border border-gray-200 p-3 bg-white">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">신규 압축법</span>
            <Chip color="amber">{comboB.processingMethod.toUpperCase()}</Chip>
          </div>
          <div className="space-y-2">
            <Block title="알고리즘" value={comboB.algorithm} />
            <Block title="버전" value={`v${comboB.version}`} />
            <Block title="압축시간" value={typeof bTime === 'number' ? `${bTime.toFixed(2)}초` : '-'} />
            <Block title="압축률" value={typeof bRatio === 'number' ? `${bRatio.toFixed(2)}%` : '-'} />
            <Block title="결과 TIFF 크기" value={bytesToMB(bSize)} />
          </div>
        </div>

        {/* 비교 결과 */}
        <div className="rounded-lg border border-gray-200 p-3 bg-white">
          <div className="mb-2">
            <span className="text-sm font-semibold text-gray-900">비교 결과</span>
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
                <div className="text-emerald-900">
                  {betterRatio === 'LEGACY' ? '기존 알고리즘' : '신규 알고리즘'}이 우수함 · 압축률{' '}
                  <span className="font-semibold">{ratioDiffAbs!.toFixed(2)}%</span> 차이
                </div>
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
    </CommonContainerBox>
  );
}


