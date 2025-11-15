'use client';

import React, { useCallback } from 'react';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import type { Facility } from '../types';
import CommonButton from '@/components/ui/CommonButton';
import type { QueueItem, HistoryItem } from '@/components/ui/CommonTable';
import PerformanceSimulatorSlot from './PerformanceSimulatorSlot';

interface PerformanceSimulatorProps {
  slots: (Facility | null)[];
  onRemove: (index: number) => void;
  onRun?: (slots: (Facility | null)[]) => void;
  queueData: {
    queueItems: QueueItem[];
    processingItems: QueueItem[];
    overallProgress: number;
  }[];
  historyData: {
    historyItems: HistoryItem[];
    isLoadingHistory: boolean;
    historyError: string | null;
  }[];
  onDownload?: (item: HistoryItem) => void;
  settings: {
    processingMethod: 'cpu' | 'gpu';
    algorithm: string;
    version: string;
  }[];
  onSettingsChange: (
    index: number,
    update: Partial<{
      processingMethod: 'cpu' | 'gpu';
      algorithm: string;
      version: string;
    }>
  ) => void;
  onQueueUpload?: (
    facility: Facility,
    payload: {
      files: File[];
      processingMethod: string;
      algorithm: string;
      version: string;
      fileInfos?: Array<{
        fileName: string;
        imageUrl: string;
        compressionTypeUuid: string;
        bmpVolume: number;
        bmpWidth: number;
        bmpHeight: number;
        algorithm: string;
        version: string;
        processingMethod: string;
      }>;
    }
  ) => void;
}

export default function PerformanceSimulator({
  slots,
  onRemove,
  onRun,
  queueData,
  historyData,
  settings,
  onSettingsChange,
  onQueueUpload,
  onDownload,
}: PerformanceSimulatorProps) {
  const isRunnable = slots.some((slot) => slot !== null);

  const handleCardClick = useCallback((slotIndex: number) => {
    // 클릭 시 페이지 상단으로 스크롤
    // main 요소가 스크롤 컨테이너인 경우를 우선 처리
    const mainElement = document.querySelector('main.overflow-y-auto');
    if (mainElement) {
      mainElement.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // window 스크롤
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">알고리즘 성능 비교</h2>
      <CommonContainerBox>
        <div className="space-y-6">
          {/* 슬롯 1 */}
          <PerformanceSimulatorSlot
            slotIndex={0}
            facility={slots[0]}
            settings={settings[0]}
            queueData={queueData[0] || { queueItems: [], processingItems: [], overallProgress: 0 }}
            historyData={historyData[0] || { historyItems: [], isLoadingHistory: false, historyError: null }}
            onRemove={() => onRemove(0)}
            onSettingsChange={(update) => onSettingsChange(0, update)}
            onQueueUpload={onQueueUpload}
            onCardClick={() => handleCardClick(0)}
            onDownload={onDownload}
          />

          {/* 슬롯 2 */}
          <PerformanceSimulatorSlot
            slotIndex={1}
            facility={slots[1]}
            settings={settings[1]}
            queueData={queueData[1] || { queueItems: [], processingItems: [], overallProgress: 0 }}
            historyData={historyData[1] || { historyItems: [], isLoadingHistory: false, historyError: null }}
            onRemove={() => onRemove(1)}
            onSettingsChange={(update) => onSettingsChange(1, update)}
            onQueueUpload={onQueueUpload}
            onCardClick={() => handleCardClick(1)}
            onDownload={onDownload}
          />

          <div className="flex justify-end">
            <CommonButton
              variant="blue"
              className="px-6 py-2"
              onClick={() => onRun?.(slots)}
              disabled={!isRunnable}
            >
              실행
            </CommonButton>
          </div>
        </div>
      </CommonContainerBox>
    </section>
  );
}

