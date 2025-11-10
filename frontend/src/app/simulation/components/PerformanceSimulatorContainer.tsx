'use client';

import React from 'react';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import type { Facility } from '../types';
import FacilityPerformanceComparison from './FacilityPerformanceComparison';
import PerformanceSimulatorSettings from './PerformanceSimulatorSettings';
import CommonButton from '@/components/ui/CommonButton';
import type { QueueItem } from '@/components/ui/CommonTable';

interface PerformanceSimulatorContainerProps {
  slots: (Facility | null)[];
  draggingFacility: Facility | null;
  dragOverIndex: number | null;
  onRemove: (index: number) => void;
  onDrop: (index: number, facility: Facility) => void;
  onDragOverSlot: (index: number | null) => void;
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
  draggingFacility,
  dragOverIndex,
  onRemove,
  onDrop,
  onDragOverSlot,
  onRun,
  queueData,
  settings,
  onSettingsChange,
  onAddTask,
}: PerformanceSimulatorContainerProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">알고리즘 성능 비교</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {settings.map((slotSettings, index) => (
          <PerformanceSimulatorSettings
            key={`settings-${index}`}
            slotIndex={index}
            settings={slotSettings}
            onSettingsChange={(update) => onSettingsChange(index, update)}
          />
        ))}
      </div>
      <CommonContainerBox>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {slots.map((slotFacility, index) => (
            <FacilityPerformanceComparison
              key={index}
              facility={slotFacility}
              slotIndex={index}
              isDragOver={dragOverIndex === index}
              onRemove={() => onRemove(index)}
              onDrop={(facility) => onDrop(index, facility)}
              draggingFacility={draggingFacility}
              onDragOverChange={(isOver) => onDragOverSlot(isOver ? index : null)}
              onAddTask={onAddTask}
              queueItems={queueData[index]?.queueItems}
              processingItems={queueData[index]?.processingItems}
              overallProgress={queueData[index]?.overallProgress}
              settings={settings[index]}
            />
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <CommonButton
            variant="blue"
            className="px-4 py-2 text-sm"
            onClick={() => onRun?.(slots)}
          >
            실행
          </CommonButton>
        </div>
      </CommonContainerBox>
    </section>
  );
}
