'use client';

import Sidebar from '@/components/layout/sidebar';
import Navbar from '@/components/layout/navbar';
import AuthGuard from '@/components/auth/AuthGuard';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import React, { useRef, useState, useEffect } from 'react';

export default function SimulationAlgorithmPage() {
  const [sidebarWidth, setSidebarWidth] = useState(192);
  const [navbarHeight, setNavbarHeight] = useState(64);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const navbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateSidebarWidth = () => {
      if (sidebarRef.current) {
        setSidebarWidth(sidebarRef.current.offsetWidth);
      }
    };

    updateSidebarWidth();

    const resizeObserver = new ResizeObserver(updateSidebarWidth);
    if (sidebarRef.current) {
      resizeObserver.observe(sidebarRef.current);
    }

    window.addEventListener('resize', updateSidebarWidth);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSidebarWidth);
    };
  }, []);

  useEffect(() => {
    const updateNavbarHeight = () => {
      if (navbarRef.current) {
        setNavbarHeight(navbarRef.current.offsetHeight);
      }
    };

    updateNavbarHeight();

    const resizeObserver = new ResizeObserver(updateNavbarHeight);
    if (navbarRef.current) {
      resizeObserver.observe(navbarRef.current);
    }

    window.addEventListener('resize', updateNavbarHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateNavbarHeight);
    };
  }, []);

  return (
    <AuthGuard>
      <div className="flex h-screen bg-gray-50">
        <div ref={sidebarRef}>
          <Sidebar />
        </div>
        <div className="flex-1 flex flex-col">
          <div ref={navbarRef}>
            <Navbar userName="홍길동" />
          </div>
          <main className="flex-1 px-6 py-6 overflow-y-auto">
            <div className="w-full max-w-5xl mx-auto">
              <CommonContainerBox className="p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">시뮬레이션 알고리즘</h1>
                <p className="text-gray-600">
                  알고리즘 기반 시뮬레이션 페이지입니다. 필요한 데이터와 UI 구성이 확정되는 대로 이곳에 구현할 예정입니다.
                </p>
                <p className="text-gray-500 mt-6">
                  현재는 구조 분리를 위한 기본 레이아웃만 구성되어 있습니다. 요구 사항이 정리되면 상세 내용을 추가해주세요.
                </p>
              </CommonContainerBox>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}

