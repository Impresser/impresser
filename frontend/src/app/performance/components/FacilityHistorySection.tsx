'use client';

import React from 'react';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import type { FacilityHistoryItem } from '@/store/performanceHistoryStore';
import FacilityHistoryTable from './FacilityHistoryTable';

interface FacilityHistorySectionProps {
  historyItems: FacilityHistoryItem[];
  isLoadingHistory: boolean;
  historyError: string | null;
  onDownload?: (item: FacilityHistoryItem) => void;
  withContainer?: boolean;
  facilityName?: string;
}

export default function FacilityHistorySection({
  historyItems,
  isLoadingHistory,
  historyError,
  onDownload,
  withContainer = true,
  facilityName,
}: FacilityHistorySectionProps) {
  const content = (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {facilityName ? `${facilityName} 작업내역` : '작업내역'}
      </h3>

      {isLoadingHistory && (
        <div className="flex justify-center items-center py-8">
          <div className="text-gray-500">작업 내역을 불러오는 중...</div>
        </div>
      )}

      {historyError && !isLoadingHistory && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800 text-sm">{historyError}</p>
        </div>
      )}

      {!isLoadingHistory && (
        <FacilityHistoryTable
          items={historyItems}
          emptyMessage="지난 작업 내역이 없습니다."
          onDownload={onDownload}
        />
      )}
    </div>
  );

  if (!withContainer) {
    return content;
  }

  return <CommonContainerBox>{content}</CommonContainerBox>;
}

