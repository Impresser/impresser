'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSidebarStore } from '@/store/sidebarStore';

// 아이콘 컴포넌트들 (추후 실제 아이콘으로 교체 예정)
const HomeIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 22V12H15V22"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PatternIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 2L2 7L12 12L22 7L12 2Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2 17L12 22L22 17"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2 12L12 17L22 12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CompressIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8 3H5C4.46957 3 3.96086 3.21071 3.58579 3.58579C3.21071 3.96086 3 4.46957 3 5V8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V16"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 21H19C19.5304 21 20.0391 20.7893 20.4142 20.4142C20.7893 20.0391 21 19.5304 21 19V16"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SimulationIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PerformanceIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4 20V12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 20V6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 20V10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M22 20V4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface MenuItem {
  id: string;
  name: string;
  path: string;
  icon: React.ComponentType;
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    name: '대시보드',
    path: '/dashboard',
    icon: HomeIcon,
  },
  {
    id: 'pattern-generator',
    name: '패턴 생성',
    path: '/imagegenerator',
    icon: PatternIcon,
  },
  {
    id: 'pattern-compress',
    name: '패턴 압축',
    path: '/imagecompressor',
    icon: CompressIcon,
  },
  {
    id: 'performance',
    name: '성능 비교',
    path: '/performance',
    icon: PerformanceIcon,
  },
  {
    id: 'simulation',
    name: '생산 시뮬레이션',
    path: '/simulation',
    icon: SimulationIcon,
  },
];

export default function Sidebar() {
  const { isCollapsed, setIsCollapsed, toggleCollapsed } = useSidebarStore();
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();

  // 화면 크기에 따른 사이드바 상태 관리 (초기 로드 시에만)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        // lg 브레이크포인트 미만일 때는 자동으로 접기
        setIsCollapsed(true);
      }
      // 화면이 커져도 사용자가 접어놓은 상태는 유지 (자동으로 펼치지 않음)
    };

    // 초기 로드 시에만 화면 크기 확인
    if (window.innerWidth < 1024) {
      setIsCollapsed(true);
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsCollapsed]);

  // 실제 표시 여부: 접혀있을 때 호버하면 펼쳐짐
  const isExpanded = isCollapsed ? isHovered : true;

  return (
    <div
      className={`bg-white shadow-lg transition-all duration-300 ease-in-out h-screen flex flex-col ${
        isExpanded ? 'w-48' : 'w-16'
      } ${isCollapsed && isHovered ? 'z-50 shadow-xl' : 'z-10'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 브랜드 로고 및 이름 */}
      <Link href="/dashboard" className="flex items-center h-16 px-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors">
        <div className="flex items-center space-x-2">
          <img
            src="/images/logos/impresser_logo_icon01.png"
            alt="Impresser Brand Icon"
            className="w-8 h-8 object-contain"
          />
          <img
            src="/images/logos/impresser_logo_text01.png"
            alt="Impresser"
            className={`h-6 object-contain transition-all duration-300 ${
              isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'
            }`}
          />
        </div>
      </Link>

      {/* 메뉴 아이템들 */}
      <nav className="flex-1 mt-4">
        {menuItems.map(item => {
          const IconComponent = item.icon;
          const isActive = pathname === item.path;

          return (
            <a
              key={item.id}
              href={item.path}
              className={`flex items-center px-4 py-3 mx-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-[#0059FF]/15 text-[#0059FF] font-bold'
                  : 'text-[#8E8E8E] hover:bg-gray-50'
              }`}
            >
              <div
                className={`flex items-center ${isExpanded ? '' : 'justify-center w-full'}`}
              >
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                  <IconComponent />
                </div>
                <span 
                  className={`text-sm whitespace-nowrap transition-all duration-300 ${
                    isExpanded ? 'opacity-100 w-auto ml-3' : 'opacity-0 w-0 overflow-hidden ml-0'
                  }`}
                >
                  {item.name}
                </span>
              </div>
            </a>
          );
        })}
      </nav>

      {/* 토글 버튼 (데스크톱에서 수동 토글용) */}
      <div 
        className="p-4 border-t border-gray-100"
        onMouseEnter={(e) => {
          e.stopPropagation();
          setIsHovered(false);
        }}
        onMouseLeave={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="flex justify-center">
          <button
            onClick={toggleCollapsed}
            className="w-8 h-8 bg-gray-100 border border-gray-200 rounded-full shadow-sm flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`transition-transform duration-200 ${!isCollapsed ? 'rotate-180' : ''}`}
            >
              <path
                d="M9 18L15 12L9 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
