'use client';

import React from 'react';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import CommonTableFrame from '@/components/ui/CommonTableFrame';

export interface ResultComparisonItem {
  facilityId: string;
  facilityName: string;
  fileName: string;
  processingMethod: string;
  algorithm: string;
  version: string | number;
  fileSizeBytes: number;
  compressionRatio?: number;
  compressionTime?: number; // seconds
  elapsedTime: number; // seconds
  completedTime: Date;
  tiffUrl?: string;
}

interface PerformanceResultComparisonTableProps {
  items: ResultComparisonItem[];
  children?: React.ReactNode;
}

const formatFileSize = (bytes: number) => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const formatTime = (seconds?: number): string => {
  if (!seconds && seconds !== 0) return '-';
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

const formatDateTime = (date: Date): string => {
  const formatter = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date).reduce<Record<string, string>>((acc, p) => {
    if (p.type !== 'literal') acc[p.type] = p.value;
    return acc;
  }, {});
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
};

export default function PerformanceResultComparisonTable({
  items,
  children,
}: PerformanceResultComparisonTableProps) {
  return (
    <CommonContainerBox className="mt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">결과 비교</h3>
      <CommonTableFrame
        header={
          <thead className="bg-gray-50">
            <tr className="text-gray-700">
              <th className="py-2 px-3 text-left text-sm font-semibold tracking-wide">설비명</th>
              <th className="py-2 px-3 text-left text-sm font-semibold tracking-wide">파일명</th>
              <th className="py-2 px-3 text-center text-sm font-semibold tracking-wide">처리방식</th>
              <th className="py-2 px-3 text-center text-sm font-semibold tracking-wide">알고리즘</th>
              <th className="py-2 px-3 text-center text-sm font-semibold tracking-wide">버전</th>
              <th className="py-2 px-3 text-center text-sm font-semibold tracking-wide">파일용량</th>
              <th className="py-2 px-3 text-center text-sm font-semibold tracking-wide">압축시간</th>
              <th className="py-2 px-3 text-center text-sm font-semibold tracking-wide">소요시간</th>
              <th className="py-2 px-3 text-center text-sm font-semibold tracking-wide">완료일시</th>
              <th className="py-2 px-3 text-center text-sm font-semibold tracking-wide">작업</th>
            </tr>
          </thead>
        }
        body={
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-sm text-gray-500">
                  비교할 결과가 없습니다.
                </td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr key={`${item.facilityId}-${item.fileName}-${idx}`} className="border-b border-gray-100 text-sm text-gray-900 hover:bg-gray-50">
                  <td className="py-3 px-3 text-left">{item.facilityName}</td>
                  <td className="py-3 px-3 text-left max-w-xs truncate" title={item.fileName}>
                    {item.fileName}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${
                        item.processingMethod.toUpperCase() === 'GPU'
                          ? 'border-blue-200 bg-blue-50 text-blue-700'
                          : 'border-amber-200 bg-amber-50 text-amber-700'
                      }`}
                    >
                      {item.processingMethod.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">{item.algorithm}</td>
                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700">
                      v{item.version}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">{formatFileSize(item.fileSizeBytes)}</td>
                  <td className="py-3 px-3 text-center">
                    {item.compressionTime !== undefined ? `${item.compressionTime.toFixed(2)}초` : '-'}
                  </td>
                  <td className="py-3 px-3 text-center">{formatTime(item.elapsedTime)}</td>
                  <td className="py-3 px-3 text-center">{formatDateTime(item.completedTime)}</td>
                  <td className="py-3 px-3 text-center">
                    {item.tiffUrl ? (
                      <button
                        type="button"
                        className="text-sm text-blue-600 hover:underline"
                        onClick={() => window.open(item.tiffUrl!, '_blank', 'noopener,noreferrer')}
                      >
                        다운로드
                      </button>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        }
      />
      {children}
    </CommonContainerBox>
  );
}


