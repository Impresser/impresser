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

  // 21x21 맵 데이터 생성
  const mapData: TileType[][] = Array(21).fill(null).map(() => 
    Array(21).fill('g' as TileType)
  );

  // 설비 데이터
  const facilities: Facility[] = [
    { 
      id: '1', 
      name: '프린터 A', 
      type: 'Inkjet', 
      status: 'active',
      modelName: 'Inkjet Pro X1',
      processingStatus: 'processing',
      cpu: 'Intel Core i7-12700',
      gpu: 'NVIDIA RTX 3060',
      ram: '32GB',
      vram: '12GB',
      installDate: new Date('2024-01-15'),
    },
    { 
      id: '2', 
      name: '프린터 B', 
      type: 'Inkjet', 
      status: 'active',
      modelName: 'Inkjet Pro X2',
      processingStatus: 'idle',
      cpu: 'Intel Core i7-12700',
      gpu: 'NVIDIA RTX 3070',
      ram: '64GB',
      vram: '16GB',
      installDate: new Date('2024-02-20'),
    },
    { 
      id: '3', 
      name: '프린터 C', 
      type: 'Inkjet', 
      status: 'inactive',
      modelName: 'Inkjet Standard',
      processingStatus: 'idle',
      cpu: 'Intel Core i5-12400',
      gpu: 'NVIDIA GTX 1660',
      ram: '16GB',
      vram: '6GB',
      installDate: new Date('2023-11-10'),
    },
    { 
      id: '4', 
      name: '프린터 D', 
      type: 'Inkjet', 
      status: 'maintenance',
      modelName: 'Inkjet Pro X1',
      processingStatus: 'idle',
      cpu: 'Intel Core i7-12700',
      gpu: 'NVIDIA RTX 3060',
      ram: '32GB',
      vram: '12GB',
      installDate: new Date('2024-01-15'),
    },
    { 
      id: '5', 
      name: '프린터 E', 
      type: 'Inkjet', 
      status: 'active',
      modelName: 'Inkjet Pro X3',
      processingStatus: 'processing',
      cpu: 'Intel Core i9-12900',
      gpu: 'NVIDIA RTX 4080',
      ram: '64GB',
      vram: '16GB',
      installDate: new Date('2024-03-05'),
    },
  ];

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
              <FacilityStatistics facilities={facilities} />
            </div>
            
            {/* 맵과 설비 목록 레이아웃 */}
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
                  />
                </div>
              </div>

              {/* 설비 목록 섹션 */}
              <div className="w-48 mb-6">
                <div className="h-[600px]">
                  <FacilityList 
                    facilities={facilities}
                    onFacilityClick={(facility) => setSelectedFacility(facility)}
                  />
                </div>
              </div>
            </div>

            {/* 설비 상세 정보 패널 */}
            {selectedFacility && (
              <FacilityDetailPanel
                facility={selectedFacility}
                onClose={() => setSelectedFacility(null)}
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
        onAdd={(facilityData) => {
          console.log('설비 추가:', facilityData);
          // 여기에 실제 설비 추가 로직 구현
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
