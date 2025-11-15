"use client";

import { create } from "zustand";
import { LoginResult } from "@/types/auth";

type AuthStore = {
  // 인증 상태
  isLoggedIn: boolean;
  accessToken: string | null;
  user: LoginResult | null;

  // Actions
  setAuth: (loginResult: LoginResult, token: string) => void;
  setToken: (token: string) => void;
  clearAuth: () => void;
  updateUser: (userData: Partial<LoginResult>) => void;
  initializeFromStorage: () => void;
};

// localStorage에서 초기값 가져오기 (클라이언트에서만 호출)
const getInitialState = (): Pick<AuthStore, "isLoggedIn" | "accessToken" | "user"> => {
  if (typeof window === "undefined") {
    return {
      isLoggedIn: false,
      accessToken: null,
      user: null,
    };
  }

  const token = localStorage.getItem("accessToken");
  const userUuid = localStorage.getItem("userUuid");
  const employeeNo = localStorage.getItem("employeeNo");
  const userName = localStorage.getItem("userName");
  const userRole = localStorage.getItem("userRole");
  const profileUrl = localStorage.getItem("profileUrl");

  if (token && userUuid && employeeNo && userName && userRole) {
    return {
      isLoggedIn: true,
      accessToken: token,
      user: {
        accessToken: token,
        userUuid,
        employeeNo,
        userName,
        userRole,
        profileUrl: profileUrl || "",
      },
    };
  }

  return {
    isLoggedIn: false,
    accessToken: null,
    user: null,
  };
};

// 서버와 클라이언트에서 동일한 초기값 사용 (Hydration 에러 방지)
export const useAuthStore = create<AuthStore>((set) => ({
  isLoggedIn: false,
  accessToken: null,
  user: null,

  setAuth: (loginResult: LoginResult, token: string) => {
    // localStorage에도 저장 (기존 코드와의 호환성을 위해)
    localStorage.setItem("accessToken", token);
    localStorage.setItem("userUuid", loginResult.userUuid);
    localStorage.setItem("employeeNo", loginResult.employeeNo);
    localStorage.setItem("userName", loginResult.userName);
    localStorage.setItem("userRole", loginResult.userRole);
    if (loginResult.profileUrl) {
      localStorage.setItem("profileUrl", loginResult.profileUrl);
    }

    set({
      isLoggedIn: true,
      accessToken: token,
      user: loginResult,
    });
  },

  setToken: (token: string) => {
    localStorage.setItem("accessToken", token);
    set({ accessToken: token });
    // user 객체의 accessToken도 업데이트
    set((state) => ({
      user: state.user ? { ...state.user, accessToken: token } : null,
    }));
  },

  clearAuth: () => {
    // localStorage에서 모든 인증 정보 제거
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userUuid");
    localStorage.removeItem("employeeNo");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    localStorage.removeItem("profileUrl");
    // 사이드바 상태도 초기화
    localStorage.removeItem("sidebar-storage");

    set({
      isLoggedIn: false,
      accessToken: null,
      user: null,
    });
  },

  updateUser: (userData: Partial<LoginResult>) => {
    set((state) => {
      if (!state.user) return state;

      const updatedUser = { ...state.user, ...userData };

      // localStorage도 업데이트
      if (userData.userName) {
        localStorage.setItem("userName", userData.userName);
      }
      if (userData.employeeNo) {
        localStorage.setItem("employeeNo", userData.employeeNo);
      }
      if (userData.profileUrl !== undefined) {
        if (userData.profileUrl) {
          localStorage.setItem("profileUrl", userData.profileUrl);
        } else {
          localStorage.removeItem("profileUrl");
        }
      }

      return { user: updatedUser };
    });
  },

  initializeFromStorage: () => {
    const initialState = getInitialState();
    set(initialState);
  },
}));

// auth.ts에서 store를 사용할 수 있도록 export
if (typeof window !== "undefined") {
  import("@/service/auth").then((module) => {
    module.setAuthStore({
      setToken: (token: string) => useAuthStore.getState().setToken(token),
    });
  });
}

