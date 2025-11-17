'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Sidebar from '@/components/layout/sidebar';
import Navbar from '@/components/layout/navbar';
import FacilityDetailPanel from './components/FacilityDetailPanel';
import AddFacilityModal from './components/AddFacilityModal';
import AuthGuard from '@/components/auth/AuthGuard';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import TileMap, { type TileType } from './components/TileMap';
import CommonButton from '@/components/ui/CommonButton';
import { useToast } from '@/components/ui/CommonToast';
import { useAuthStore } from '@/store/authStore';
import { usePerformanceHistoryStore } from '@/store/performanceHistoryStore';
import { getInkjetPrinters, getInkjetPrinterDetail, getDailyProduction, getInkjetJobs, createInkjetJob, subscribeInkjetCompressionSSE, type InkjetPrinter, type InkjetPrinterDetail, type DailyProductionResponse, type InkjetJob, type ConvertHistoryItemResponse } from '@/service/inkjet';
import { QueueItem, HistoryItem } from '@/components/ui/CommonTable';
import type { Facility } from './types';
import EditFacilityModal from './components/EditFacilityModal';
import PerformanceSimulator from './components/PerformanceSimulator';
import FacilityQueueSection from './components/FacilityQueueSection';
import FacilityStatisticsSummary from './components/FacilityStatisticsSummary';
import FacilityHistorySection from './components/FacilityHistorySection';
import PerformanceResultComparisonTable, { type ResultComparisonItem } from './components/PerformanceResultComparisonTable';
import PerformanceResultSummary from './components/PerformanceResultSummary';
import NewFacilityList from './components/NewFacilityList';
import SelectedFacilitiesPanel from './components/SelectedFacilitiesPanel';

const getQueueItems = (facilityId: string): QueueItem[] => {
  const queueData: Record<string, QueueItem[]> = {
    '1': [
      {
        id: '1-1',
        fileName: 'image001.bmp',
        processingMethod: 'CPU',
        algorithm: 'LZW (Lempel-Ziv-Welch)',
        version: '1.0',
        fileSize: 1048576,
        status: '진행',
        assignedUser: '홍길동',
        startTime: new Date(Date.now() - 120000),
        elapsedTime: 120,
        estimatedTime: 300,
        progress: 40,
      },
      {
        id: '1-2',
        fileName: 'image002.bmp',
        processingMethod: 'GPU',
        algorithm: 'Huffman Coding',
        version: '2.0',
        fileSize: 2097152,
        status: '대기',
        assignedUser: '홍길동',
        startTime: null,
        elapsedTime: 0,
        estimatedTime: 0,
        progress: 0,
      },
    ],
    '2': [
      {
        id: '2-1',
        fileName: 'image005.bmp',
        processingMethod: 'GPU',
        algorithm: 'Arithmetic Coding',
        version: '3.0',
        fileSize: 3145728,
        status: '대기',
        assignedUser: '홍길동',
        startTime: null,
        elapsedTime: 0,
        estimatedTime: 0,
        progress: 0,
      },
    ],
    '5': [
      {
        id: '5-1',
        fileName: 'image006.bmp',
        processingMethod: 'GPU',
        algorithm: 'LZW (Lempel-Ziv-Welch)',
        version: '2.0',
        fileSize: 5242880,
        status: '진행',
        assignedUser: '홍길동',
        startTime: new Date(Date.now() - 60000),
        elapsedTime: 60,
        estimatedTime: 600,
        progress: 10,
      },
      {
        id: '5-2',
        fileName: 'image007.bmp',
        processingMethod: 'GPU',
        algorithm: 'RLE (Run-Length Encoding)',
        version: '1.0',
        fileSize: 2097152,
        status: '진행',
        assignedUser: '홍길동',
        startTime: new Date(Date.now() - 180000),
        elapsedTime: 180,
        estimatedTime: 240,
        progress: 75,
      },
    ],
  };

  return queueData[facilityId] || [];
};

const mapJobToHistoryItem = (job: InkjetJob): HistoryItem => {
  const fileName = job.tiffImageUrl.split('/').pop() || job.tiffImageUrl;
  const requestedTime = new Date(job.requestedAt).getTime();
  const completedTime = new Date(job.completedAt).getTime();
  const duration = Math.floor((completedTime - requestedTime) / 1000);

  return {
    id: job.jobUuid,
    fileName,
    processingMethod: '-',
    algorithm: '-',
    version: '-',
    fileSize: 0,
    status: '완료',
    assignedUser: '-',
    completedTime: new Date(job.completedAt),
    duration,
  };
};

export default function SimulationPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [locationSelectionTarget, setLocationSelectionTarget] = useState<{ type: 'add' | 'edit'; facilityId?: string } | null>(null);
  const [pendingLocation, setPendingLocation] = useState<{ x: number; y: number } | null>(null);
  const [facilityBeingEdited, setFacilityBeingEdited] = useState<Facility | null>(null);
  const [isFacilityEditModalOpen, setIsFacilityEditModalOpen] = useState(false);
  const [editDraftLocation, setEditDraftLocation] = useState<{ x: number; y: number } | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [showTaskSections, setShowTaskSections] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const performanceHistoryData = usePerformanceHistoryStore((state) => state.performanceHistoryData);
  const updateHistoryData = usePerformanceHistoryStore((state) => state.updateHistoryData);
  const addCompressionComplete = usePerformanceHistoryStore((state) => state.addCompressionComplete);
  const [queuedUploadsByFacility, setQueuedUploadsByFacility] = useState<Record<string, QueueItem[]>>({});
  const [allFacilities, setAllFacilities] = useState<Facility[]>([]);
  const [paginatedFacilities, setPaginatedFacilities] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [hoveredFacilityId, setHoveredFacilityId] = useState<string | null>(null);
  const [performanceComparisonSlots, setPerformanceComparisonSlots] = useState<(Facility | null)[]>([null, null]);
  const performanceComparisonSectionRef = useRef<HTMLDivElement>(null);
  const resultComparisonSectionRef = useRef<HTMLDivElement>(null);
  const sseSubscribedRef = useRef(false);
  const processedHistoryUuidsRef = useRef<Set<string>>(new Set());
  const toastShownRef = useRef<Set<string>>(new Set()); // 토스트 알림 중복 방지
  const sseControllerRef = useRef<AbortController | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isLoadingProduction, setIsLoadingProduction] = useState(false);
  const [productionError, setProductionError] = useState<string | null>(null);
  const [dailyProduction, setDailyProduction] = useState<DailyProductionResponse | null>(null);
  const isAdmin = useAuthStore((state) => state.user?.userRole === 'ADMIN') ?? false;
  const [facilityStats, setFacilityStats] = useState({
    totalOperational: 0,
    totalRunning: 0,
  });
  const [isPerformanceComparisonMode, setIsPerformanceComparisonMode] = useState(false);
  const { showToast } = useToast();
  
  // ref를 최신 값으로 참조하기 위한 ref들
  const addCompressionCompleteRef = useRef(addCompressionComplete);
  const showToastRef = useRef(showToast);
  const performanceComparisonSlotsRef = useRef(performanceComparisonSlots);

  // ref를 최신 값으로 업데이트
  useEffect(() => {
    addCompressionCompleteRef.current = addCompressionComplete;
    showToastRef.current = showToast;
    performanceComparisonSlotsRef.current = performanceComparisonSlots;
  }, [addCompressionComplete, showToast, performanceComparisonSlots]);
  
  const isLocationSelectMode = locationSelectionTarget !== null;
  const mapData: TileType[][] = Array.from({ length: 14 }, () =>
    Array.from({ length: 25 }, () => 'g' as TileType)
  );

  type SlotSettings = { processingMethod: 'cpu' | 'gpu'; algorithm: string; version: string };
  const DEFAULT_SLOT_SETTINGS: SlotSettings = useMemo(
    () => ({ processingMethod: 'cpu', algorithm: '', version: '' }),
    []
  );
  const getDefaultSlotSettings = useCallback((index: number): SlotSettings => {
    if (index === 1) {
      // 슬롯 2: 알고리즘과 버전은 그대로 유지, 처리방식만 GPU로 변경
      return { processingMethod: 'gpu', algorithm: '', version: '' };
    }
    // 슬롯 1: 현재 그대로 유지
    return { ...DEFAULT_SLOT_SETTINGS };
  }, [DEFAULT_SLOT_SETTINGS]);
  const [performanceSlotSettings, setPerformanceSlotSettings] = useState<SlotSettings[]>(
    () => performanceComparisonSlots.map((_, index) => getDefaultSlotSettings(index))
  );

  const closeFacilityAddModal = useCallback((options?: { preserveSelection?: boolean }) => {
    setIsAddModalOpen(false);
    if (!options?.preserveSelection) {
      setLocationSelectionTarget((target) => (target?.type === 'add' ? null : target));
      setPendingLocation(null);
    }
  }, []);

  const facilityLocations = useMemo(
    () =>
      allFacilities
        .filter(
          (facility): facility is Facility & { canvasX: number; canvasY: number } =>
            typeof facility.canvasX === 'number' && typeof facility.canvasY === 'number'
        )
        .map((facility) => ({
          id: facility.id,
          name: facility.name,
          canvasX: facility.canvasX,
          canvasY: facility.canvasY,
          imagePath: '/images/facilities/topview02-1.png',
          status: facility.status,
          processStatus: facility.processStatus,
        })),
    [allFacilities]
  );

  const queueItems = useMemo(
    () => (selectedFacility ? getQueueItems(selectedFacility.id) : []),
    [selectedFacility?.id]
  );

  const processingItems = useMemo(
    () => queueItems.filter((item) => item.status === '진행'),
    [queueItems]
  );

  const overallProgress = useMemo(() => {
    if (processingItems.length === 0) return 0;
    const totalProgress = processingItems.reduce((sum, item) => sum + item.progress, 0);
    return Math.round(totalProgress / processingItems.length);
  }, [processingItems]);

  const mapSelectedLocation = useMemo(() => {
    if (locationSelectionTarget?.type === 'add') {
      return pendingLocation;
    }
    if (locationSelectionTarget?.type === 'edit') {
      return editDraftLocation;
    }
    return pendingLocation ?? editDraftLocation;
  }, [locationSelectionTarget, pendingLocation, editDraftLocation]);

  // 상세 정보를 Facility 타입으로 변환
  const mapDetailToFacility = useCallback((detail: InkjetPrinterDetail): Facility => {
    // printerStatus 매핑: BROKEN -> inactive (고장), UNDER_REPAIR -> maintenance (수리 중), OPERATIONAL -> active (정상)
    let status: 'active' | 'inactive' | 'maintenance' = 'inactive';
    if (detail.printerStatus === 'BROKEN') {
      status = 'inactive'; // 고장
    } else if (detail.printerStatus === 'UNDER_REPAIR') {
      status = 'maintenance'; // 수리 중
    } else if (detail.printerStatus === 'OPERATIONAL') {
      status = 'active'; // 정상
    }

    return {
      id: detail.inkjetUuid,
      name: detail.printerName,
      type: 'Inkjet',
      status,
      modelName: detail.modelName,
      processStatus: detail.processStatus as 'WAITING' | 'RUNNING',
      cpu: detail.cpu,
      gpu: detail.gpu,
      ram: detail.ram,
      vram: detail.vram,
      installDate: detail.installDate,
      canvasX: detail.canvasX,
      canvasY: detail.canvasY,
    };
  }, []);

  const addFacilityToPerformanceSlots = useCallback(async (facility: Facility) => {
    if (facility.status === 'inactive') {
      return;
    }
    
    // 설비 상세 정보 조회하여 CPU, GPU, RAM, VRAM 정보 포함
    let facilityWithDetails = facility;
    try {
      const response = await getInkjetPrinterDetail(facility.id);
      if (response.isSuccess && response.result) {
        facilityWithDetails = mapDetailToFacility(response.result);
      } else {
        // API 응답은 성공했지만 isSuccess가 false인 경우
        console.warn('설비 상세 조회 응답 실패 (성능 비교 추가):', response.message);
      }
    } catch (err) {
      // API 호출 자체가 실패한 경우 (네트워크 오류, 서버 오류 등)
      // 기본 정보로 진행하되, 에러를 조용히 처리
      if (err instanceof Error) {
        // 서버 내부 오류(500) 등은 조용히 처리
        if (err.message.includes('500') || err.message.includes('서버 내부')) {
          console.warn('설비 상세 조회 중 서버 오류 발생, 기본 정보로 진행:', facility.name);
        } else {
          console.warn('설비 상세 조회 실패 (성능 비교 추가):', err.message);
        }
      } else {
        console.warn('설비 상세 조회 실패 (성능 비교 추가):', err);
      }
      // 에러가 있어도 기본 정보로 진행
    }
    
    setPerformanceComparisonSlots((prev) => {
      const existingIndex = prev.findIndex((slot) => slot?.id === facilityWithDetails.id);
      if (existingIndex !== -1) {
        // 이미 선택된 설비를 클릭하면 선택 취소
        const next = [...prev];
        next[existingIndex] = null;
        return next;
      }
      const next = [...prev];
      const emptyIndex = next.findIndex((slot) => slot === null);
      if (emptyIndex !== -1) {
        next[emptyIndex] = facilityWithDetails;
      } else {
        next[0] = facilityWithDetails;
      }
      return next;
    });
  }, [mapDetailToFacility]);

  const removeFacilityFromPerformanceSlot = useCallback((index: number) => {
    setPerformanceComparisonSlots((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
    setPerformanceSlotSettings((prev) => {
      const next = [...prev];
      next[index] = getDefaultSlotSettings(index);
      return next;
    });
  }, [getDefaultSlotSettings]);


  const handleQueueUpload = useCallback(
    async (
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
    ) => {
      if (!payload.files.length) return;

      // fileInfos가 없으면 API 호출 불가
      if (!payload.fileInfos || payload.fileInfos.length === 0) {
        console.error('파일 상세 정보가 없어 대기열 등록을 할 수 없습니다.');
        alert('파일 업로드가 완료되지 않았습니다. 잠시 후 다시 시도해주세요.');
        return;
      }

      try {
        // 잉크젯 설비 대기열 등록 API 호출
        const response = await createInkjetJob(facility.id, {
          createConvertRequests: payload.fileInfos.map((fileInfo) => ({
            bmpUrl: fileInfo.imageUrl,
            compressionTypeUuid: fileInfo.compressionTypeUuid,
             // API 계약: bmpVolume 단위는 KB. 현재 fileInfo.bmpVolume은 Bytes이므로 KB로 변환
             bmpVolume: Math.round((fileInfo.bmpVolume ?? 0) / 1024),
            bmpWidth: fileInfo.bmpWidth,
            bmpHeight: fileInfo.bmpHeight,
          })),
        });

        if (!response.isSuccess) {
          throw new Error(response.message || '대기열 등록에 실패했습니다.');
        }

        // 성공 시 로컬 대기열에도 추가 (UI 업데이트용)
        const userName = useAuthStore.getState().user?.userName ?? '사용자';
        const timestamp = Date.now();
        const uploadItems: QueueItem[] = payload.files.map((file, index) => ({
          id: `upload-${facility.id}-${timestamp}-${index}`,
          fileName: file.name,
          processingMethod: payload.processingMethod.toUpperCase(),
          algorithm: payload.algorithm,
          version: payload.version,
          fileSize: file.size,
           status: '진행',
          assignedUser: userName,
           startTime: new Date(),
          elapsedTime: 0,
          estimatedTime: 0,
          progress: 0,
        }));

        setQueuedUploadsByFacility((prev) => {
          const existing = prev[facility.id] ?? [];
          return {
            ...prev,
            [facility.id]: [...uploadItems, ...existing],
          };
        });

         // 토스트 알림
         showToast(`${facility.name}에 ${uploadItems.length}건 대기열 등록됨 (진행)`);
      } catch (err) {
        console.error('잉크젯 설비 대기열 등록 실패:', err);
        alert(err instanceof Error ? err.message : '대기열 등록 중 오류가 발생했습니다.');
      }
    },
    []
  );

  const performanceQueueData = useMemo(
    () =>
      performanceComparisonSlots.map((facility) => {
        if (!facility) {
          return { queueItems: [] as QueueItem[], processingItems: [] as QueueItem[], overallProgress: 0 };
        }

        const baseQueueItems = getQueueItems(facility.id);
        const uploadedItems = queuedUploadsByFacility[facility.id] ?? [];
        const queueItems = [...uploadedItems, ...baseQueueItems];
        const processingItems = queueItems.filter((item) => item.status === '진행');
        const overallProgress = processingItems.length
          ? Math.round(processingItems.reduce((sum, item) => sum + item.progress, 0) / processingItems.length)
          : 0;

        return { queueItems, processingItems, overallProgress };
      }),
    [performanceComparisonSlots, queuedUploadsByFacility]
  );

  // 슬롯별 작업 내역 데이터
  const performanceHistoryDataArray = useMemo(
    () =>
      performanceComparisonSlots.map((facility) => {
        if (!facility) {
          return { historyItems: [] as HistoryItem[], isLoadingHistory: false, historyError: null };
        }
        return performanceHistoryData[facility.id] || { historyItems: [], isLoadingHistory: false, historyError: null };
      }),
    [performanceComparisonSlots, performanceHistoryData]
  );

  // 결과 비교용 단일 테이블 데이터
  const resultComparisonItems = useMemo<ResultComparisonItem[]>(() => {
    const idToName = new Map<string, string>();
    performanceComparisonSlots.forEach((f) => {
      if (f) idToName.set(f.id, f.name);
    });
    const items: ResultComparisonItem[] = [];
    Object.entries(performanceHistoryData).forEach(([facilityId, data]) => {
      const facilityName = idToName.get(facilityId) ?? facilityId;
      data.historyItems.forEach((it) => {
        items.push({
          facilityId,
          facilityName,
          fileName: it.fileName,
          processingMethod: it.processingMethod,
          algorithm: it.algorithm,
          version: it.version,
          fileSizeBytes: it.fileSize,
           compressionRatio: (it as any).compressionRatio,
          compressionTime: (it as any).compressionTime,
          elapsedTime: it.duration,
          completedTime: it.completedTime,
          tiffUrl: it.tiffUrl,
        });
      });
    });
    items.sort((a, b) => b.completedTime.getTime() - a.completedTime.getTime());
    return items;
  }, [performanceComparisonSlots, performanceHistoryData]);

  useEffect(() => {
    setPerformanceSlotSettings((prev) => {
      const length = performanceComparisonSlots.length;
      const next = Array.from({ length }, (_, index) => {
        const existing = prev[index];
        if (!performanceComparisonSlots[index]) {
          // 슬롯이 비어있으면 기본 설정으로 초기화
          return getDefaultSlotSettings(index);
        }
        // 슬롯에 설비가 있고 기존 설정이 있으면 유지, 없으면 기본 설정 사용
        return existing ? existing : getDefaultSlotSettings(index);
      });
      return next;
    });
  }, [performanceComparisonSlots, getDefaultSlotSettings]);

  // 설비 대기열 압축 완료 SSE 구독
  useEffect(() => {
    // 이미 구독된 경우 기존 연결 종료 후 재구독 (React Strict Mode에서 두 번 실행되는 것 방지)
    if (sseSubscribedRef.current) {
      console.log('SSE 이미 구독 중 - 재구독 방지');
      return;
    }
    
    // 기존 SSE 연결이 있으면 종료
    if (sseControllerRef.current) {
      console.log('기존 SSE 연결 종료');
      sseControllerRef.current.abort();
      sseControllerRef.current = null;
    }
    
    console.log('SSE 구독 시작');
    sseSubscribedRef.current = true;

    const sseController = subscribeInkjetCompressionSSE({
      onCompressionComplete: (data: ConvertHistoryItemResponse) => {
        const historyUuid = data.convertHistoryUuid;
        console.log('[SSE] 설비 대기열 압축 완료 이벤트 수신:', {
          historyUuid,
          tiffName: data.tiffName,
          timestamp: new Date().toISOString(),
        });

        // 이미 처리된 항목인지 확인 (중복 실행 방지) - 최우선 체크
        if (processedHistoryUuidsRef.current.has(historyUuid)) {
          console.log('[SSE] 이미 처리된 압축 완료 이벤트 (중복 무시):', historyUuid);
          return;
        }
        
        // 처리 시작 표시 (즉시 추가하여 중복 실행 방지)
        processedHistoryUuidsRef.current.add(historyUuid);
        console.log('[SSE] 처리 시작 표시:', historyUuid);

        // 파일명 매칭: BMP 파일명 → TIFF 파일명 변환
        const matchFileName = (bmpFileName: string, tiffName: string): boolean => {
          // BMP 파일명에서 확장자를 .tiff로 변경
          const expectedTiffName = bmpFileName.replace(/\.bmp$/i, '.tiff');
          return tiffName === expectedTiffName;
        };

        // 상태 업데이트 전에 현재 상태를 읽어서 매칭 항목 찾기
          let matchedItem: QueueItem | null = null;
          let matchedFacilityId: string | null = null;

        // 현재 상태에서 매칭 항목 찾기 (동기적으로)
        setQueuedUploadsByFacility((prev) => {
          // 매칭 항목 찾기
          for (const [facilityId, queueItems] of Object.entries(prev)) {
            const matched = queueItems.find((item) => {
              // 파일명 매칭
              const fileNameMatch = matchFileName(item.fileName, data.tiffName);
              // bmpVolume 단위 차이 보정: item.fileSize(bytes) → KB 반올림 후 비교
              const volumeMatch = Math.round((item.fileSize ?? 0) / 1024) === (data.bmpVolume ?? -1);
              return fileNameMatch && volumeMatch;
            });

            if (matched && !matchedItem) {
              matchedItem = { ...matched }; // 복사본 저장
              matchedFacilityId = facilityId;
            }
          }

          // 매칭된 항목이 있으면 대기열에서 제거한 새 상태 반환
          if (matchedItem && matchedFacilityId) {
            return {
              ...prev,
              [matchedFacilityId]: prev[matchedFacilityId].filter(
              (item) => item.id !== matchedItem!.id
              ),
            };
          }

          // 매칭되지 않으면 기존 상태 반환
          return prev;
        });

        // 상태 업데이트 후 사이드 이펙트 실행 (한 번만 실행)
        if (matchedItem !== null && matchedFacilityId !== null) {
          // 타입 단언
          const item = matchedItem as QueueItem;
          const facilityId = matchedFacilityId as string;

            // 작업 내역에 추가 (Zustand store 사용)
          addCompressionCompleteRef.current(facilityId, data, {
            fileName: item.fileName,
            algorithm: item.algorithm,
            version: item.version,
            });

            console.log('설비 대기열 항목 완료 처리:', {
            facilityId: facilityId,
            fileName: item.fileName,
              convertHistoryUuid: data.convertHistoryUuid,
            });

          // 완료 토스트 알림 (중복 방지)
          const toastKey = `${historyUuid}-${data.tiffName}`;
          if (!toastShownRef.current.has(toastKey)) {
            toastShownRef.current.add(toastKey);
            console.log('[SSE] 토스트 알림 표시:', toastKey);
            
            try {
              const facilityName =
                performanceComparisonSlotsRef.current.find((f) => f && f.id === facilityId)?.name ||
                facilityId ||
                '설비';
              const timeText =
                typeof (data as any).compressionTime === 'number'
                  ? `${(data as any).compressionTime.toFixed(2)}초`
                  : `${data.elapsedTime}초`;
              showToastRef.current(`${facilityName} 압축 완료: ${data.tiffName} (${timeText})`);
              // 결과 비교 섹션으로 자동 스크롤
              setTimeout(() => {
                resultComparisonSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 100);
              
              // 10초 후 토스트 키 제거 (메모리 관리)
              setTimeout(() => {
                toastShownRef.current.delete(toastKey);
              }, 10000);
            } catch (err) {
              console.error('[SSE] 토스트 알림 오류:', err);
              toastShownRef.current.delete(toastKey);
            }
          } else {
            console.log('[SSE] 토스트 알림 중복 방지:', toastKey);
          }
        } else {
          // 매칭 항목이 없으면 처리 표시 제거 (다시 처리 가능하도록)
          processedHistoryUuidsRef.current.delete(historyUuid);
            console.warn('압축 완료 이벤트에 매칭되는 대기열 항목을 찾을 수 없습니다:', {
              tiffName: data.tiffName,
              bmpVolume: data.bmpVolume,
            });
          }
      },
      onError: (error: Error) => {
        console.error('설비 대기열 SSE 연결 오류:', error);
      },
    });

    // SSE 컨트롤러 저장
    sseControllerRef.current = sseController;

    // 컴포넌트 언마운트 시 SSE 연결 종료
    return () => {
      console.log('SSE 구독 정리');
      sseSubscribedRef.current = false;
      if (sseControllerRef.current) {
        sseControllerRef.current.abort();
        sseControllerRef.current = null;
      }
    };
  }, []); // dependency array를 빈 배열로 유지하여 한 번만 구독

  // 슬롯별 작업 내역 조회
  useEffect(() => {
    const fetchSlotHistories = async () => {
      const promises = performanceComparisonSlots.map(async (facility, index) => {
        if (!facility) return;

        try {
          updateHistoryData(facility.id, { isLoadingHistory: true, historyError: null });

          const response = await getInkjetJobs(facility.id, {
            page: 0,
            size: 100,
          });

          if (response.isSuccess && response.result) {
            const mappedHistory = response.result.content.content.map(mapJobToHistoryItem);
            updateHistoryData(facility.id, {
              historyItems: mappedHistory,
              isLoadingHistory: false,
              historyError: null,
            });
          } else {
            updateHistoryData(facility.id, {
              isLoadingHistory: false,
              historyError: response.message || '작업 내역 조회에 실패했습니다.',
            });
          }
        } catch (err) {
          console.error(`슬롯 ${index + 1} 작업 내역 조회 실패:`, err);
          updateHistoryData(facility.id, {
            isLoadingHistory: false,
            historyError: err instanceof Error ? err.message : '작업 내역 조회 중 오류가 발생했습니다.',
          });
        }
      });

      await Promise.all(promises);
    };

    fetchSlotHistories();
  }, [performanceComparisonSlots]);

  useEffect(() => {
    if (!selectedFacility) {
      setShowTaskSections(false);
      setHistoryItems([]);
      setHistoryError(null);
      setIsLoadingHistory(false);
      return;
    }

    setShowTaskSections(false);

    const fetchHistory = async () => {
      try {
        setIsLoadingHistory(true);
        setHistoryError(null);

        const response = await getInkjetJobs(selectedFacility.id, {
          page: 0,
          size: 100,
        });

        if (response.isSuccess && response.result) {
          const mappedHistory = response.result.content.content.map(mapJobToHistoryItem);
          setHistoryItems(mappedHistory);
        } else {
          setHistoryError(response.message || '작업 내역 조회에 실패했습니다.');
          setHistoryItems([]);
        }
      } catch (err) {
        console.error('작업 내역 조회 실패:', err);
        setHistoryError(err instanceof Error ? err.message : '작업 내역 조회 중 오류가 발생했습니다.');
        setHistoryItems([]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [selectedFacility?.id]);


  // API 응답을 Facility 타입으로 변환 (목록 조회용)
  const mapInkjetToFacility = (inkjet: InkjetPrinter): Facility => {
    // printerStatus 매핑: BROKEN -> inactive (고장), UNDER_REPAIR -> maintenance (수리 중), OPERATIONAL -> active (정상)
    let status: 'active' | 'inactive' | 'maintenance' = 'inactive';
    if (inkjet.printerStatus === 'BROKEN') {
      status = 'inactive'; // 고장
    } else if (inkjet.printerStatus === 'UNDER_REPAIR') {
      status = 'maintenance'; // 수리 중
    } else if (inkjet.printerStatus === 'OPERATIONAL') {
      status = 'active'; // 정상
    }

    return {
      id: inkjet.inkjetUuid,
      name: inkjet.printerName,
      type: 'Inkjet',
      status,
      modelName: inkjet.modelName,
      processStatus: inkjet.processStatus as 'WAITING' | 'RUNNING',
      installDate: inkjet.installDate,
      canvasX: inkjet.canvasX,
      canvasY: inkjet.canvasY,
    };
  };

  // 설비 상세 조회
  const handleFacilityClick = async (facility: Facility) => {
    try {
      setIsLoadingDetail(true);
      setDetailError(null);
      setHoveredFacilityId(facility.id);
      
      const response = await getInkjetPrinterDetail(facility.id);
      
      if (response.isSuccess && response.result) {
        const facilityDetail = mapDetailToFacility(response.result);
        setSelectedFacility(facilityDetail);
      } else {
        setDetailError(response.message || '설비 상세 조회에 실패했습니다.');
        // 에러가 있어도 기본 정보는 표시
        setSelectedFacility(facility);
      }
    } catch (err) {
      console.error('설비 상세 조회 실패:', err);
      setDetailError(err instanceof Error ? err.message : '설비 상세 조회 중 오류가 발생했습니다.');
      // 에러가 있어도 기본 정보는 표시
      setSelectedFacility(facility);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // 설비 목록 조회
  const fetchDailyProduction = async () => {
    try {
      setIsLoadingProduction(true);
      setProductionError(null);

      const response = await getDailyProduction();

      if (response.isSuccess && response.result) {
        setDailyProduction(response.result);
      } else {
        setProductionError(response.message || '일일 패널 생산량 조회에 실패했습니다.');
      }
    } catch (err) {
      console.error('일일 패널 생산량 조회 실패:', err);
      setProductionError(err instanceof Error ? err.message : '일일 패널 생산량 조회 중 오류가 발생했습니다.');
    } finally {
      setIsLoadingProduction(false);
    }
  };

  const fetchFacilityStats = async () => {
    try {
      const size = 100;
      let pageIndex = 0;
      let totalOperational = 0;
      let totalRunning = 0;
      let totalElementsFromApi = 0;
      let hasNext = true;
      const aggregatedFacilities: Facility[] = [];

      while (hasNext) {
        const response = await getInkjetPrinters({
          page: pageIndex,
          size,
        });

        if (!response.isSuccess || !response.result) break;

        const { content, pagination } = response.result;

        totalElementsFromApi = pagination?.totalElements ?? totalElementsFromApi;

        const mappedFacilities = content.map(mapInkjetToFacility);
        aggregatedFacilities.push(...mappedFacilities);

        mappedFacilities.forEach((item) => {
          if (item.status === 'active') {
            totalOperational += 1;
            if (item.processStatus === 'RUNNING') {
              totalRunning += 1;
            }
          }
        });

        if (pagination?.last || !(pagination?.hasNext)) {
          hasNext = false;
        } else {
          pageIndex += 1;
        }
      }

      setFacilityStats({
        totalOperational,
        totalRunning,
      });
      setAllFacilities(aggregatedFacilities);
      setHoveredFacilityId((prev) =>
        prev && !aggregatedFacilities.some((item) => item.id === prev) ? null : prev
      );
      setTotalElements(totalElementsFromApi);
    } catch (err) {
      console.error('설비 통계 조회 실패:', err);
      setFacilityStats({
        totalOperational: 0,
        totalRunning: 0,
      });
      setAllFacilities([]);
      setHoveredFacilityId(null);
      setTotalElements(0);
    }
  };

  const fetchFacilities = async (pageToLoad = page) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getInkjetPrinters({
        page: pageToLoad,
        size: 7,
      });

      if (response.isSuccess && response.result) {
        const mappedFacilities = response.result.content.map(mapInkjetToFacility);

        mappedFacilities.sort((a, b) => {
          const rank = (facility: Facility) => {
            const isRunning = facility.processStatus === 'RUNNING';
            const isBroken = facility.status === 'inactive';
            const isUnderRepair = facility.status === 'maintenance';

            if (isRunning) return 0;
            if (isBroken) return 3;
            if (isUnderRepair) return 2;
            return 1;
          };

          const rankDiff = rank(a) - rank(b);
          if (rankDiff !== 0) return rankDiff;
          return a.name.localeCompare(b.name);
        });
        setPaginatedFacilities(mappedFacilities);
        setTotalPages(response.result.pagination?.totalPages ?? 1);
        setPage(response.result.pagination?.page ?? pageToLoad);
      } else {
        setError(response.message || '설비 목록 조회에 실패했습니다.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '설비 목록 조회 중 오류가 발생했습니다.');
      console.error('설비 목록 조회 실패:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities(0);
    fetchFacilityStats();
    fetchDailyProduction();
  }, []);


  const handleFacilityPageChange = (nextPage: number) => {
    const zeroBased = nextPage - 1;
    setPage(zeroBased);
    fetchFacilities(zeroBased);
  };

  const handleAddFacilityButtonClick = () => {
    if (locationSelectionTarget?.type === 'add') {
      setLocationSelectionTarget(null);
      setHoveredFacilityId(null);
    } else {
      setHoveredFacilityId(null);
      setSelectedFacility(null);
      setDetailError(null);
      setLocationSelectionTarget({ type: 'add' });
    }
  };

  const handleLocationSelect = (x: number, y: number) => {
    if (!locationSelectionTarget) return;

    if (locationSelectionTarget.type === 'add') {
      setPendingLocation({ x, y });
      setLocationSelectionTarget(null);
      setHoveredFacilityId(null);
      setIsAddModalOpen(true);
    } else if (locationSelectionTarget.type === 'edit') {
      setEditDraftLocation({ x, y });
      setLocationSelectionTarget(null);
      setHoveredFacilityId(null);
      setIsFacilityEditModalOpen(true);
    }
  };

  const handleRequestLocationChange = () => {
    closeFacilityAddModal({ preserveSelection: true });
    setLocationSelectionTarget({ type: 'add' });
    setHoveredFacilityId(null);
  };

  const handleOpenEditModal = (facility: Facility) => {
    setFacilityBeingEdited(facility);
    if (facility.canvasX !== undefined && facility.canvasY !== undefined) {
      setEditDraftLocation({ x: facility.canvasX, y: facility.canvasY });
    } else {
      setEditDraftLocation(null);
    }
    setIsFacilityEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsFacilityEditModalOpen(false);
    setFacilityBeingEdited(null);
    setEditDraftLocation(null);
    setLocationSelectionTarget((target) => (target?.type === 'edit' ? null : target));
  };

  const handleRequestEditLocationChange = () => {
    if (!facilityBeingEdited) return;
    setIsFacilityEditModalOpen(false);
    setLocationSelectionTarget({ type: 'edit', facilityId: facilityBeingEdited.id });
    setHoveredFacilityId(null);
  };

  const handleFacilityEditUpdated = async () => {
    await fetchFacilities();
    await fetchFacilityStats();
    if (facilityBeingEdited) {
      await handleFacilityClick(facilityBeingEdited);
    }
    handleCloseEditModal();
  };

  const handleAddFacilityToPerformanceFromDetail = useCallback(
    async (facility: Facility) => {
      await addFacilityToPerformanceSlots(facility);
    },
    [addFacilityToPerformanceSlots]
  );

  const availabilityRate =
    facilityStats.totalOperational > 0
      ? `${((facilityStats.totalRunning / facilityStats.totalOperational) * 100).toFixed(1)}%`
      : '0%';

  const focusPaddingBottomValue =
    selectedFacility && !locationSelectionTarget ? 320 : 120;

  return (
    <AuthGuard>
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 px-6 py-6 overflow-y-auto overflow-x-hidden">
          <div className="w-full max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4 gap-6">
              <h1 className="text-xl font-bold text-gray-900 whitespace-nowrap">
                설비 선택
              </h1>
              {error && (
                <div className="text-sm text-red-600">
                  {error}
                </div>
              )}
            </div>
            
            
            {error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            ) : (
              <>
                <div className="relative flex gap-6 min-w-0">
                  <CommonContainerBox className="flex-1 h-[570px] overflow-hidden p-0 relative min-w-0">
                    <div className="absolute left-4 top-4 z-20">
                      <CommonContainerBox className="bg-white/95 shadow !px-4 !py-4">
                        <FacilityStatisticsSummary
                          total={totalElements}
                          operational={facilityStats.totalOperational}
                          running={facilityStats.totalRunning}
                          availabilityRate={availabilityRate}
                        />
                      </CommonContainerBox>
                    </div>
                    <div className="absolute right-4 top-4 z-20">
                      {isPerformanceComparisonMode ? (
                        <CommonButton
                          variant="gray"
                          className="px-4 py-2 text-sm"
                          onClick={() => {
                            setIsPerformanceComparisonMode(false);
                          }}
                        >
                          취소
                        </CommonButton>
                      ) : (
                        <CommonButton
                          variant="blue"
                          className="px-4 py-2 text-sm"
                          onClick={() => {
                            setIsPerformanceComparisonMode(true);
                            // 성능비교 모드로 전환 시 상세정보 패널 닫기
                            setSelectedFacility(null);
                            setDetailError(null);
                            setShowTaskSections(false);
                          }}
                        >
                          성능비교
                        </CommonButton>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="absolute right-4 bottom-4 z-20">
                        <div className="relative group">
                        <CommonButton
                          variant="blue"
                            className="px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={handleAddFacilityButtonClick}
                            disabled={allFacilities.length >= 10 || isLocationSelectMode}
                        >
                          {isLocationSelectMode ? '취소하기' : '설비등록'}
                        </CommonButton>
                          {allFacilities.length >= 10 && !isLocationSelectMode && (
                            <div className="absolute right-0 bottom-full mb-2 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-30 shadow-lg">
                              <div className="absolute right-4 top-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-gray-900"></div>
                              <div>
                                현재 공장에서는<br />
                                최대 10개까지 등록 가능합니다.
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    <TileMap
                      mapData={mapData}
                      facilities={facilityLocations}
                      isLocationSelectMode={isLocationSelectMode && !isFacilityEditModalOpen}
                      onLocationSelect={handleLocationSelect}
                      selectedLocation={mapSelectedLocation}
                      hoveredFacilityId={hoveredFacilityId}
                      onFacilityHoverChange={setHoveredFacilityId}
                      isPerformanceComparisonMode={isPerformanceComparisonMode}
                      selectedFacilityIds={performanceComparisonSlots.filter((slot) => slot !== null).map((slot) => slot!.id)}
                      onFacilityClick={async (facilityId) => {
                        const facility = allFacilities.find((item) => item.id === facilityId);
                        if (facility) {
                          if (isPerformanceComparisonMode) {
                            // 성능비교 모드일 때는 슬롯에 추가
                            await addFacilityToPerformanceSlots(facility);
                          } else {
                            // 일반 모드일 때는 상세 정보 표시
                            handleFacilityClick(facility);
                          }
                        }
                      }}
                      onTileClick={() => {
                        if (locationSelectionTarget || isPerformanceComparisonMode) {
                          return;
                        }
                        setSelectedFacility(null);
                        setDetailError(null);
                        setShowTaskSections(false);
                        setHoveredFacilityId(null);
                      }}
                      onBackgroundClick={() => {
                        if (locationSelectionTarget || isPerformanceComparisonMode) {
                          return;
                        }
                        setSelectedFacility(null);
                        setDetailError(null);
                        setShowTaskSections(false);
                        setHoveredFacilityId(null);
                      }}
                      selectedFacilityId={selectedFacility?.id ?? null}
                      focusFacility={
                        selectedFacility?.canvasX !== undefined && selectedFacility?.canvasY !== undefined
                          ? { x: selectedFacility.canvasX, y: selectedFacility.canvasY }
                          : null
                      }
                      focusPaddingBottom={focusPaddingBottomValue}
                      focusPaddingTop={48}
                    />
                    {selectedFacility && !locationSelectionTarget && (
                      <div className="absolute inset-x-0 bottom-0 z-20 w-full overflow-x-hidden">
                        <FacilityDetailPanel
                          facility={selectedFacility}
                          onClose={() => {
                            setSelectedFacility(null);
                            setDetailError(null);
                            setShowTaskSections(false);
                          }}
                          onDelete={async (facilityId: string) => {
                            await fetchFacilities();
                            await fetchFacilityStats();
                          }}
                          isLoading={isLoadingDetail}
                          error={detailError}
                          isAdmin={isAdmin}
                          showTaskSections={showTaskSections}
                          onToggleTaskSections={() => setShowTaskSections((prev) => !prev)}
                          onOpenEditModal={handleOpenEditModal}
                          onAddToPerformanceComparison={handleAddFacilityToPerformanceFromDetail}
                        />
                      </div>
                    )}
                  </CommonContainerBox>

                  <div className="w-80 h-[570px] mb-6 relative">
                    {isPerformanceComparisonMode ? (
                      <SelectedFacilitiesPanel
                        selectedFacilities={performanceComparisonSlots}
                        onConfirm={() => {
                          const selectedCount = performanceComparisonSlots.filter((slot) => slot !== null).length;
                          if (selectedCount === 2) {
                            setIsPerformanceComparisonMode(false);
                            // 알고리즘 성능 비교 섹션으로 스크롤
                            setTimeout(() => {
                              performanceComparisonSectionRef.current?.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start',
                              });
                            }, 100);
                          }
                        }}
                      />
                    ) : (
                      <NewFacilityList />
                    )}
                  </div>
                </div>
              </>
            )}

            {selectedFacility && showTaskSections && (
              <CommonContainerBox className="mt-1">
                <div className="space-y-6">
                  <FacilityQueueSection
                    queueItems={queueItems}
                    processingItems={processingItems}
                    overallProgress={overallProgress}
                    isLoading={false}
                    withContainer={false}
                  />
                  <FacilityHistorySection
                    historyItems={historyItems}
                    isLoadingHistory={isLoadingHistory}
                    historyError={historyError}
                    onDownload={(item) => {
                      if (item.tiffUrl) {
                        window.open(item.tiffUrl, '_blank', 'noopener,noreferrer');
                      } else {
                        alert('다운로드 URL이 없습니다.');
                      }
                    }}
                    withContainer={false}
                  />
              </div>
              </CommonContainerBox>
            )}

            <div className="mt-10" ref={performanceComparisonSectionRef}>
              <PerformanceSimulator
                slots={performanceComparisonSlots}
                onRemove={removeFacilityFromPerformanceSlot}
                queueData={performanceQueueData}
                historyData={performanceHistoryDataArray}
                settings={performanceSlotSettings}
                onSettingsChange={(index, update) => {
                  setPerformanceSlotSettings((prev) => {
                    const next = [...prev];
                    next[index] = { ...next[index], ...update };
                    return next;
                  });
                }}
                onQueueUpload={handleQueueUpload}
                onDownload={(item) => {
                  if (item.tiffUrl) {
                    window.open(item.tiffUrl, '_blank', 'noopener,noreferrer');
                  } else {
                    alert('다운로드 URL이 없습니다.');
                  }
                }}
              />
              <div ref={resultComparisonSectionRef}>
                <PerformanceResultComparisonTable items={resultComparisonItems} />
                <PerformanceResultSummary items={resultComparisonItems} />
              </div>
            </div>


          </div>
        </main>
      </div>

      {/* 설비 추가 모달 */}
      <AddFacilityModal
        isOpen={isAddModalOpen}
        onClose={() => closeFacilityAddModal()}
        onAdd={async (facilityData) => {
          await fetchFacilities(0);
          await fetchFacilityStats();
          closeFacilityAddModal();
        }}
        initialCanvasPosition={pendingLocation}
        onRequestLocationChange={handleRequestLocationChange}
      />

      <EditFacilityModal
        facility={facilityBeingEdited}
        isOpen={isFacilityEditModalOpen}
        onClose={handleCloseEditModal}
        onUpdated={handleFacilityEditUpdated}
        onRequestLocationChange={handleRequestEditLocationChange}
        draftLocation={editDraftLocation}
      />


    </div>
    </AuthGuard>
  );
}
