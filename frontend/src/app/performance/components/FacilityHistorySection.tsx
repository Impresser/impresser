'use client';

import React from 'react';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import type { HistoryItem } from '@/components/ui/CommonTable';
import FacilityHistoryTable from './FacilityHistoryTable';

interface FacilityHistorySectionProps {
  historyItems: HistoryItem[];
  isLoadingHistory: boolean;
  historyError: string | null;
  onDownload?: (item: HistoryItem) => void;
  withContainer?: boolean;
}

export default function FacilityHistorySection({
  historyItems,
  isLoadingHistory,
  historyError,
  onDownload,
  withContainer = true,
}: FacilityHistorySectionProps) {
  const content = (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">작업내역</h3>

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

