"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CommonInput from "@/components/ui/CommonInput01";
import CommonModal from "@/components/ui/CommonModal";
import CommonContainerBox from "@/components/ui/CommonContainerBox";
import LoginFindModalContent from "./loginfindmodal";
import LoginBackground from "./LoginBackground";
import LoginBrandSection from "./LoginBrandSection";
import { login } from "@/service/auth";
import { useAuthStore } from "@/store/authStore";

export default function LoginContain() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const initializeFromStorage = useAuthStore((state) => state.initializeFromStorage);
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [infoOpen, setInfoOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // 클라이언트에서만 마운트 후 localStorage에서 초기화
  useEffect(() => {
    setMounted(true);
    initializeFromStorage();
  }, [initializeFromStorage]);

  // 이미 로그인되어 있으면 대시보드로 리다이렉트
  useEffect(() => {
    if (mounted) {
      const token = localStorage.getItem("accessToken");
      const userUuid = localStorage.getItem("userUuid");
      const employeeNo = localStorage.getItem("employeeNo");
      const userName = localStorage.getItem("userName");
      const userRole = localStorage.getItem("userRole");

      const hasValidAuth = token && userUuid && employeeNo && userName && userRole;

      if (hasValidAuth || isLoggedIn) {
        const returnUrl = searchParams.get("returnUrl");
        router.push(returnUrl || "/dashboard");
      }
    }
  }, [mounted, isLoggedIn, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!userId.trim() || !password.trim()) {
      setError("아이디와 비밀번호를 입력해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await login({
        employeeNo: userId.trim(),
        password: password.trim(),
      });

      if (response.isSuccess && response.result) {
        // Zustand store에 저장
        setAuth(response.result, response.result.accessToken);

        // 로그아웃으로 인한 접근인지 확인 (플래그 체크 후 제거)
        const isLogoutAction = sessionStorage.getItem('isLogoutAction');
        if (isLogoutAction) {
          sessionStorage.removeItem('isLogoutAction');
        }

        // 로그아웃으로 인한 접근이 아니고 returnUrl이 있으면 그곳으로, 없으면 대시보드로 리다이렉트
        const returnUrl = !isLogoutAction ? searchParams.get("returnUrl") : null;
        router.push(returnUrl || "/dashboard");
      } else {
        setError(response.message || "로그인에 실패했습니다.");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "로그인 중 오류가 발생했습니다.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .fade-in {
          animation: fadeIn 1.5s ease-out 0.5s forwards;
          opacity: 0;
        }
      `}</style>

      <LoginBackground />
      
      <div className="h-screen w-screen flex" style={{ position: 'relative', zIndex: 20 }}>
        {/* 왼쪽 섹션 - 브랜드 섹션 (55% 너비 유지) */}
        <div className="hidden lg:flex lg:w-[55%] items-center justify-start p-4" style={{ paddingLeft: '10%' }}>
          <LoginBrandSection />
        </div>

        {/* 오른쪽 섹션 - 로그인 양식 */}
        <div className="flex-1 flex items-center justify-center relative">
        <CommonContainerBox className="w-full max-w-md px-8 py-10 fade-in" style={{ opacity: 0 }}>
          <h2 className="text-2xl font-bold text-gray-800 mb-8">로그인</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 아이디 입력 */}
            <div className="w-full">
              <CommonInput
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="사번"
                textAlign="left"
                className="rounded-lg border-gray-200 focus:border-blue-500"
                leftIcon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="3" />
                  </svg>
                }
              />
            </div>

            {/* 비밀번호 입력 */}
            <div className="w-full">
              <CommonInput
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
                textAlign="left"
                className="rounded-lg border-gray-200 focus:border-blue-500"
                leftIcon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="10" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                }
              />
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="text-red-500 text-sm">
                {error}
              </div>
            )}

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold rounded-lg shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </button>
          </form>

          {/* 회원가입 링크 */}
          <div className="mt-6 text-end text-sm text-gray-600">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setInfoOpen(true);
              }}
              className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
            >
              회원가입/비밀번호 찾기
            </a>
          </div>
        </CommonContainerBox>

        <CommonModal isOpen={infoOpen} onClose={() => setInfoOpen(false)}>
          <LoginFindModalContent />
        </CommonModal>
        </div>
      </div>
    </>
  );
}


