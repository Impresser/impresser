import { reissueToken } from "@/service/auth";

/**
 * 401 에러 발생 시 자동으로 토큰을 재발급하고 요청을 재시도하는 fetch 래퍼 함수
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // 토큰 가져오기
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem("accessToken") : null;

  // 헤더 설정 (Record<string, string>로 변환)
  const existingHeaders = options.headers instanceof Headers
    ? Object.fromEntries(options.headers.entries())
    : (options.headers as Record<string, string> | undefined) || {};

  const headers: Record<string, string> = {
    ...existingHeaders,
  };

  // Content-Type이 없으면 기본값 설정
  if (!headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // 토큰이 있으면 Authorization 헤더에 추가
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  // 첫 번째 요청
  let response = await fetch(url, {
    ...options,
    headers,
    // 쿠키 기반 인증(리프레시용)을 위해 항상 포함
    credentials: 'include',
  });

  // 401 에러 발생 시 토큰 재발급 후 재시도
  if (response.status === 401 && accessToken) {
    try {
      // 토큰 재발급
      await reissueToken();

      // 재발급된 토큰으로 요청 재시도
      const newAccessToken = localStorage.getItem("accessToken");
      if (newAccessToken) {
        headers['Authorization'] = `Bearer ${newAccessToken}`;
        
        // 원래 요청의 body를 복사 (이미 읽혔을 수 있으므로 options에서 가져옴)
        const retryOptions: RequestInit = {
          ...options,
          headers,
          credentials: 'include',
        };

        // body가 이미 읽혔을 수 있으므로, 원본 options에서 body를 사용
        if (options.body) {
          retryOptions.body = options.body;
        }

        response = await fetch(url, retryOptions);
      } else {
        // 재발급은 성공했지만 토큰이 없는 경우
        console.error('토큰 재발급 후 토큰을 찾을 수 없습니다.');
        return response;
      }
    } catch (error) {
      // 토큰 재발급 실패 시 에러 상세 정보 로깅
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('토큰 재발급 실패:', errorMessage);
      
      // 토큰 재발급 실패 시 401 에러를 그대로 반환
      // (이미 reissueToken에서 localStorage 정리 및 에러 메시지 처리 완료)
      return response;
    }
  }

  return response;
}

