'use client';

import React from 'react';
import CommonTableFrame from '@/components/ui/CommonTableFrame';
import type { FacilityHistoryItem } from '@/store/performanceHistoryStore';

interface FacilityHistoryTableProps {
  items: FacilityHistoryItem[];
  emptyMessage?: string;
  onDownload?: (item: FacilityHistoryItem) => void;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
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

  const parts = formatter.formatToParts(date).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value;
    return acc;
  }, {});

  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
};

export default function FacilityHistoryTable({
  items,
  emptyMessage = '작업 내역이 없습니다.',
  onDownload,
}: FacilityHistoryTableProps) {
  return (
    <CommonTableFrame
      header={
        <thead className="bg-gray-50">
          <tr className="text-gray-700">
            <th className="py-2 px-3 text-left text-sm font-semibold tracking-wide">파일명</th>
            <th className="py-2 px-3 text-left text-sm font-semibold tracking-wide">알고리즘</th>
            <th className="py-2 px-3 text-center text-sm font-semibold tracking-wide">버전</th>
            <th className="py-2 px-3 text-center text-sm font-semibold tracking-wide whitespace-nowrap">처리방식</th>
            <th className="py-2 px-3 text-center text-sm font-semibold tracking-wide">파일용량</th>
            <th className="py-2 px-3 text-center text-sm font-semibold tracking-wide">상태</th>
            <th className="py-2 px-3 text-center text-sm font-semibold tracking-wide">담당자</th>
            <th className="py-2 px-3 text-center text-sm font-semibold tracking-wide">완료일시</th>
            <th className="py-2 px-3 text-center text-sm font-semibold tracking-wide">압축시간</th>
            <th className="py-2 px-3 text-center text-sm font-semibold tracking-wide">소요시간</th>
            <th className="py-2 px-3 text-center text-sm font-semibold tracking-wide">작업</th>
          </tr>
        </thead>
      }
      body={
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={10} className="py-12 text-center text-sm text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <tr key={item.id} className="border-b border-gray-100 text-sm text-gray-900 hover:bg-gray-50">
                <td className="max-w-xs truncate py-3 px-3" title={item.fileName}>
                  {item.fileName}
                </td>
                <td className="max-w-xs truncate py-3 px-3" title={item.algorithm}>
                  {item.algorithm}
                </td>
                <td className="py-3 px-3 text-center">
                  <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700">
                    v{item.version}
                  </span>
                </td>
                <td className="py-3 px-3 text-center">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${
                      item.processingMethod === 'GPU'
                        ? 'border-blue-200 bg-blue-50 text-blue-700'
                        : 'border-amber-200 bg-amber-50 text-amber-700'
                    }`}
                  >
                    {item.processingMethod}
                  </span>
                </td>
                <td className="py-3 px-3 text-center">{formatFileSize(item.fileSize)}</td>
                <td className="py-3 px-3 text-center">
                  <span className="inline-block rounded px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
                    {item.status}
                  </span>
                </td>
                <td className="py-3 px-3 text-center">{item.assignedUser}</td>
                <td className="py-3 px-3 text-center">{formatDateTime(item.completedTime)}</td>
                <td className="py-3 px-3 text-center">
                  {item.compressionTime !== undefined ? `${item.compressionTime.toFixed(2)}초` : '-'}
                </td>
                <td className="py-3 px-3 text-center">{formatTime(item.duration)}</td>
                <td className="py-3 px-3 text-center">
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:underline"
                    onClick={() => onDownload?.(item)}
                  >
                    다운로드
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      }
    />
  );
}
