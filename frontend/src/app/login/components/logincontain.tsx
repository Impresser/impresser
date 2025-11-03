"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CommonContainerBox from "@/components/ui/CommonContainerBox";
import CommonInput from "@/components/ui/CommonInput01";
import CommonButton from "@/components/ui/CommonButton";
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
    <div className="w-full flex items-center justify-center py-10">
      <CommonContainerBox className="w-[360px] md:w-[420px] px-8 py-6 md:px-15 md:py-8">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="w-full">
            <CommonInput
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="아이디"
              textAlign="left"
              leftIcon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="3" />
                </svg>
              }
            />
          </div>

          <div className="w-full">
            <CommonInput
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              textAlign="left"
              leftIcon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="10" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              }
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center mt-2">
              {error}
            </div>
          )}
          <div className="pt-2">
            <CommonButton
              type="submit"
              variant="blue"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </CommonButton>
          </div>
        </form>

        <div className="mt-5 text-end text-xs text-gray-400">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setInfoOpen(true);
            }}
            className="hover:underline"
          >
            회원가입
          </a>
          <span className="mx-2">/</span>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setInfoOpen(true);
            }}
            className="hover:underline"
          >
            비밀번호 찾기
          </a>
        </div>
        <CommonModal isOpen={infoOpen} onClose={() => setInfoOpen(false)}>
          <LoginFindModalContent />
        </CommonModal>
      </CommonContainerBox>
    </div>
  );
}


