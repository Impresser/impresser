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
import { useAuthStore } from '@/store/authStore';
import { getInkjetPrinters, getInkjetPrinterDetail, getDailyProduction, getInkjetJobs, createInkjetJob, type InkjetPrinter, type InkjetPrinterDetail, type DailyProductionResponse, type InkjetJob } from '@/service/inkjet';
import { QueueItem, HistoryItem } from '@/components/ui/CommonTable';
import type { Facility } from './types';
import EditFacilityModal from './components/EditFacilityModal';
import PerformanceSimulator from './components/PerformanceSimulator';
import FacilityQueueSection from './components/FacilityQueueSection';
import FacilityStatisticsSummary from './components/FacilityStatisticsSummary';
import FacilityHistorySection from './components/FacilityHistorySection';
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
  const [performanceHistoryData, setPerformanceHistoryData] = useState<Record<string, {
    historyItems: HistoryItem[];
    isLoadingHistory: boolean;
    historyError: string | null;
  }>>({});
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
  const isLocationSelectMode = locationSelectionTarget !== null;
  const mapData: TileType[][] = Array.from({ length: 14 }, () =>
    Array.from({ length: 25 }, () => 'g' as TileType)
  );

  type SlotSettings = { processingMethod: 'cpu' | 'gpu'; algorithm: string; version: string };
  const DEFAULT_SLOT_SETTINGS: SlotSettings = useMemo(
    () => ({ processingMethod: 'cpu', algorithm: '', version: '' }),
    []
  );
  const [performanceSlotSettings, setPerformanceSlotSettings] = useState<SlotSettings[]>(
    () => performanceComparisonSlots.map(() => ({ ...DEFAULT_SLOT_SETTINGS }))
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
      next[index] = { ...DEFAULT_SLOT_SETTINGS };
      return next;
    });
  }, [DEFAULT_SLOT_SETTINGS]);


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
            bmpVolume: fileInfo.bmpVolume,
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
          status: '대기',
          assignedUser: userName,
          startTime: null,
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

  useEffect(() => {
    setPerformanceSlotSettings((prev) => {
      const length = performanceComparisonSlots.length;
      const next = Array.from({ length }, (_, index) => {
        const existing = prev[index];
        if (!performanceComparisonSlots[index]) {
          return { ...DEFAULT_SLOT_SETTINGS };
        }
        return existing ? existing : { ...DEFAULT_SLOT_SETTINGS };
      });
      return next;
    });
  }, [performanceComparisonSlots, DEFAULT_SLOT_SETTINGS]);

  // 슬롯별 작업 내역 조회
  useEffect(() => {
    const fetchSlotHistories = async () => {
      const promises = performanceComparisonSlots.map(async (facility, index) => {
        if (!facility) return;

        try {
          setPerformanceHistoryData((prev) => ({
            ...prev,
            [facility.id]: { ...prev[facility.id], isLoadingHistory: true, historyError: null },
          }));

          const response = await getInkjetJobs(facility.id, {
            page: 0,
            size: 100,
          });

          if (response.isSuccess && response.result) {
            const mappedHistory = response.result.content.content.map(mapJobToHistoryItem);
            setPerformanceHistoryData((prev) => ({
              ...prev,
              [facility.id]: {
                historyItems: mappedHistory,
                isLoadingHistory: false,
                historyError: null,
              },
            }));
          } else {
            setPerformanceHistoryData((prev) => ({
              ...prev,
              [facility.id]: {
                ...prev[facility.id],
                isLoadingHistory: false,
                historyError: response.message || '작업 내역 조회에 실패했습니다.',
              },
            }));
          }
        } catch (err) {
          console.error(`슬롯 ${index + 1} 작업 내역 조회 실패:`, err);
          setPerformanceHistoryData((prev) => ({
            ...prev,
            [facility.id]: {
              ...prev[facility.id],
              isLoadingHistory: false,
              historyError: err instanceof Error ? err.message : '작업 내역 조회 중 오류가 발생했습니다.',
            },
          }));
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
        <main className="flex-1 px-6 py-6 overflow-y-auto">
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
                <div className="relative flex gap-6">
                  <CommonContainerBox className="flex-1 h-[570px] overflow-hidden p-0 relative">
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
                        <CommonButton
                          variant="blue"
                          className="px-4 py-2 text-sm"
                          onClick={handleAddFacilityButtonClick}
                        >
                          {isLocationSelectMode ? '취소하기' : '설비등록'}
                        </CommonButton>
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
                      <div className="absolute inset-x-0 bottom-0 z-20">
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
                      console.log('다운로드:', item.fileName);
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
                onRun={(currentSlots) => {
                  console.log('성능 시뮬레이터 실행', currentSlots);
                }}
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
                  console.log('다운로드:', item.fileName);
                }}
              />
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
