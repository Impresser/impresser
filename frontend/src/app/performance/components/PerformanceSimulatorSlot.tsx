'use client';

import React, { useCallback } from 'react';
import type { Facility } from '../types';
import PerformanceSimulatorCard from './PerformanceSimulatorCard';
import PerformanceSimulatorSettings from './PerformanceSimulatorSettings';
import type { QueueItem, HistoryItem } from '@/components/ui/CommonTable';

interface PerformanceSimulatorSlotProps {
  slotIndex: number;
  facility: Facility | null;
  settings: {
    processingMethod: 'cpu' | 'gpu';
    algorithm: string;
    version: string;
  };
  queueData: {
    queueItems: QueueItem[];
    processingItems: QueueItem[];
    overallProgress: number;
  };
  historyData: {
    historyItems: HistoryItem[];
    isLoadingHistory: boolean;
    historyError: string | null;
  };
  onDownload?: (item: HistoryItem) => void;
  onRemove: () => void;
  onSettingsChange: (update: Partial<{
    processingMethod: 'cpu' | 'gpu';
    algorithm: string;
    version: string;
  }>) => void;
  onCardClick?: () => void;
}

export default function PerformanceSimulatorSlot({
  slotIndex,
  facility,
  settings,
  queueData,
  historyData,
  onRemove,
  onSettingsChange,
  onCardClick,
  onDownload,
}: PerformanceSimulatorSlotProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        {slotIndex === 0 ? '기존 알고리즘' : '신규 알고리즘'}
      </h3>
      {/* 상단: 설비카드와 알고리즘 설정 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-stretch">
        {/* 왼쪽: 설비카드 */}
        <div>
          <PerformanceSimulatorCard
            facility={facility}
            slotIndex={slotIndex}
            onRemove={onRemove}
            settings={settings}
            onClick={!facility ? onCardClick : undefined}
          />
        </div>
        
        {/* 오른쪽: 알고리즘 설정과 확정된 알고리즘 정보 */}
        <div className="space-y-4">
          <PerformanceSimulatorSettings
            slotIndex={slotIndex}
            settings={settings}
            onSettingsChange={onSettingsChange}
          />
          {/* 확정된 알고리즘 정보 */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4">
            <h4 className="mb-3 text-sm font-semibold text-blue-800">확정된 압축방법</h4>
            <div className="grid gap-2 text-sm text-blue-700 md:grid-cols-3">
              <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-sm border border-blue-100">
                <span className="text-xs font-medium text-blue-600">알고리즘</span>
                <span className="text-sm font-semibold text-blue-900">
                  {settings.algorithm || '미선택'}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-sm border border-blue-100">
                <span className="text-xs font-medium text-blue-600">버전</span>
                <span className="text-sm font-semibold text-blue-900">
                  {settings.version || '미선택'}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-sm border border-blue-100">
                <span className="text-xs font-medium text-blue-600">처리방식</span>
                <span className="text-sm font-semibold text-blue-900">
                  {settings.processingMethod.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

