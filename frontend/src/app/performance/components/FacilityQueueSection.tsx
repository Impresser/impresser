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
  facilityName?: string;
}

export default function FacilityQueueSection({
  queueItems,
  processingItems,
  overallProgress,
  isLoading,
  withContainer = true,
  showTitle = true,
  facilityName,
}: FacilityQueueSectionProps) {
  if (isLoading) return null;

  const content = (
    <div>
      {showTitle && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {facilityName ? `${facilityName} 작업대기열` : '작업대기열'}
        </h3>
      )}

      <FacilityQueueTable items={queueItems} />
    </div>
  );

  if (!withContainer) {
    return content;
  }

  return <CommonContainerBox>{content}</CommonContainerBox>;
}

