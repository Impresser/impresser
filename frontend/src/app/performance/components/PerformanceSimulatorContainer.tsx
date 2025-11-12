'use client';

import React from 'react';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import type { Facility } from '../types';
import PerformanceComparisonCard from './PerformanceComparisonCard';
import CommonButton from '@/components/ui/CommonButton';
import type { QueueItem } from '@/components/ui/CommonTable';

interface PerformanceSimulatorContainerProps {
  slots: (Facility | null)[];
  onRemove: (index: number) => void;
  onRun?: (slots: (Facility | null)[]) => void;
  queueData: {
    queueItems: QueueItem[];
    processingItems: QueueItem[];
    overallProgress: number;
  }[];
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
  onAddTask?: (
    facility: Facility,
    settings: {
      processingMethod: 'cpu' | 'gpu';
      algorithm: string;
      version: string;
    }
  ) => void;
}

export default function PerformanceSimulatorContainer({
  slots,
  onRemove,
  onRun,
  queueData,
  settings,
  onSettingsChange,
  onAddTask,
}: PerformanceSimulatorContainerProps) {
  const isRunnable = slots.some((slot) => slot !== null);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">알고리즘 성능 비교</h2>
      <CommonContainerBox>
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {settings.map((slotSettings, index) => (
              <div
                key={`performance-slot-settings-${index}`}
                className="rounded-xl border border-gray-200 bg-gray-50/70 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">슬롯 {index + 1} 압축방법</h3>
                  <span className="text-xs font-medium text-gray-500">
                    {slots[index]?.name ?? '설비 미선택'}
                  </span>
                </div>
                <div className="grid gap-2 text-sm text-gray-700 md:grid-cols-3">
                  <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-sm">
                    <span className="text-xs font-medium text-gray-500">알고리즘</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {slotSettings?.algorithm || '미선택'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-sm">
                    <span className="text-xs font-medium text-gray-500">버전</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {slotSettings?.version || '미선택'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-sm">
                    <span className="text-xs font-medium text-gray-500">처리방식</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {(slotSettings?.processingMethod ?? 'cpu').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {slots.map((slotFacility, index) => (
              <PerformanceComparisonCard
                key={index}
                facility={slotFacility}
                slotIndex={index}
                onRemove={() => onRemove(index)}
                onAddTask={onAddTask}
                queueItems={queueData[index]?.queueItems}
                processingItems={queueData[index]?.processingItems}
                overallProgress={queueData[index]?.overallProgress}
                settings={settings[index]}
              />
            ))}
          </div>

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
