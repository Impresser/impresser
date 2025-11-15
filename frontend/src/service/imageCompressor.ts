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
      errorData.message || `이미지 변환 대기열 등록 실패: ${response.status} ${response.statusText}`
    );
  }

  const data: ApiResponse<{}> = await response.json();
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

