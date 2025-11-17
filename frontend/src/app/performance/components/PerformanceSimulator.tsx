'use client';

import React, { useCallback, useRef } from 'react';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import type { Facility } from '../types';
import type { QueueItem, HistoryItem } from '@/components/ui/CommonTable';
import PerformanceSimulatorSlot from './PerformanceSimulatorSlot';
import FacilityFileUpload from './FacilityFileUpload';
import FacilityQueueSection from './FacilityQueueSection';
import FacilityHistorySection from './FacilityHistorySection';
import { getCompressionTypes, getCompressionTypeVersions } from '@/service/imageCompressor';
import type { CompressionTypeItem, CompressionTypeVersionItem } from '@/types/imageCompressor';

interface PerformanceSimulatorProps {
  slots: (Facility | null)[];
  onRemove: (index: number) => void;
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
  queueData,
  historyData,
  settings,
  onSettingsChange,
  onQueueUpload,
  onDownload,
}: PerformanceSimulatorProps) {
  const hasBothSlots = slots[0] !== null && slots[1] !== null;
  const queueSectionRef = useRef<HTMLDivElement>(null);

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

  // 공통 파일 업로드 후 각 슬롯에 대기열 추가
  const handleCommonFileUpload = useCallback(async (payload: {
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
  }) => {
    if (!payload.fileInfos || payload.fileInfos.length === 0) {
      alert('파일 업로드가 완료되지 않았습니다.');
      return;
    }

    if (!hasBothSlots) {
      alert('두 슬롯 모두 설비를 선택해주세요.');
      return;
    }

    // 두 슬롯의 설정이 모두 동일한지 확인
    const slot1Settings = settings[0];
    const slot2Settings = settings[1];
    
    const isSameSettings = 
      slot1Settings.algorithm === slot2Settings.algorithm &&
      slot1Settings.version === slot2Settings.version &&
      slot1Settings.processingMethod === slot2Settings.processingMethod;

    if (isSameSettings) {
      alert('두 슬롯의 알고리즘, 버전, 처리방식이 모두 동일합니다. 성능 비교를 위해 서로 다른 설정을 선택해주세요.');
      return;
    }

    // 각 슬롯의 설정에 맞춰 compressionTypeUuid 계산 및 대기열 추가
    for (let i = 0; i < slots.length; i++) {
      const facility = slots[i];
      const slotSettings = settings[i];
      
      if (!facility || !slotSettings.algorithm || !slotSettings.version) {
        continue;
      }

      try {
        // 슬롯별 compressionTypeUuid 계산
        const algorithmOptions = await getCompressionTypes({
          processingUnit: slotSettings.processingMethod.toUpperCase(),
        });

        if (!algorithmOptions.isSuccess || !algorithmOptions.result) {
          console.error(`슬롯 ${i + 1} 알고리즘 조회 실패`);
          continue;
        }

        const selectedAlgorithm = algorithmOptions.result.find(
          (opt: CompressionTypeItem) => opt.type === slotSettings.algorithm
        );

        if (!selectedAlgorithm) {
          console.error(`슬롯 ${i + 1} 알고리즘을 찾을 수 없습니다.`);
          continue;
        }

        let compressionTypeUuid = selectedAlgorithm.compressionTypeUuid;

        // 버전 조회
        try {
          const versionResponse = await getCompressionTypeVersions({
            compressionTypeUuid: compressionTypeUuid,
          });

          if (versionResponse.isSuccess && versionResponse.result) {
            const selectedVersion = versionResponse.result.find(
              (item: CompressionTypeVersionItem) => item.version.toString() === slotSettings.version
            );

            if (selectedVersion) {
              compressionTypeUuid = selectedVersion.compressionTypeUuid;
            }
          }
        } catch (error) {
          console.warn(`슬롯 ${i + 1} 버전 정보 조회 실패:`, error);
        }

        // 슬롯별 fileInfos 생성 (같은 imageUrl, 다른 compressionTypeUuid)
        const slotFileInfos = payload.fileInfos.map((fileInfo) => ({
          ...fileInfo,
          compressionTypeUuid: compressionTypeUuid,
          algorithm: slotSettings.algorithm,
          version: slotSettings.version,
          processingMethod: slotSettings.processingMethod,
        }));

        // 각 슬롯에 대기열 추가
        if (onQueueUpload) {
          await onQueueUpload(facility, {
            files: payload.files,
            processingMethod: slotSettings.processingMethod.toUpperCase(),
            algorithm: slotSettings.algorithm,
            version: slotSettings.version,
            fileInfos: slotFileInfos,
          });
        }
      } catch (error) {
        console.error(`슬롯 ${i + 1} 대기열 추가 실패:`, error);
        alert(`슬롯 ${i + 1} 대기열 추가 중 오류가 발생했습니다.`);
        return; // 오류 발생 시 스크롤하지 않음
      }
    }

    // 모든 슬롯에 성공적으로 추가된 경우 작업대기열로 스크롤
    setTimeout(() => {
      queueSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, [slots, settings, hasBothSlots, onQueueUpload]);

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
            onCardClick={() => handleCardClick(1)}
            onDownload={onDownload}
          />

          {/* 공통 파일 업로드 영역 */}
          {hasBothSlots && (
            <div className="border-t border-gray-200 pt-6">
              <FacilityFileUpload
                settings={{
                  processingMethod: 'cpu', // 임시값, 실제로는 사용 안 함
                  algorithm: '',
                  version: '',
                }}
                onSubmit={handleCommonFileUpload}
                submitLabel="압축시작"
                skipAlgorithmCheck={true}
              />
            </div>
          )}

          {/* 각 설비별 작업 대기열 */}
          {hasBothSlots && (
            <div className="space-y-6 border-t border-gray-200 pt-6" ref={queueSectionRef}>
              {/* 슬롯 1의 작업 대기열 */}
              {slots[0] && (
                <FacilityQueueSection
                  queueItems={queueData[0]?.queueItems || []}
                  processingItems={queueData[0]?.processingItems || []}
                  overallProgress={queueData[0]?.overallProgress || 0}
                  isLoading={false}
                  withContainer={true}
                  showTitle={true}
                  facilityName={slots[0].name}
                />
              )}

              {/* 슬롯 2의 작업 대기열 */}
              {slots[1] && (
                <FacilityQueueSection
                  queueItems={queueData[1]?.queueItems || []}
                  processingItems={queueData[1]?.processingItems || []}
                  overallProgress={queueData[1]?.overallProgress || 0}
                  isLoading={false}
                  withContainer={true}
                  showTitle={true}
                  facilityName={slots[1].name}
                />
              )}
            </div>
          )}
        </div>
      </CommonContainerBox>
    </section>
  );
}

