'use client';

import React from 'react';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import CommonButton from '@/components/ui/CommonButton';
import type { Facility } from '../types';
import FacilityPerformanceComparison from './FacilityPerformanceComparison';

interface PerformanceSimulatorContainerProps {
  slots: (Facility | null)[];
  draggingFacility: Facility | null;
  dragOverIndex: number | null;
  onRemove: (index: number) => void;
  onDrop: (index: number, facility: Facility) => void;
  onDragOverSlot: (index: number | null) => void;
  onRun?: (slots: (Facility | null)[]) => void;
  onAddTask?: (facility: Facility) => void;
}

export default function PerformanceSimulatorContainer({
  slots,
  draggingFacility,
  dragOverIndex,
  onRemove,
  onDrop,
  onDragOverSlot,
  onRun,
  onAddTask,
}: PerformanceSimulatorContainerProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">성능 시뮬레이터</h2>
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
