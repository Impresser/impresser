'use client';

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/layout/sidebar';
import Navbar from '@/components/layout/navbar';
import IsometricMap from './components/IsometricMap';
import FacilityList from './components/FacilityList';
import FacilityStatistics from './components/FacilityStatistics';
import FacilityDetailPanel from './components/FacilityDetailPanel';
import AddFacilityModal from './components/AddFacilityModal';
import AuthGuard from '@/components/auth/AuthGuard';
import { useAuthStore } from '@/store/authStore';
import { getInkjetPrinters, getInkjetPrinterDetail, getDailyProduction, type InkjetPrinter, type InkjetPrinterDetail, type DailyProductionResponse } from '@/service/inkjet';
import type { TileType } from './components/IsometricMap';
import type { Facility } from './components/FacilityStatistics';

export default function SimulationPage() {
  const [sidebarWidth, setSidebarWidth] = useState(192); // 기본값: w-48 = 192px
  const [navbarHeight, setNavbarHeight] = useState(64); // 기본값: h-16 = 64px
  const sidebarRef = useRef<HTMLDivElement>(null);
  const navbarRef = useRef<HTMLDivElement>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLocationSelectMode, setIsLocationSelectMode] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ x: number; y: number } | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  
  // 사용자 역할 확인
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.userRole === 'ADMIN';
  
  // 설비 데이터 상태
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  
  // 일일 패널 생산량 상태
  const [dailyProduction, setDailyProduction] = useState<DailyProductionResponse | null>(null);
  const [isLoadingProduction, setIsLoadingProduction] = useState(false);
  const [productionError, setProductionError] = useState<string | null>(null);

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

  // 20x20 맵 데이터 생성
  const mapData: TileType[][] = Array(20).fill(null).map(() => 
    Array(20).fill('g' as TileType)
  );

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
    };
  };

  // 설비 상세 조회
  const handleFacilityClick = async (facility: Facility) => {
    try {
      setIsLoadingDetail(true);
      setDetailError(null);
      
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
  const fetchFacilities = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getInkjetPrinters({
        page: 0,
        size: 100, // 모든 설비를 가져오기 위해 큰 값 설정
      });

      if (response.isSuccess && response.result) {
        const mappedFacilities = response.result.content.map(mapInkjetToFacility);
        setFacilities(mappedFacilities);
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

  // 일일 패널 생산량 조회
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

  useEffect(() => {
    fetchFacilities();
    fetchDailyProduction();
  }, []);

  // 맵에 표시할 설비 위치 데이터
  const facilityLocations: Array<{ id: string; canvasX: number; canvasY: number; imagePath: string }> = [];

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
            {/* 설비 시뮬레이션 타이틀 및 통계 */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">잉크젯 프린트 공정</h1>
              <div className="flex items-center gap-6">
                {!isLoading && !error && <FacilityStatistics facilities={facilities} />}
                {/* 일일 패널 생산량 */}
                {!isLoadingProduction && dailyProduction && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">일일 패널 생산량:</span>
                    <span className="text-sm font-semibold text-blue-600">{dailyProduction.totalSheetCount}장</span>
                    <span className="text-xs text-gray-500">({dailyProduction.completedDate})</span>
                  </div>
                )}
                {productionError && (
                  <div className="text-xs text-red-600">
                    {productionError}
                  </div>
                )}
                {error && (
                  <div className="text-sm text-red-600">
                    {error}
                  </div>
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
            
            {/* 맵과 설비 목록 레이아웃 */}
            {!isLoading && !error && (
              <div className="flex gap-6">
                {/* 맵 섹션 */}
                <div className="flex-1 mb-6">
                  <div className="w-full h-[600px] border border-gray-300 rounded-lg overflow-hidden">
                    <IsometricMap 
                      mapData={mapData}
                      facilities={facilityLocations}
                      sidebarWidth={sidebarWidth}
                      isLocationSelectMode={isLocationSelectMode}
                      onLocationSelect={(x, y) => {
                        setSelectedLocation({ x, y });
                        setIsLocationSelectMode(false);
                        setIsAddModalOpen(true);
                      }}
                      onAddFacilityClick={() => setIsAddModalOpen(true)}
                      selectedLocation={selectedLocation}
                      showManagementButton={isAdmin}
                    />
                  </div>
                </div>

                {/* 설비 목록 섹션 */}
                <div className="w-72 mb-6">
                  <div className="h-[600px]">
                    <FacilityList 
                      facilities={facilities}
                      onFacilityClick={handleFacilityClick}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 설비 상세 정보 패널 */}
            {selectedFacility && (
              <FacilityDetailPanel
                facility={selectedFacility}
                onClose={() => {
                  setSelectedFacility(null);
                  setDetailError(null);
                }}
                onDelete={async (facilityId: string) => {
                  // 삭제 후 목록 새로고침
                  await fetchFacilities();
                }}
                isLoading={isLoadingDetail}
                error={detailError}
                isAdmin={isAdmin}
              />
            )}
          </div>
        </main>
      </div>

      {/* 설비 추가 모달 */}
      <AddFacilityModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedLocation(null);
        }}
        onAdd={async (facilityData) => {
          // 설비 추가 성공 후 목록 새로고침
          await fetchFacilities();
          setIsAddModalOpen(false);
          setSelectedLocation(null);
        }}
        sidebarWidth={sidebarWidth}
        navbarHeight={navbarHeight}
        selectedPosition={selectedLocation}
        onSelectPosition={() => {
          setIsAddModalOpen(false);
          setIsLocationSelectMode(true);
        }}
      />
    </div>
    </AuthGuard>
  );
}
