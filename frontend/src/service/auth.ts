import { LoginRequest, LoginResponse, LogoutResponse, ReissueResponse } from "@/types/auth";

// store import는 선택적 (순환 참조 방지)
let authStore: { setToken: (token: string) => void } | null = null;

// store를 외부에서 설정할 수 있는 함수
export const setAuthStore = (store: { setToken: (token: string) => void }) => {
  authStore = store;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://k13s404.p.ssafy.io/dev/api/v1";

/**
 * 로그인 API 호출
 * @param loginData 로그인 요청 데이터 (employeeNo, password)
 * @returns 로그인 응답 데이터
 */
export async function login(loginData: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(loginData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `로그인 실패: ${response.status} ${response.statusText}`
    );
  }

  const data: LoginResponse = await response.json();
  return data;
}

/**
 * 로그아웃 API 호출
 * @returns 로그아웃 응답 데이터
 */
export async function logout(): Promise<LogoutResponse> {
  const accessToken = localStorage.getItem("accessToken");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // 토큰이 있으면 Authorization 헤더에 추가
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `로그아웃 실패: ${response.status} ${response.statusText}`
    );
  }

  // 응답이 비어있을 수 있으므로 JSON 파싱 시도, 실패하면 기본 응답 반환
  try {
    const data: LogoutResponse = await response.json();
    return data;
  } catch {
    // JSON 응답이 없어도 성공으로 처리
    return {
      isSuccess: true,
      code: "200",
      message: "로그아웃 성공",
    };
  }
}

/**
 * 토큰 재발급 API 호출
 * @returns 토큰 재발급 응답 데이터
 */
export async function reissueToken(): Promise<ReissueResponse> {
  const accessToken = localStorage.getItem("accessToken");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // 현재 토큰이 있으면 Authorization 헤더에 추가
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}/auth/reissue`, {
    method: "POST",
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `토큰 재발급 실패: ${response.status} ${response.statusText}`
    );
  }

  const data: ReissueResponse = await response.json();
  
  // 재발급된 토큰을 localStorage와 store에 저장
  if (data.isSuccess && data.result?.accessToken) {
    localStorage.setItem("accessToken", data.result.accessToken);
    // Zustand store도 업데이트
    if (authStore) {
      authStore.setToken(data.result.accessToken);
    }
  }

  return data;
}

