'use client';

import React from 'react';
import type { Facility } from './FacilityStatistics';
import CommonTable, { QueueItem, HistoryItem } from '@/components/ui/CommonTable';
import CommonContainerBox from '@/components/ui/CommonContainerBox';

interface FacilityDetailPanelProps {
  facility: Facility | null;
  onClose: () => void;
}

export default function FacilityDetailPanel({ facility, onClose }: FacilityDetailPanelProps) {
  if (!facility) return null;

  // 설비별 대기열 및 작업내역 데이터 - 실제로는 API에서 가져와야 함
  // 임시로 설비 ID별로 다른 데이터 제공
  const getQueueItems = (facilityId: string): QueueItem[] => {
    // 각 설비별로 다른 대기열 데이터
    const queueData: Record<string, QueueItem[]> = {
      '1': [
        {
          id: '1-1',
          fileName: 'image001.bmp',
          processingMethod: 'CPU',
          algorithm: 'LZW (Lempel-Ziv-Welch)',
          version: '1.0',
          fileSize: 1048576,
          status: '진행',
          assignedUser: '홍길동',
          startTime: new Date(Date.now() - 120000), // 2분 전
          elapsedTime: 120,
          estimatedTime: 300,
          progress: 40,
        },
        {
          id: '1-2',
          fileName: 'image002.bmp',
          processingMethod: 'GPU',
          algorithm: 'Huffman Coding',
          version: '2.0',
          fileSize: 2097152,
          status: '대기',
          assignedUser: '홍길동',
          startTime: null,
          elapsedTime: 0,
          estimatedTime: 0,
          progress: 0,
        },
      ],
      '2': [
        {
          id: '2-1',
          fileName: 'image005.bmp',
          processingMethod: 'GPU',
          algorithm: 'Arithmetic Coding',
          version: '3.0',
          fileSize: 3145728,
          status: '대기',
          assignedUser: '홍길동',
          startTime: null,
          elapsedTime: 0,
          estimatedTime: 0,
          progress: 0,
        },
      ],
      '5': [
        {
          id: '5-1',
          fileName: 'image006.bmp',
          processingMethod: 'GPU',
          algorithm: 'LZW (Lempel-Ziv-Welch)',
          version: '2.0',
          fileSize: 5242880,
          status: '진행',
          assignedUser: '홍길동',
          startTime: new Date(Date.now() - 60000), // 1분 전
          elapsedTime: 60,
          estimatedTime: 600,
          progress: 10,
        },
        {
          id: '5-2',
          fileName: 'image007.bmp',
          processingMethod: 'GPU',
          algorithm: 'RLE (Run-Length Encoding)',
          version: '1.0',
          fileSize: 2097152,
          status: '진행',
          assignedUser: '홍길동',
          startTime: new Date(Date.now() - 180000), // 3분 전
          elapsedTime: 180,
          estimatedTime: 240,
          progress: 75,
        },
      ],
    };
    return queueData[facilityId] || [];
  };

  const getHistoryItems = (facilityId: string): HistoryItem[] => {
    // 각 설비별로 다른 작업내역 데이터
    const historyData: Record<string, HistoryItem[]> = {
      '1': [
        {
          id: '1-h1',
          fileName: 'image003.bmp',
          processingMethod: 'CPU',
          algorithm: 'RLE (Run-Length Encoding)',
          version: '1.0',
          fileSize: 512000,
          status: '완료',
          assignedUser: '홍길동',
          completedTime: new Date(Date.now() - 3600000), // 1시간 전
          duration: 180,
        },
        {
          id: '1-h2',
          fileName: 'image004.bmp',
          processingMethod: 'GPU',
          algorithm: 'Arithmetic Coding',
          version: '3.0',
          fileSize: 3145728,
          status: '완료',
          assignedUser: '홍길동',
          completedTime: new Date(Date.now() - 7200000), // 2시간 전
          duration: 420,
        },
      ],
      '2': [
        {
          id: '2-h1',
          fileName: 'image008.bmp',
          processingMethod: 'GPU',
          algorithm: 'Huffman Coding',
          version: '2.0',
          fileSize: 1048576,
          status: '완료',
          assignedUser: '홍길동',
          completedTime: new Date(Date.now() - 10800000), // 3시간 전
          duration: 300,
        },
      ],
      '5': [
        {
          id: '5-h1',
          fileName: 'image009.bmp',
          processingMethod: 'GPU',
          algorithm: 'LZW (Lempel-Ziv-Welch)',
          version: '2.0',
          fileSize: 4194304,
          status: '완료',
          assignedUser: '홍길동',
          completedTime: new Date(Date.now() - 5400000), // 1.5시간 전
          duration: 360,
        },
      ],
    };
    return historyData[facilityId] || [];
  };

  const queueItems = getQueueItems(facility.id);
  const historyItems = getHistoryItems(facility.id);

  // 전체 진행률 계산 (진행 중인 항목들만)
  const processingItems = queueItems.filter(item => item.status === '진행');
  const overallProgress = processingItems.length > 0
    ? Math.round(processingItems.reduce((sum, item) => sum + item.progress, 0) / processingItems.length)
    : 0;

  const getStatusColor = (status: Facility['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Facility['status']) => {
    switch (status) {
      case 'active':
        return '가동중';
      case 'inactive':
        return '정지';
      case 'maintenance':
        return '점검중';
      default:
        return '알 수 없음';
    }
  };

  const getProcessingStatusColor = (status?: Facility['processingStatus']) => {
    switch (status) {
      case 'idle':
        return 'bg-gray-100 text-gray-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProcessingStatusText = (status?: Facility['processingStatus']) => {
    switch (status) {
      case 'idle':
        return '대기';
      case 'processing':
        return '처리중';
      case 'error':
        return '오류';
      default:
        return '알 수 없음';
    }
  };

  const formatDate = (date?: Date | string): string => {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="mt-6 space-y-6">
      <CommonContainerBox>
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">설비 상세 정보</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 설비 정보 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div>
            <label className="text-sm font-medium text-gray-500 mb-1 block">설비명</label>
            <p className="text-sm text-gray-900">{facility.name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 mb-1 block">모델명</label>
            <p className="text-sm text-gray-900">{facility.modelName || '-'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 mb-1 block">설비상태</label>
            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(facility.status)}`}>
              {getStatusText(facility.status)}
            </span>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 mb-1 block">진행상태</label>
            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getProcessingStatusColor(facility.processingStatus)}`}>
              {getProcessingStatusText(facility.processingStatus)}
            </span>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 mb-1 block">CPU</label>
            <p className="text-sm text-gray-900">{facility.cpu || '-'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 mb-1 block">GPU</label>
            <p className="text-sm text-gray-900">{facility.gpu || '-'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 mb-1 block">RAM</label>
            <p className="text-sm text-gray-900">{facility.ram || '-'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 mb-1 block">VRAM</label>
            <p className="text-sm text-gray-900">{facility.vram || '-'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 mb-1 block">설치일</label>
            <p className="text-sm text-gray-900">{formatDate(facility.installDate)}</p>
          </div>
        </div>
      </CommonContainerBox>

      {/* 대기열 섹션 */}
      <CommonContainerBox>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">현재 작업 중인 대기열</h3>
        
        {/* 전체 진행률 */}
        {processingItems.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">전체 진행률</label>
              <span className="text-sm font-semibold text-gray-900">{overallProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* 대기열 테이블 */}
        <CommonTable
          data={queueItems}
          emptyMessage="현재 작업 중인 대기열이 없습니다."
          mode="queue"
        />
      </CommonContainerBox>

      {/* 작업내역 섹션 */}
      <CommonContainerBox>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">작업내역</h3>
        <CommonTable
          data={historyItems}
          emptyMessage="작업 내역이 없습니다."
          mode="history"
          onDownload={(item) => {
            console.log('다운로드:', item.fileName);
            // 여기에 실제 다운로드 로직 구현
          }}
        />
      </CommonContainerBox>
    </div>
  );
}

