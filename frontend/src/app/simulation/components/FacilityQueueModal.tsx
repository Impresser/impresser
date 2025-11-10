import React from 'react';
import CommonModal from '@/components/ui/CommonModal';
import FacilityQueueSection from './FacilityQueueSection';
import type { Facility } from '../types';
import type { QueueItem } from '@/components/ui/CommonTable';
import FacilityJobUpload from './FacilityJobUpload';

interface FacilityQueueModalProps {
  facility: Facility | null;
  queueItems: QueueItem[];
  processingItems: QueueItem[];
  overallProgress: number;
  isOpen: boolean;
  onClose: () => void;
  topOffset?: number;
  onUpload?: (
    facility: Facility,
    payload: {
      files: File[];
      processingMethod: string;
      algorithm: string;
      version: string;
    }
  ) => void;
}

export default function FacilityQueueModal({
  facility,
  queueItems,
  processingItems,
  overallProgress,
  isOpen,
  onClose,
  topOffset,
  onUpload,
}: FacilityQueueModalProps) {
  return (
    <CommonModal isOpen={isOpen} onClose={onClose} className="w-full max-w-3xl" topOffset={topOffset}>
      {facility && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">{facility.name} 작업대기열</h3>
            <button
              type="button"
              aria-label="작업대기열 닫기"
              className="rounded-full p-2 text-gray-400 transition-colors hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              onClick={onClose}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <FacilityJobUpload
            facility={facility}
            onSubmit={(payload) => {
              onUpload?.(facility, payload);
            }}
          />
          <FacilityQueueSection
            queueItems={queueItems}
            processingItems={processingItems}
            overallProgress={overallProgress}
            isLoading={false}
            withContainer={false}
            showTitle={false}
          />
        </div>
      )}
    </CommonModal>
  );
}
