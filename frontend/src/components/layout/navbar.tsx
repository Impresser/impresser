'use client';

import React, { useState } from 'react';

// 로그아웃 아이콘
const LogoutIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 17L21 12L16 7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M21 12H9"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// 사용자 프로필 아이콘
const UserIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx="12"
      cy="7"
      r="4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface NavbarProps {
  userName?: string;
  userProfile?: string;
}

export default function Navbar({
  userName = '사용자',
  userProfile,
}: NavbarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    // 로그아웃 로직 구현
    console.log('로그아웃');
    setShowUserMenu(false);
  };

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-6">
      {/* 좌측 빈 공간 (사이드바와 균형 맞추기) */}
      <div className="flex-1"></div>

      {/* 우측 사용자 정보 */}
      <div className="flex items-center space-x-3 relative">
        {/* 사용자 이름 */}
        <span className="text-gray-700 font-medium text-sm">{userName} 님</span>

        {/* 사용자 프로필 */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 hover:bg-gray-50 rounded-lg p-2 transition-colors"
          >
            {/* 프로필 사진 또는 기본 아이콘 */}
            {userProfile ? (
              <img
                src={userProfile}
                alt="프로필"
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <UserIcon />
              </div>
            )}
          </button>

          {/* 사용자 메뉴 드롭다운 */}
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              {/* 프로필 정보 */}
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">{userName}</p>
                <p className="text-xs text-gray-500">1353578</p>
              </div>

              {/* 메뉴 아이템들 */}
              <div className="py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <LogoutIcon />
                  <span>로그아웃</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 드롭다운 외부 클릭 시 닫기 */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </div>
  );
}
