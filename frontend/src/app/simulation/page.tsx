'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Sidebar from '@/components/layout/sidebar';
import Navbar from '@/components/layout/navbar';
import FacilityList from './components/FacilityList';
import FacilityDetailPanel from './components/FacilityDetailPanel';
import FacilityAddModal from './components/FacilityAddModal';
import AuthGuard from '@/components/auth/AuthGuard';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import ProductionSimulator from './components/ProductionSimulator';
import TileMap, { type TileType } from './components/TileMap';
import CommonButton from '@/components/ui/CommonButton';
import { useAuthStore } from '@/store/authStore';
import { getInkjetPrinters, getInkjetPrinterDetail, getDailyProduction, getInkjetJobs, type InkjetPrinter, type InkjetPrinterDetail, type DailyProductionResponse, type InkjetJob } from '@/service/inkjet';
import { QueueItem, HistoryItem } from '@/components/ui/CommonTable';
import type { Facility } from './types';
import FacilityEditModal from './components/FacilityEditModal';
import PerformanceSimulatorContainer from './components/PerformanceSimulatorContainer';
import FacilityQueueModal from './components/FacilityQueueModal';
import FacilityComparisonModal from './components/FacilityComparisonModal';
import FacilityQueueSection from './components/FacilityQueueSection';
import FacilityHistorySection from './components/FacilityHistorySection';

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
  const [sidebarWidth, setSidebarWidth] = useState(192); // 기본값: w-48 = 192px
  const [navbarHeight, setNavbarHeight] = useState(64); // 기본값: h-16 = 64px
  const sidebarRef = useRef<HTMLDivElement>(null);
  const navbarRef = useRef<HTMLDivElement>(null);
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
  const [queueModalFacility, setQueueModalFacility] = useState<Facility | null>(null);
  const [queuedUploadsByFacility, setQueuedUploadsByFacility] = useState<Record<string, QueueItem[]>>({});
  const [queueModalSettings, setQueueModalSettings] = useState<{
    processingMethod: 'cpu' | 'gpu';
    algorithm: string;
    version: string;
  } | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [hoveredFacilityId, setHoveredFacilityId] = useState<string | null>(null);
  const [performanceComparisonSlots, setPerformanceComparisonSlots] = useState<(Facility | null)[]>([null, null]);
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
  const isLocationSelectMode = locationSelectionTarget !== null;
  const mapData: TileType[][] = Array.from({ length: 16 }, () =>
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
  const [comparisonModalFacility, setComparisonModalFacility] = useState<Facility | null>(null);
  const [comparisonModalSettings, setComparisonModalSettings] = useState<SlotSettings>({ ...DEFAULT_SLOT_SETTINGS });

  const closeFacilityAddModal = useCallback((options?: { preserveSelection?: boolean }) => {
    setIsAddModalOpen(false);
    if (!options?.preserveSelection) {
      setLocationSelectionTarget((target) => (target?.type === 'add' ? null : target));
      setPendingLocation(null);
    }
  }, []);

  const facilityLocations = useMemo(
    () =>
      facilities
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
    [facilities]
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

  const addFacilityToPerformanceSlots = useCallback((facility: Facility) => {
    if (facility.status === 'inactive') {
      return;
    }
    setPerformanceComparisonSlots((prev) => {
      if (prev.some((slot) => slot?.id === facility.id)) {
        return prev;
      }
      const next = [...prev];
      const emptyIndex = next.findIndex((slot) => slot === null);
      if (emptyIndex !== -1) {
        next[emptyIndex] = facility;
      } else {
        next[0] = facility;
      }
      return next;
    });
  }, []);

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

  const handleOpenQueueModal = useCallback((facility: Facility, settings: { processingMethod: 'cpu' | 'gpu'; algorithm: string; version: string }) => {
    setQueueModalFacility(facility);
    setQueueModalSettings({ ...settings });
  }, []);

  const handleCloseQueueModal = useCallback(() => {
    setQueueModalFacility(null);
    setQueueModalSettings(null);
  }, []);

  const handleQueueUpload = useCallback(
    (
      facility: Facility,
      payload: {
        files: File[];
        processingMethod: string;
        algorithm: string;
        version: string;
      }
    ) => {
      if (!payload.files.length) return;

      const timestamp = Date.now();
      const uploadItems: QueueItem[] = payload.files.map((file, index) => ({
        id: `upload-${facility.id}-${timestamp}-${index}`,
        fileName: file.name,
        processingMethod: payload.processingMethod.toUpperCase(),
        algorithm: payload.algorithm,
        version: payload.version,
        fileSize: file.size,
        status: '대기',
        assignedUser: '자동등록',
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

  // Sidebar 너비 측정
  useEffect(() => {
    const updateSidebarWidth = () => {
      if (sidebarRef.current) {
        const width = sidebarRef.current.offsetWidth;
        setSidebarWidth(width);
      }
    };

    // 초기 측정
    updateSidebarWidth();

    // ResizeObserver로 sidebar 크기 변화 감지
    const resizeObserver = new ResizeObserver(() => {
      updateSidebarWidth();
    });

    if (sidebarRef.current) {
      resizeObserver.observe(sidebarRef.current);
    }

    // 윈도우 리사이즈 이벤트도 감지
    window.addEventListener('resize', updateSidebarWidth);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSidebarWidth);
    };
  }, []);

  // Navbar 높이 측정
  useEffect(() => {
    const updateNavbarHeight = () => {
      if (navbarRef.current) {
        const height = navbarRef.current.offsetHeight;
        setNavbarHeight(height);
      }
    };

    // 초기 측정
    updateNavbarHeight();

    // ResizeObserver로 navbar 크기 변화 감지
    const resizeObserver = new ResizeObserver(() => {
      updateNavbarHeight();
    });

    if (navbarRef.current) {
      resizeObserver.observe(navbarRef.current);
    }

    // 윈도우 리사이즈 이벤트도 감지
    window.addEventListener('resize', updateNavbarHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateNavbarHeight);
    };
  }, []);

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

  // 상세 정보를 Facility 타입으로 변환
  const mapDetailToFacility = (detail: InkjetPrinterDetail): Facility => {
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

      while (hasNext) {
        const response = await getInkjetPrinters({
          page: pageIndex,
          size,
        });

        if (!response.isSuccess || !response.result) break;

        const { content, pagination } = response.result;

        totalElementsFromApi = pagination?.totalElements ?? totalElementsFromApi;

        content.forEach((item) => {
          if (item.printerStatus === 'OPERATIONAL') {
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
      setTotalElements(totalElementsFromApi);
    } catch (err) {
      console.error('설비 통계 조회 실패:', err);
      setFacilityStats({
        totalOperational: 0,
        totalRunning: 0,
      });
      setTotalElements(0);
    }
  };

  const fetchFacilities = async (pageToLoad = page) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getInkjetPrinters({
        page: pageToLoad,
        size: 10,
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
        setFacilities(mappedFacilities);
        setHoveredFacilityId((prev) =>
          prev && !mappedFacilities.some((item) => item.id === prev) ? null : prev
        );
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

  const handleOpenComparisonModal = useCallback(
    (facility: Facility) => {
      setComparisonModalFacility(facility);
      setComparisonModalSettings({ ...DEFAULT_SLOT_SETTINGS });
    },
    [DEFAULT_SLOT_SETTINGS]
  );

  const handleCloseComparisonModal = useCallback(() => {
    setComparisonModalFacility(null);
    setComparisonModalSettings({ ...DEFAULT_SLOT_SETTINGS });
  }, [DEFAULT_SLOT_SETTINGS]);

  const handleConfirmComparisonModal = useCallback(() => {
    if (!comparisonModalFacility) return;

    let assignedIndex = -1;

    setPerformanceComparisonSlots((prev) => {
      const next = [...prev];
      const existingIndex = next.findIndex((slot) => slot?.id === comparisonModalFacility.id);
      if (existingIndex !== -1) {
        assignedIndex = existingIndex;
        next[existingIndex] = comparisonModalFacility;
        return next;
      }
      const emptyIndex = next.findIndex((slot) => slot === null);
      assignedIndex = emptyIndex !== -1 ? emptyIndex : 0;
      next[assignedIndex] = comparisonModalFacility;
      return next;
    });

    setPerformanceSlotSettings((prev) => {
      if (assignedIndex === -1) return prev;
      const next = [...prev];
      next[assignedIndex] = { ...comparisonModalSettings };
      return next;
    });

    setComparisonModalFacility(null);
    setComparisonModalSettings({ ...DEFAULT_SLOT_SETTINGS });
  }, [comparisonModalFacility, comparisonModalSettings, DEFAULT_SLOT_SETTINGS]);

  const handleAddFacilityToPerformanceFromDetail = useCallback(
    (facility: Facility) => {
      handleOpenComparisonModal(facility);
    },
    [handleOpenComparisonModal]
  );

  const handleComparisonSettingsChange = useCallback((update: Partial<SlotSettings>) => {
    setComparisonModalSettings((prev) => ({
      ...prev,
      ...update,
    }));
  }, []);

  const availabilityRate =
    facilityStats.totalOperational > 0
      ? `${((facilityStats.totalRunning / facilityStats.totalOperational) * 100).toFixed(1)}%`
      : '0%';

  const focusPaddingBottomValue =
    selectedFacility && !locationSelectionTarget ? 320 : 120;

  return (
    <AuthGuard>
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div ref={sidebarRef}>
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Navigation Bar */}
        <div ref={navbarRef}>
          <Navbar userName="홍길동" />
        </div>

        {/* Content */}
        <main className="flex-1 px-6 py-6 overflow-y-auto">
          <div className="w-full max-w-7xl mx-auto">
            {/* 전체 설비 타이틀 및 통계 */}
            <div className="flex items-center justify-between mb-4 gap-6">
              <h1 className="text-lg font-bold text-gray-900 whitespace-nowrap">
                전체 설비
              </h1>
              <div className="flex items-center gap-4">
                {error && (
                  <div className="text-sm text-red-600">
                    {error}
                  </div>
                )}
                {isAdmin && (
                  <CommonButton
                    variant="blue"
                    className="px-4 py-2 text-sm"
                    onClick={handleAddFacilityButtonClick}
                  >
                    {isLocationSelectMode ? '취소하기' : '설비 등록'}
                  </CommonButton>
                )}
              </div>
            </div>
            
            
            {/* 로딩 상태 */}
            {isLoading && (
              <div className="flex justify-center items-center py-12">
                <div className="text-gray-500">설비 목록을 불러오는 중...</div>
              </div>
            )}

            {/* 에러 상태 */}
            {error && !isLoading && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
            
            {/* 설비 목록 */}
            {!isLoading && !error && (
            <>
            <div className="flex gap-6">
                <CommonContainerBox className="flex-1 h-[570px] overflow-hidden p-0 relative">
                  <TileMap 
                    mapData={mapData}
                    facilities={facilityLocations}
                    sidebarWidth={sidebarWidth}
                    isLocationSelectMode={isLocationSelectMode && !isFacilityEditModalOpen}
                    onLocationSelect={handleLocationSelect}
                    selectedLocation={mapSelectedLocation}
                    hoveredFacilityId={hoveredFacilityId}
                    onFacilityHoverChange={setHoveredFacilityId}
                    onFacilityClick={(facilityId) => {
                      const facility = facilities.find((item) => item.id === facilityId);
                      if (facility) {
                        handleFacilityClick(facility);
                      }
                    }}
                    onTileClick={() => {
                      if (locationSelectionTarget) {
                        return;
                      }
                      setSelectedFacility(null);
                      setDetailError(null);
                      setShowTaskSections(false);
                      setHoveredFacilityId(null);
                    }}
                    onBackgroundClick={() => {
                      if (locationSelectionTarget) {
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

                <div className="w-80 mb-6">
                <div className="h-[570px]">
                    <FacilityList
                      facilities={facilities}
                      onFacilityClick={handleFacilityClick}
                      onFacilityHover={setHoveredFacilityId}
                      currentPage={page + 1}
                      totalPages={totalPages}
                      onPageChange={handleFacilityPageChange}
                      totalCount={totalElements}
                      totalOperational={facilityStats.totalOperational}
                      totalRunning={facilityStats.totalRunning}
                      availabilityRate={availabilityRate}
                  />
                  </div>
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

            <div className="mt-10">
              <PerformanceSimulatorContainer
                slots={performanceComparisonSlots}
                onRemove={removeFacilityFromPerformanceSlot}
                onRun={(currentSlots) => {
                  console.log('성능 시뮬레이터 실행', currentSlots);
                }}
                queueData={performanceQueueData}
                settings={performanceSlotSettings}
                onSettingsChange={(index, update) => {
                  setPerformanceSlotSettings((prev) => {
                    const next = [...prev];
                    next[index] = { ...next[index], ...update };
                    return next;
                  });
                }}
                onAddTask={handleOpenQueueModal}
              />
            </div>
            <ProductionSimulator className="mt-6" />

          </div>
        </main>
      </div>

      {/* 설비 추가 모달 */}
      <FacilityAddModal
        isOpen={isAddModalOpen}
        onClose={() => closeFacilityAddModal()}
        onAdd={async (facilityData) => {
          await fetchFacilities(0);
          await fetchFacilityStats();
          closeFacilityAddModal();
        }}
        sidebarWidth={sidebarWidth}
        navbarHeight={navbarHeight}
        initialCanvasPosition={pendingLocation}
        onRequestLocationChange={handleRequestLocationChange}
      />

      <FacilityEditModal
        facility={facilityBeingEdited}
        isOpen={isFacilityEditModalOpen}
        onClose={handleCloseEditModal}
        onUpdated={handleFacilityEditUpdated}
        onRequestLocationChange={handleRequestEditLocationChange}
        draftLocation={editDraftLocation}
      />
      <FacilityQueueModal
        facility={queueModalFacility}
        isOpen={Boolean(queueModalFacility)}
        onClose={handleCloseQueueModal}
        topOffset={navbarHeight}
        onUpload={handleQueueUpload}
        settings={queueModalSettings}
      />

      <FacilityComparisonModal
        facility={comparisonModalFacility}
        isOpen={Boolean(comparisonModalFacility)}
        settings={comparisonModalSettings}
        onSettingsChange={handleComparisonSettingsChange}
        onConfirm={handleConfirmComparisonModal}
        onClose={handleCloseComparisonModal}
      />

    </div>
    </AuthGuard>
  );
}
