'use client';

import React from 'react';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import type { QueueItem } from '@/components/ui/CommonTable';
import FacilityQueueTable from './FacilityQueueTable';

interface FacilityQueueSectionProps {
  queueItems: QueueItem[];
  processingItems: QueueItem[];
  overallProgress: number;
  isLoading: boolean;
  withContainer?: boolean;
  showTitle?: boolean;
}

export default function FacilityQueueSection({
  queueItems,
  processingItems,
  overallProgress,
  isLoading,
  withContainer = true,
  showTitle = true,
}: FacilityQueueSectionProps) {
  if (isLoading) return null;

  const content = (
    <div>
      {showTitle && <h3 className="text-lg font-semibold text-gray-900 mb-4">작업대기열</h3>}

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

      <FacilityQueueTable items={queueItems} />
    </div>
  );

  if (!withContainer) {
    return content;
  }

  return <CommonContainerBox>{content}</CommonContainerBox>;
}

