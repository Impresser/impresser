import { ApiResponse } from "@/types/auth";
import { 
  GetConvertHistoriesParams, 
  GetConvertHistoriesResponse,
  GetCompressionTypesParams,
  CompressionTypeItem,
  GetCompressionTypeVersionsParams,
  CompressionTypeVersionItem,
  ConvertHistoryDetailItem,
  CreateConvertJobRequest,
  CreateConvertRequest,
  CreateConvertResponse
} from "@/types/imageCompressor";
import { fetchWithAuth } from "@/utils/fetchWithAuth";

// SSE 이벤트 데이터 타입
export interface SSEEventData {
  convertHistoryUuid?: string;
  status?: string;
  message?: string;
  progress?: number;
  eventType?: string; // SSE 이벤트 타입 (예: "COMPLETED", "PROGRESS")
  [key: string]: any;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://k13s404.p.ssafy.io:8443/api/v1";

/**
 * 압축 변환 내역(완료) 목록 조회 API 호출
 * @param params 조회 파라미터 (page, size)
 * @returns 압축 내역 목록 조회 응답 데이터
 */
export async function getConvertHistories(
  params?: GetConvertHistoriesParams
): Promise<ApiResponse<GetConvertHistoriesResponse>> {
  // Query 파라미터 구성
  const queryParams = new URLSearchParams();
  if (params?.page !== undefined) {
    queryParams.append("page", params.page.toString());
  }
  if (params?.size !== undefined) {
    queryParams.append("size", params.size.toString());
  }

  const url = `${API_BASE_URL}/convert/histories${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

  const response = await fetchWithAuth(url, {
    method: "GET",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `압축 내역 조회 실패: ${response.status} ${response.statusText}`
    );
  }

  const data: ApiResponse<GetConvertHistoriesResponse> = await response.json();
  return data;
}

/**
 * 압축 방식(알고리즘) 조회 API 호출
 * @param params 조회 파라미터 (processingUnit: 'cpu' 또는 'gpu')
 * @returns 압축 알고리즘 목록 응답 데이터
 */
export async function getCompressionTypes(
  params: GetCompressionTypesParams
): Promise<ApiResponse<CompressionTypeItem[]>> {
  // Query 파라미터 구성
  const queryParams = new URLSearchParams();
  queryParams.append("processingUnit", params.processingUnit);

  const url = `${API_BASE_URL}/convert/compression-type?${queryParams.toString()}`;

  const response = await fetchWithAuth(url, {
    method: "GET",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `압축 알고리즘 조회 실패: ${response.status} ${response.statusText}`
    );
  }

  const data: ApiResponse<CompressionTypeItem[]> = await response.json();
  return data;
}

/**
 * 압축 방식 버전 목록 조회 API 호출
 * @param params 조회 파라미터 (compressionTypeUuid)
 * @returns 압축 방식 버전 목록 응답 데이터
 */
export async function getCompressionTypeVersions(
  params: GetCompressionTypeVersionsParams
): Promise<ApiResponse<CompressionTypeVersionItem[]>> {
  const url = `${API_BASE_URL}/convert/compression-type/${params.compressionTypeUuid}/versions`;

  const response = await fetchWithAuth(url, {
    method: "GET",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `압축 방식 버전 조회 실패: ${response.status} ${response.statusText}`
    );
  }

  const data: ApiResponse<CompressionTypeVersionItem[]> = await response.json();
  return data;
}

/**
 * 압축 변환 내역(완료) 상세 조회 API 호출
 * @param convertHistoryUuid 압축 내역 UUID
 * @returns 압축 내역 상세 정보 응답 데이터
 */
export async function getConvertHistoryDetail(
  convertHistoryUuid: string
): Promise<ApiResponse<ConvertHistoryDetailItem>> {
  const url = `${API_BASE_URL}/convert/histories/${convertHistoryUuid}`;

  const response = await fetchWithAuth(url, {
    method: "GET",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `압축 내역 상세 조회 실패: ${response.status} ${response.statusText}`
    );
  }

  const data: ApiResponse<ConvertHistoryDetailItem> = await response.json();
  return data;
}

/**
 * 이미지 변환 대기열 등록 API 호출
 * @param request 변환 요청 데이터
 * @returns API 응답 데이터
 */
export async function createConvertJobs(
  request: CreateConvertJobRequest
): Promise<ApiResponse<{}>> {
  const url = `${API_BASE_URL}/convert/jobs`;

  console.log('[압축 API] createConvertJobs 호출 시작');
  console.log('[압축 API] URL:', url);
  console.log('[압축 API] 요청 데이터:', {
    요청개수: request.createConvertRequests?.length || 0,
    요청목록: request.createConvertRequests?.map(req => ({
      bmpUrl: req.bmpUrl,
      compressionTypeUuid: req.compressionTypeUuid,
      bmpVolume: req.bmpVolume,
      dimensions: `${req.bmpWidth}x${req.bmpHeight}`,
    })),
  });

  const response = await fetchWithAuth(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  console.log('[압축 API] 응답 상태:', response.status, response.statusText);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('[압축 API] 응답 실패:', {
      status: response.status,
      statusText: response.statusText,
      errorData,
    });
    throw new Error(
      errorData.message || `이미지 변환 대기열 등록 실패: ${response.status} ${response.statusText}`
    );
  }

  const data: ApiResponse<{}> = await response.json();
  console.log('[압축 API] 응답 성공:', data);
  return data;
}

/**
 * 이미지 변환 요청 API 호출
 * @param request 변환 요청 데이터
 * @returns 변환 요청 응답 데이터
 */
export async function createConvert(
  request: CreateConvertRequest
): Promise<ApiResponse<CreateConvertResponse>> {
  const url = `${API_BASE_URL}/convert`;

  const response = await fetchWithAuth(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `이미지 변환 요청 실패: ${response.status} ${response.statusText}`
    );
  }

  const data: ApiResponse<CreateConvertResponse> = await response.json();
  return data;
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
                      const data: SSEEventData = JSON.parse(dataContent);
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

