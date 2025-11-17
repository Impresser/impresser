'use client';

import React from 'react';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import CommonTableFrame from '@/components/ui/CommonTableFrame';
import { QueueItem } from '@/components/ui/CommonTable';
import Button from '@/components/ui/CommonButton';

interface CompressionQueueProps {
  queue: QueueItem[];
  onStartCompression: () => void | Promise<void>;
  isStarting?: boolean;
}

// 파일 크기 포맷팅 함수 (KB 단위로 들어옴)
const formatFileSize = (kb: number) => {
  if (kb === 0) return '0.00 KB';
  const k = 1024; // 1024 단위로 계산 (1 MB = 1024 KB, 1 GB = 1024 MB)
  const sizes = ['KB', 'MB', 'GB'];
  // KB 단위로 들어오므로
  // 0 ~ 1023 KB → KB
  // 1024 ~ 1048575 KB → MB (1024로 나눔)
  // 1048576 KB 이상 → GB (1024^2로 나눔)
  if (kb < k) {
    return (Math.floor(kb * 100) / 100).toFixed(2) + ' ' + sizes[0];
  } else if (kb < k * k) {
    return (Math.floor((kb / k) * 100) / 100).toFixed(2) + ' ' + sizes[1];
  } else {
    return (Math.floor((kb / (k * k)) * 100) / 100).toFixed(2) + ' ' + sizes[2];
  }
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
  
  const parts = formatter.formatToParts(date).reduce<Record<string, string>>((acc, p) => {
    if (p.type !== 'literal') acc[p.type] = p.value;
    return acc;
  }, {});
  
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
};

const truncateFileName = (fileName: string, maxLength: number = 30): string => {
  if (fileName.length <= maxLength) return fileName;
  return fileName.substring(0, maxLength) + '...';
};

export default function CompressionQueue({
  queue,
  onStartCompression,
  isStarting = false,
}: CompressionQueueProps) {
  // 압축이 진행 중인지 확인
  const isCompressionInProgress = queue.some((item) => item.status === '진행');
  const hasWaitingItem = queue.some((item) => item.status === '대기');
  
  return (
    <div className="mt-8">
      <h1 className="text-xl font-bold text-gray-900 mb-3">압축대기열</h1>

      <CommonContainerBox>
        <CommonTableFrame
          className="overflow-visible"
          header={
            <thead className="bg-gray-50">
              <tr className="text-gray-700">
                <th className="text-left font-semibold text-medium tracking-wide py-2 px-3">파일명</th>
                <th className="text-left font-semibold text-medium tracking-wide py-2 px-3">알고리즘</th>
                <th className="text-center font-semibold text-medium tracking-wide py-2 px-3">버전</th>
                <th className="text-center font-semibold text-medium tracking-wide py-2 px-3 whitespace-nowrap">처리방식</th>
                <th className="text-center font-semibold text-medium tracking-wide py-2 px-3">파일용량</th>
                <th className="text-center font-semibold text-medium tracking-wide py-2 px-3">상태</th>
                <th className="text-center font-semibold text-medium tracking-wide py-2 px-3">담당자</th>
                <th className="text-center font-semibold text-medium tracking-wide py-2 px-3">시작시각</th>
                <th className="text-center font-semibold text-medium tracking-wide py-2 px-3">경과시간</th>
                <th className="text-center font-semibold text-medium tracking-wide py-2 px-3">예상시간</th>
                <th className="text-center font-semibold text-medium tracking-wide py-2 px-3">진행률</th>
              </tr>
            </thead>
          }
          body={
            <tbody>
              {queue.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-gray-500 text-sm">
                    대기열에 추가된 항목이 없습니다.
                  </td>
                </tr>
              ) : (
                queue.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-100 text-sm text-gray-900 hover:bg-gray-50"
                  >
                    <td className="py-3 px-3" title={item.fileName}>
                      {truncateFileName(item.fileName)}
                    </td>
                    <td className="py-3 px-3 text-left">
                      <span className="truncate max-w-xs block" title={item.algorithm}>
                        {item.algorithm}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 border border-gray-200 px-2 py-0.5 text-[11px]">
                        v{item.version}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`${
                          item.processingMethod === 'GPU'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        } inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]`}
                      >
                        {item.processingMethod}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">{formatFileSize(item.fileSize)}</td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${
                          item.status === '진행'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-gray-100 text-gray-700 border-gray-200'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">{item.assignedUser}</td>
                    <td className="py-3 px-3 text-center">
                      {item.startTime ? formatDateTime(item.startTime) : '-'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {item.status === '진행' ? formatTime(item.elapsedTime) : '-'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {item.estimatedTime > 0 ? formatTime(item.estimatedTime) : '-'}
                    </td>
                    <td className="py-3 px-3">
                      {item.status === '진행' ? (
                        <div className="relative flex-1 bg-gray-200 rounded h-4 min-w-[100px]">
                          <div
                            className="bg-blue-600 h-4 rounded transition-all duration-300"
                            style={{ width: `${item.progress}%` }}
                          />
                          <span className={`absolute inset-0 flex items-center justify-center text-xs font-medium ${
                            item.progress > 45 ? 'text-white' : 'text-gray-700'
                          }`}>
                            {item.progress}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-center">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          }
        />
      </CommonContainerBox>
    </div>
  );
}


