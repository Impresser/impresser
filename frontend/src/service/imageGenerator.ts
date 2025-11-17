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
    rgGapX: getNum(form.gapRG.x),
    rgGapY: getNum(form.gapRG.y),
    gbGapX: getNum(form.gapGB.x),
    gbGapY: getNum(form.gapGB.y),
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
  eventType?: string; // SSE 이벤트 타입 (예: "COMPLETED", "PROGRESS")
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
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;
  let reconnectTimer: NodeJS.Timeout | null = null;
  let isAborted = false;

  const headers: HeadersInit = {
    Accept: "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const connectSSE = async (isReconnect = false) => {
    // 중단된 경우 재연결 시도하지 않음
    if (isAborted || abortController.signal.aborted) {
      return;
    }

    try {
      if (isReconnect) {
        // 지수 백오프: 1초, 2초, 4초, 8초, 16초
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 16000);
        console.log(`SSE 재연결 시도 ${reconnectAttempts}/${maxReconnectAttempts} (${delay}ms 후)`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      if (isAborted || abortController.signal.aborted) {
        return;
      }

      console.log('SSE 연결 시도:', `${API_BASE_URL}/sse/subscribe`);
      
      const response = await fetch(`${API_BASE_URL}/sse/subscribe`, {
        method: "GET",
        headers,
        signal: abortController.signal,
        cache: "no-store",
        // HTTP/2 문제 완화를 위한 추가 옵션
        keepalive: false,
      });

      console.log('SSE 응답 상태:', response.status, response.ok, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`SSE 연결 실패: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
      }

      // Content-Type 확인
      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("text/event-stream")) {
        console.warn('SSE Content-Type 경고:', contentType);
      }

      // 연결 성공 시 재연결 시도 횟수 리셋
      reconnectAttempts = 0;
      console.log('SSE 연결 성공, 스트림 읽기 시작');
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("응답 본문을 읽을 수 없습니다.");
      }

      let buffer = "";
      let currentEvent: { eventType?: string; data?: string } = {};

      try {
        while (true) {
          if (isAborted || abortController.signal.aborted) {
            break;
          }

          // Promise.race 제거 - 타임아웃이 HTTP/2 에러를 유발할 수 있음
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('SSE 스트림 정상 종료');
            break;
          }

          if (value) {
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmedLine = line.trim();
              
              // 빈 줄: 이벤트 완료 신호
              if (trimmedLine === "") {
                // 이벤트 데이터가 있으면 처리
                if (currentEvent.data) {
                  const dataContent = currentEvent.data.trim();
                  
                  // 빈 데이터나 "ok", "ping" 같은 하트비트 메시지는 무시
                  if (dataContent !== "" && dataContent !== "ok" && dataContent !== "ping") {
                    try {
                      const parsed = JSON.parse(dataContent);
                      // JSON.parse 결과가 문자열인 경우 객체로 감싸기
                      let data: SSEEventData;
                      if (typeof parsed === 'string') {
                        data = { message: parsed };
                      } else if (typeof parsed === 'object' && parsed !== null) {
                        data = parsed as SSEEventData;
                      } else {
                        // 숫자나 boolean 등 다른 타입인 경우
                        data = { message: String(parsed) };
                      }
                      
                      // 이벤트 타입이 있으면 추가
                      if (currentEvent.eventType) {
                        data.eventType = currentEvent.eventType;
                      }
                      console.log('SSE 메시지 파싱 성공:', data, `이벤트 타입: ${currentEvent.eventType || '기본'}`);
                      onMessage(data);
                    } catch (error) {
                      console.error("SSE 메시지 파싱 오류:", error, "원본:", dataContent);
                    }
                  }
                }
                // 이벤트 초기화
                currentEvent = {};
                continue;
              }

              // event: 로 시작하는 라인 처리
              if (trimmedLine.startsWith("event:")) {
                currentEvent.eventType = trimmedLine.slice(6).trim();
                continue;
              }

              // data: 로 시작하는 라인 처리
              if (trimmedLine.startsWith("data:")) {
                const dataContent = trimmedLine.slice(5).trim();
                // 여러 data: 라인이 올 수 있으므로 누적
                if (currentEvent.data) {
                  currentEvent.data += "\n" + dataContent;
                } else {
                  currentEvent.data = dataContent;
                }
                continue;
              }

              // id: 또는 retry: 같은 다른 필드는 무시
            }
          }
        }
      } catch (readError) {
        // 읽기 중 에러 발생
        if (readError instanceof Error && readError.name !== "AbortError") {
          console.error("SSE 스트림 읽기 오류:", readError);
          throw readError;
        }
      } finally {
        // 리소스 정리
        try {
          reader.releaseLock();
        } catch (e) {
          // 이미 해제된 경우 무시
        }
      }
    } catch (error) {
      // AbortError는 정상적인 종료이므로 무시
      if (error instanceof Error && error.name === "AbortError" || isAborted) {
        console.log('SSE 연결이 사용자에 의해 중단되었습니다.');
        return;
      }

      // 네트워크 에러인 경우 재연결 시도
      const isNetworkError = error instanceof TypeError && 
        (error.message.includes('network error') || 
         error.message.includes('Failed to fetch') ||
         error.message.includes('ERR_HTTP2_PROTOCOL_ERROR'));

      if (isNetworkError && reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        console.warn(`SSE 네트워크 에러 발생, 재연결 시도 예정 (${reconnectAttempts}/${maxReconnectAttempts}):`, error);
        
        // 재연결 시도
        reconnectTimer = setTimeout(() => {
          if (!isAborted && !abortController.signal.aborted) {
            connectSSE(true);
          }
        }, 0);
        return;
      }

      // 재연결 시도 횟수 초과 또는 다른 에러
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorDetails = {
        message: errorMessage,
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined,
        reconnectAttempts,
      };
      
      console.error("SSE 연결 오류 상세:", errorDetails);
      
      if (onError) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  };

  // AbortController에 중단 핸들러 추가
  abortController.signal.addEventListener('abort', () => {
    isAborted = true;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  });

  // 비동기로 연결 시작
  connectSSE(false);

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

