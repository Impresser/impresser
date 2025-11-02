'use client';

import React from 'react';

export interface QueueItem {
  id: string;
  fileName: string;
  processingMethod: string;
  algorithm: string;
  version: string;
  fileSize: number;
  status: '대기' | '진행';
  assignedUser: string;
  startTime: Date | null;
  elapsedTime: number; // 초 단위
  estimatedTime: number; // 초 단위
  progress: number; // 0-100
}

interface CommonTableProps {
  data: QueueItem[];
  emptyMessage?: string;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

export default function CommonTable({ data, emptyMessage = '데이터가 없습니다.' }: CommonTableProps) {
  return (
    <div className="space-y-4">
      {/* 테이블 헤더 */}
      <div className="grid grid-cols-12 gap-4 pb-3 border-b border-gray-200 text-sm font-semibold text-gray-700">
        <div className="col-span-2">파일명</div>
        <div className="col-span-1">처리방식</div>
        <div className="col-span-1">알고리즘</div>
        <div className="col-span-1">버전</div>
        <div className="col-span-1">파일용량</div>
        <div className="col-span-1">상태</div>
        <div className="col-span-1">담당자</div>
        <div className="col-span-1">시작시각</div>
        <div className="col-span-1">경과시간</div>
        <div className="col-span-1">예상시간</div>
        <div className="col-span-1">진행률</div>
      </div>

      {/* 테이블 행 또는 빈 메시지 */}
      {data.length === 0 ? (
        <div className="py-12 text-center text-gray-500 text-sm">
          {emptyMessage}
        </div>
      ) : (
        data.map((item) => (
        <div
          key={item.id}
          className="grid grid-cols-12 gap-4 py-3 border-b border-gray-100 text-sm text-gray-900"
        >
          <div className="col-span-2 truncate" title={item.fileName}>
            {item.fileName}
          </div>
          <div className="col-span-1">{item.processingMethod}</div>
          <div className="col-span-1 truncate" title={item.algorithm}>
            {item.algorithm}
          </div>
          <div className="col-span-1">{item.version}</div>
          <div className="col-span-1">{formatFileSize(item.fileSize)}</div>
          <div className="col-span-1">
            <span
              className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                item.status === '진행'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {item.status}
            </span>
          </div>
          <div className="col-span-1">{item.assignedUser}</div>
          <div className="col-span-1 text-xs">
            {item.startTime ? formatDateTime(item.startTime) : '-'}
          </div>
          <div className="col-span-1">
            {item.status === '진행' ? formatTime(item.elapsedTime) : '-'}
          </div>
          <div className="col-span-1">
            {item.estimatedTime > 0 ? formatTime(item.estimatedTime) : '-'}
          </div>
          <div className="col-span-1">
            {item.status === '진행' ? (
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600 min-w-[3rem]">
                  {item.progress}%
                </span>
              </div>
            ) : (
              '-'
            )}
          </div>
        </div>
      ))
      )}
    </div>
  );
}

