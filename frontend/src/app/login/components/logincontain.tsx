"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CommonInput from "@/components/ui/CommonInput01";
import CommonModal from "@/components/ui/CommonModal";
import LoginFindModalContent from "./loginfindmodal";
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
    <div className="h-screen w-screen flex">
      {/* 왼쪽 섹션 - 환영 메시지 */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-linear-to-br from-blue-600 via-blue-500 to-blue-400">
        {/* 추상적인 디자인 요소들 */}
        <div className="absolute inset-0 opacity-20">
          {/* 물결 패턴 */}
          <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 400 600" fill="none">
            <path
              d="M0,200 Q100,150 200,200 T400,200 L400,600 L0,600 Z"
              stroke="white"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M0,400 Q150,350 300,400 T400,400"
              stroke="white"
              strokeWidth="1.5"
              fill="none"
            />
          </svg>
          
          {/* 원형 요소들 */}
          <div className="absolute top-20 left-10 w-32 h-32 rounded-full border-2 border-white/30"></div>
          <div className="absolute bottom-32 left-20 w-20 h-20 rounded-full border-2 border-white/40"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 rounded-full border-2 border-white/25"></div>
          
          {/* 십자 모양 */}
          <div className="absolute top-40 right-20 w-12 h-12">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/30 transform -translate-y-1/2"></div>
            <div className="absolute left-1/2 top-0 w-0.5 h-full bg-white/30 transform -translate-x-1/2"></div>
          </div>
          
          {/* 소용돌이 패턴 */}
          <svg className="absolute bottom-20 right-10 w-40 h-40" viewBox="0 0 100 100">
            <path
              d="M50,50 Q30,30 50,10 Q70,30 50,50"
              stroke="white"
              strokeWidth="1.5"
              fill="none"
              opacity="0.3"
            />
          </svg>
        </div>

        {/* 텍스트 콘텐츠 */}
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <h1 className="text-5xl font-bold mb-4">Welcome SEMES!</h1>
          <p className="text-lg text-white/90">
            사번으로 로그인하여 접근할 수 있습니다.
          </p>
        </div>

        {/* 장식적인 점 패턴 */}
        <div className="absolute left-0 top-0 bottom-0 w-2 flex flex-col justify-center gap-2 opacity-30">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="w-1 h-1 bg-white rounded-full ml-1"></div>
          ))}
        </div>
      </div>

      {/* 오른쪽 섹션 - 로그인 양식 */}
      <div className="flex-1 flex items-center justify-center bg-white relative">
        {/* 장식적인 점 패턴 (왼쪽 경계) */}
        <div className="absolute left-0 top-0 bottom-0 w-2 flex flex-col justify-start gap-2 opacity-20 pt-20">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="w-1 h-1 bg-blue-500 rounded-full ml-1"></div>
          ))}
        </div>

        <div className="w-full max-w-md px-8 py-10">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">Login</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 아이디 입력 */}
            <div className="w-full">
              <CommonInput
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Username or email"
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
                placeholder="Password"
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
              className="w-full py-3 px-4 bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold rounded-lg shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
        </div>

        <CommonModal isOpen={infoOpen} onClose={() => setInfoOpen(false)}>
          <LoginFindModalContent />
        </CommonModal>
      </div>
    </div>
  );
}


