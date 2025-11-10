'use client';

import React, { useState } from 'react';
import type { Facility } from '../types';
import type { QueueItem, HistoryItem } from '@/components/ui/CommonTable';
import { deleteInkjetPrinter } from '@/service/inkjet';
import FacilityInfoSection from './FacilityInfoSection';

interface FacilityDetailPanelProps {
  facility: Facility | null;
  onClose: () => void;
  onDelete?: (facilityId: string) => void;
  isLoading?: boolean;
  error?: string | null;
  isAdmin?: boolean;
  className?: string;
  showTaskSections: boolean;
  onToggleTaskSections: () => void;
  onOpenEditModal?: (facility: Facility) => void;
  onAddToPerformanceComparison?: (facility: Facility) => void;
  onDragStartPerformance?: (facility: Facility) => void;
  onDragEndPerformance?: () => void;
  queueItems: QueueItem[];
  processingItems: QueueItem[];
  overallProgress: number;
  historyItems: HistoryItem[];
  isLoadingHistory: boolean;
  historyError: string | null;
  onHistoryDownload?: (item: HistoryItem) => void;
}

export default function FacilityDetailPanel({
  facility,
  onClose,
  onDelete,
  isLoading = false,
  error = null,
  isAdmin = false,
  className = '',
  showTaskSections,
  onToggleTaskSections,
  onOpenEditModal,
  onAddToPerformanceComparison,
  onDragStartPerformance,
  onDragEndPerformance,
  queueItems,
  processingItems,
  overallProgress,
  historyItems,
  isLoadingHistory,
  historyError,
  onHistoryDownload,
}: FacilityDetailPanelProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!facility) return null;

  const handleDelete = async () => {
    if (!confirm(`정말로 "${facility.name}" 설비를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      setIsDeleting(true);
      setDeleteError(null);
      
      await deleteInkjetPrinter(facility.id);
      
      // 삭제 성공 시 부모 컴포넌트에 알림
      onDelete?.(facility.id);
      onClose();
    } catch (err) {
      console.error('설비 삭제 실패:', err);
      setDeleteError(err instanceof Error ? err.message : '설비 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: Facility['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Facility['status']) => {
    switch (status) {
      case 'active':
        return '정상';
      case 'inactive':
        return '고장';
      case 'maintenance':
        return '점검';
      default:
        return '알 수 없음';
    }
  };

  const getProcessingStatusColor = (status?: Facility['processStatus']) => {
    switch (status) {
      case 'WAITING':
        return 'bg-gray-100 text-gray-800';
      case 'RUNNING':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProcessingStatusText = (status?: Facility['processStatus']) => {
    switch (status) {
      case 'WAITING':
        return '대기';
      case 'RUNNING':
        return '진행';
      default:
        return '알 수 없음';
    }
  };

  const formatDate = (date?: Date | string): string => {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const statusBadgeClass = getStatusColor(facility.status);
  const statusLabel = getStatusText(facility.status);
  const processBadgeClass = getProcessingStatusColor(facility.processStatus);
  const processLabel = getProcessingStatusText(facility.processStatus);
  const formattedInstallDate = formatDate(facility.installDate);

  return (
    <div className={className}>
      <FacilityInfoSection
        facility={facility}
        isAdmin={isAdmin}
        isLoading={isLoading}
        error={error}
        deleteError={deleteError}
        statusBadgeClass={statusBadgeClass}
        statusLabel={statusLabel}
        processBadgeClass={processBadgeClass}
        processLabel={processLabel}
        formattedInstallDate={formattedInstallDate}
        isDeleting={isDeleting}
        onClose={onClose}
        onDelete={handleDelete}
        onOpenEditModal={() => onOpenEditModal?.(facility)}
        onAddToPerformanceComparison={() => onAddToPerformanceComparison?.(facility)}
        onDragStartPerformance={() => onDragStartPerformance?.(facility)}
        onDragEndPerformance={() => onDragEndPerformance?.()}
        onToggleTaskSections={onToggleTaskSections}
        isTaskSectionVisible={showTaskSections}
        queueItems={queueItems}
        processingItems={processingItems}
        overallProgress={overallProgress}
        historyItems={historyItems}
        isLoadingHistory={isLoadingHistory}
        historyError={historyError}
        onHistoryDownload={onHistoryDownload}
      />
    </div>
  );
}

