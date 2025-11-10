'use client';

import React from 'react';
import CommonTableFrame from '@/components/ui/CommonTableFrame';
import type { QueueItem } from '@/components/ui/CommonTable';

interface FacilityQueueTableProps {
  items: QueueItem[];
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const formatTime = (seconds: number): string => {
  if (!seconds) return '-';
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

const formatDateTime = (date: Date | null): string => {
  if (!date) return '-';
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
    if (part.type !== 'literal') {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});

  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
};

export default function FacilityQueueTable({ items }: FacilityQueueTableProps) {
  return (
    <CommonTableFrame
      header={
        <thead className="bg-gray-50">
          <tr className="text-gray-700">
            <th className="py-2 px-3 text-left text-xs font-semibold tracking-wide">파일명</th>
            <th className="py-2 px-3 text-center text-xs font-semibold tracking-wide">처리방식</th>
            <th className="py-2 px-3 text-center text-xs font-semibold tracking-wide">알고리즘</th>
            <th className="py-2 px-3 text-center text-xs font-semibold tracking-wide">버전</th>
            <th className="py-2 px-3 text-center text-xs font-semibold tracking-wide">파일용량</th>
            <th className="py-2 px-3 text-center text-xs font-semibold tracking-wide">상태</th>
            <th className="py-2 px-3 text-center text-xs font-semibold tracking-wide">담당자</th>
            <th className="py-2 px-3 text-center text-xs font-semibold tracking-wide">시작시각</th>
            <th className="py-2 px-3 text-center text-xs font-semibold tracking-wide">경과시간</th>
            <th className="py-2 px-3 text-center text-xs font-semibold tracking-wide">예상시간</th>
            <th className="py-2 px-3 text-center text-xs font-semibold tracking-wide">진행률</th>
          </tr>
        </thead>
      }
      body={
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={11} className="py-12 text-center text-sm text-gray-500">
                작업대기열이 없습니다.
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <tr key={item.id} className="border-b border-gray-100 text-sm text-gray-900 hover:bg-gray-50">
                <td className="max-w-xs truncate py-3 px-3" title={item.fileName}>
                  {item.fileName}
                </td>
                <td className="py-3 px-3 text-center">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${
                      item.processingMethod?.toUpperCase() === 'GPU'
                        ? 'border-blue-200 bg-blue-50 text-blue-700'
                        : 'border-amber-200 bg-amber-50 text-amber-700'
                    }`}
                  >
                    {item.processingMethod || '-'}
                  </span>
                </td>
                <td className="py-3 px-3 text-center">{item.algorithm || '-'}</td>
                <td className="py-3 px-3 text-center">{item.version ? `v${item.version}` : '-'}</td>
                <td className="py-3 px-3 text-center">{formatFileSize(item.fileSize)}</td>
                <td className="py-3 px-3 text-center">
                  <span
                    className={`inline-block rounded px-2 py-1 text-xs font-medium ${
                      item.status === '진행'
                        ? 'bg-blue-100 text-blue-800'
                        : item.status === '대기'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="py-3 px-3 text-center">{item.assignedUser || '-'}</td>
                <td className="py-3 px-3 text-center">{formatDateTime(item.startTime)}</td>
                <td className="py-3 px-3 text-center">{formatTime(item.elapsedTime)}</td>
                <td className="py-3 px-3 text-center">{formatTime(item.estimatedTime)}</td>
                <td className="py-3 px-3">
                  {item.status === '진행' ? (
                    <div className="relative min-w-[100px] rounded bg-gray-200">
                      <div
                        className="h-4 rounded bg-blue-600 transition-all duration-300"
                        style={{ width: `${item.progress}%` }}
                      />
                      <span
                        className={`absolute inset-0 flex items-center justify-center text-xs font-medium ${
                          item.progress > 45 ? 'text-white' : 'text-gray-700'
                        }`}
                      >
                        {item.progress}%
                      </span>
                    </div>
                  ) : (
                    <span className="flex justify-center">-</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      }
    />
  );
}
