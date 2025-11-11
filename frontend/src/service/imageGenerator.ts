import { ApiResponse } from "@/types/auth";
import { PatternFormState } from "@/store/imageGeneratorStore";
import { CreateBmpPatternRequest, CreateBmpPatternResult, GetBmpListResult, BmpDetailResult } from "@/types/imageGenerator";
import { fetchWithAuth } from "@/utils/fetchWithAuth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://k13s404.p.ssafy.io:8443/api/v1";

/**
 * 폼 데이터를 API 요청 형식으로 변환
 */
export function convertFormToApiRequest(form: PatternFormState): CreateBmpPatternRequest {
  // 숫자 값 추출 (빈 문자열이면 0)
  const getNum = (value: number | ""): number => {
    if (value === "" || value === undefined || value === null) return 0;
    return Number(value) || 0;
  };

  return {
    bmpWidth: getNum(form.imageSize.w),
    bmpHeight: getNum(form.imageSize.h),
    bmpVolume: 0, // API 스펙에 있지만 폼에 없는 필드
    redCountX: getNum(form.channels.R.count.x),
    redCountY: getNum(form.channels.R.count.y),
    redSizeX: getNum(form.channels.R.size.x),
    redSizeY: getNum(form.channels.R.size.y),
    redGapX: getNum(form.channels.R.spacing.x),
    redGapY: getNum(form.channels.R.spacing.y),
    greenCountX: getNum(form.channels.G.count.x),
    greenCountY: getNum(form.channels.G.count.y),
    greenSizeX: getNum(form.channels.G.size.x),
    greenSizeY: getNum(form.channels.G.size.y),
    greenGapX: getNum(form.channels.G.spacing.x),
    greenGapY: getNum(form.channels.G.spacing.y),
    blueCountX: getNum(form.channels.B.count.x),
    blueCountY: getNum(form.channels.B.count.y),
    blueSizeX: getNum(form.channels.B.size.x),
    blueSizeY: getNum(form.channels.B.size.y),
    blueGapX: getNum(form.channels.B.spacing.x),
    blueGapY: getNum(form.channels.B.spacing.y),
    rgGap: getNum(form.gapRG.x),
    gbGap: getNum(form.gapGB.x),
  };
}

/**
 * BMP 패턴 생성 API 호출
 * @param formData 패턴 생성 폼 데이터
 * @returns 생성 응답 데이터
 */
export async function createBmpPattern(
  formData: PatternFormState
): Promise<ApiResponse<CreateBmpPatternResult>> {
  const requestBody = convertFormToApiRequest(formData);

  const response = await fetchWithAuth(`${API_BASE_URL}/bmp`, {
    method: "POST",
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `패턴 생성 실패: ${response.status} ${response.statusText}`
    );
  }

  const data: ApiResponse<CreateBmpPatternResult> = await response.json();
  return data;
}

/**
 * SSE 이벤트 데이터 타입
 */
export interface SSEEventData {
  progress?: number;
  status?: string;
  message?: string;
  [key: string]: any;
}

/**
 * SSE 구독 함수
 * @param onMessage 메시지 수신 콜백
 * @param onError 에러 발생 콜백
 * @returns EventSource 인스턴스 (닫기용)
 */
export function subscribeSSE(
  onMessage: (data: SSEEventData) => void,
  onError?: (error: Event) => void
): EventSource {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://k13s404.p.ssafy.io:8443/api/v1";
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem("accessToken") : null;

  // EventSource는 쿼리 파라미터로 토큰을 전달해야 할 수 있음
  // 또는 fetch를 사용하여 스트림을 읽는 방식 사용
  let url = `${API_BASE_URL}/sse/subscribe`;
  
  // EventSource는 헤더를 직접 설정할 수 없으므로, fetch를 사용
  const eventSource = new EventSource(url);

  eventSource.onmessage = (event) => {
    try {
      const data: SSEEventData = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error('SSE 메시지 파싱 오류:', error);
    }
  };

  eventSource.onerror = (error) => {
    console.error('SSE 연결 오류:', error);
    if (onError) {
      onError(error);
    }
  };

  return eventSource;
}

/**
 * Fetch를 사용한 SSE 구독 (인증 헤더 지원)
 * @param onMessage 메시지 수신 콜백
 * @param onError 에러 발생 콜백
 * @returns AbortController (연결 종료용)
 */
export function subscribeSSEWithAuth(
  onMessage: (data: SSEEventData) => void,
  onError?: (error: Error) => void
): AbortController {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://k13s404.p.ssafy.io:8443/api/v1";
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem("accessToken") : null;

  const abortController = new AbortController();

  const headers: HeadersInit = {
    Accept: "text/event-stream",
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  console.log('SSE 연결 시도:', `${API_BASE_URL}/sse/subscribe`);
  fetch(`${API_BASE_URL}/sse/subscribe`, {
    method: "GET",
    headers,
    signal: abortController.signal,
  })
    .then(async (response) => {
      console.log('SSE 응답 상태:', response.status, response.ok);
      if (!response.ok) {
        throw new Error(`SSE 연결 실패: ${response.status}`);
      }

      console.log('SSE 연결 성공, 스트림 읽기 시작');
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("응답 본문을 읽을 수 없습니다.");
      }

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('SSE 스트림 종료');
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          // data: 로 시작하는 라인 처리 (공백 있거나 없거나)
          if (line.startsWith("data:")) {
            const dataContent = line.slice(5).trim(); // "data:" 제거하고 공백 제거
            
            // 빈 데이터나 "ok", "ping" 같은 하트비트 메시지는 무시
            if (dataContent === "" || dataContent === "ok" || dataContent === "ping") {
              continue;
            }
            
            try {
              const data: SSEEventData = JSON.parse(dataContent);
              console.log('SSE 메시지 파싱 성공:', data);
              onMessage(data);
            } catch (error) {
              console.error("SSE 메시지 파싱 오류:", error, "원본:", dataContent);
            }
          }
        }
      }
    })
    .catch((error) => {
      if (error.name !== "AbortError") {
        console.error("SSE 연결 오류:", error);
        if (onError) {
          onError(error);
        }
      }
    });

  return abortController;
}

/**
 * BMP 목록 조회 API 호출
 * @param params 페이지네이션 파라미터
 * @returns BMP 목록 조회 응답 데이터
 */
export async function getBmpList(
  params?: { page?: number; size?: number }
): Promise<ApiResponse<GetBmpListResult>> {
  const queryParams = new URLSearchParams();
  if (params?.page !== undefined) {
    queryParams.append("page", String(params.page));
  }
  if (params?.size !== undefined) {
    queryParams.append("size", String(params.size));
  }

  const url = `${API_BASE_URL}/bmp${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  const response = await fetchWithAuth(url, {
    method: "GET",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `목록 조회 실패: ${response.status} ${response.statusText}`
    );
  }

  const data: ApiResponse<GetBmpListResult> = await response.json();
  return data;
}

/**
 * BMP 상세 조회 API 호출
 * @param generationUuid 생성 UUID
 * @returns BMP 상세 조회 응답 데이터
 */
export async function getBmpDetail(
  generationUuid: string
): Promise<ApiResponse<BmpDetailResult>> {
  const url = `${API_BASE_URL}/bmp/${generationUuid}`;

  const response = await fetchWithAuth(url, {
    method: "GET",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `상세 조회 실패: ${response.status} ${response.statusText}`
    );
  }

  const data: ApiResponse<BmpDetailResult> = await response.json();
  return data;
}

