import { LoginRequest, LoginResponse, LogoutResponse, ReissueResponse } from "@/types/auth";

// store import는 선택적 (순환 참조 방지)
let authStore: { setToken: (token: string) => void } | null = null;

// store를 외부에서 설정할 수 있는 함수
export const setAuthStore = (store: { setToken: (token: string) => void }) => {
  authStore = store;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://k13s404.p.ssafy.io:8443/api/v1";

/**
 * 현재 저장된 쿠키 확인 (디버깅용)
 * HTTPOnly 쿠키는 JavaScript에서 읽을 수 없으므로, 이 함수는 일반 쿠키만 확인합니다.
 */
function checkCookies(): void {
  if (typeof window === 'undefined') return;
  
  // document.cookie는 HTTPOnly 쿠키를 읽을 수 없습니다
  // 일반 쿠키만 확인 가능
  const cookies = document.cookie.split(';').map(c => c.trim());
  
  if (cookies.length === 0 || (cookies.length === 1 && cookies[0] === '')) {
  }
}

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
    // 리프레시 토큰을 쿠키로 수신하기 위해 필요
    credentials: "include",
    body: JSON.stringify(loginData),
  });

  // 디버깅: Set-Cookie 헤더 확인
  // 참고: 브라우저 보안 정책으로 인해 JavaScript에서 Set-Cookie 헤더를 읽을 수 없을 수 있습니다.
  try {
    const setCookieHeader = response.headers.get("set-cookie");
    if (setCookieHeader) {
    } else {
    }
  } catch (error) {
  }

  // 모든 응답 헤더 확인 (디버깅용, Set-Cookie는 포함되지 않을 수 있음)
  try {
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
 
  } catch (error) {
    console.warn("응답 헤더 확인 중 오류:", error);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `로그인 실패: ${response.status} ${response.statusText}`
    );
  }

  const data: LoginResponse = await response.json();
  
  // 로그인 성공 후 쿠키 확인 (디버깅용)
  if (data.isSuccess) {
    setTimeout(() => {
      checkCookies();
    }, 100);
  }
  
  return data;
}

/**
 * 로그아웃 API 호출
 * @returns 로그아웃 응답 데이터
 */
export async function logout(): Promise<LogoutResponse> {
  // 로그아웃은 토큰 재발급 대상에서 제외 (순환 참조 방지)
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
    // 서버에 저장된 리프레시 쿠키를 함께 전송
    credentials: "include",
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
 * @note 이 함수는 fetchWithAuth에서 사용되므로 순환 참조를 피하기 위해 일반 fetch 사용
 */
export async function reissueToken(): Promise<ReissueResponse> {
  // 재발급은 리프레시 토큰(쿠키) 기반으로 수행. Authorization 헤더를 보내지 않음
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // 토큰 재발급은 fetchWithAuth를 사용하지 않음 (순환 참조 방지)
  const response = await fetch(`${API_BASE_URL}/auth/reissue`, {
    method: "POST",
    headers,
    // 리프레시 쿠키를 전송해야 함
    credentials: "include",
  });

  if (!response.ok) {
    // 에러 응답 본문 파싱 시도
    let errorMessage = `토큰 재발급 실패: ${response.status} ${response.statusText}`;
    
    try {
      const errorData = await response.json();
      // 서버에서 반환한 에러 메시지 사용
      if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.code) {
        errorMessage = `토큰 재발급 실패 [${errorData.code}]: ${errorData.message || errorMessage}`;
      }
    } catch {
      // JSON 파싱 실패 시 기본 메시지 사용
    }

    // 401 에러는 인증 문제(리프레시 토큰 없음/만료)를 의미
    if (response.status === 401) {
      // 인증 상태 초기화
      if (typeof window !== 'undefined') {
        localStorage.removeItem("accessToken");
        if (authStore) {
          // authStore의 clearAuth를 호출하려면 순환 참조를 피하기 위해 직접 호출
          // authStore.clearAuth() 대신 localStorage만 정리
          localStorage.removeItem("userUuid");
          localStorage.removeItem("employeeNo");
          localStorage.removeItem("userName");
          localStorage.removeItem("userRole");
          localStorage.removeItem("profileUrl");
        }
      }
      errorMessage = "세션이 만료되었습니다. 다시 로그인해주세요.";
    }

    throw new Error(errorMessage);
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

