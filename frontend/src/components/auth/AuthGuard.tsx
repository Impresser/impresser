"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import CommonLoader from "@/components/ui/CommonLoader";

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * 인증이 필요한 페이지를 보호하는 컴포넌트
 * 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
 */
export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const initializeFromStorage = useAuthStore((state) => state.initializeFromStorage);
  const [mounted, setMounted] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    setMounted(true);
    // localStorage에서 인증 상태 초기화
    initializeFromStorage();
  }, [initializeFromStorage]);

  useEffect(() => {
    if (!mounted) return;

    // localStorage에서 직접 확인
    const token = localStorage.getItem("accessToken");
    const userUuid = localStorage.getItem("userUuid");
    const employeeNo = localStorage.getItem("employeeNo");
    const userName = localStorage.getItem("userName");
    const userRole = localStorage.getItem("userRole");

    const hasValidAuth =
      token && userUuid && employeeNo && userName && userRole;

    // store가 업데이트된 후 다시 확인
    setTimeout(() => {
      const currentIsLoggedIn = useAuthStore.getState().isLoggedIn;
      
      if (!hasValidAuth && !currentIsLoggedIn) {
        // 로그아웃 액션인지 확인 (로그아웃 버튼 클릭이 아닌 외부 접근만 returnUrl 추가)
        const isLogoutAction = sessionStorage.getItem('isLogoutAction');
        
        // 외부에서 직접 접근한 경우에만 returnUrl 추가
        const returnUrl = !isLogoutAction && pathname !== "/login" 
          ? `?returnUrl=${encodeURIComponent(pathname)}` 
          : "";
        
        router.push(`/login${returnUrl}`);
        
        // 로그아웃 플래그 제거 (한 번만 사용)
        if (isLogoutAction) {
          sessionStorage.removeItem('isLogoutAction');
        }
      } else {
        setIsChecking(false);
      }
    }, 100);
  }, [mounted, isLoggedIn, router, pathname]);

  // 마운트 전이거나 체크 중이면 아무것도 렌더링하지 않음
  if (!mounted || isChecking) {
    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center">
        <CommonLoader className="w-[240px] h-[180px]" color="#0059FF" timeScale={3} />
      </div>
    );
  }

  // 로그인되지 않았으면 null 반환 (리다이렉트 중)
  if (!isLoggedIn) {
    return null;
  }

  return <>{children}</>;
}

