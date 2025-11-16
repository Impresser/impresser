import { ApiResponse } from "@/types/auth";

// 설비 목록 조회 요청 파라미터
export interface GetInkjetPrintersParams {
  printerName?: string;
  printerStatus?: string;
  processStatus?: string;
  installDate?: string; // YYYY-MM-DD 형식
  page?: number;
  size?: number;
}

// 설비 정보 응답 타입 (목록 조회용)
export interface InkjetPrinter {
  inkjetUuid: string;
  printerName: string;
  modelName: string;
  printerStatus: string; // "BROKEN" | "UNDER_REPAIR" | "OPERATIONAL"
  processStatus: string; // "WAITING" | "RUNNING"
  installDate: string; // YYYY-MM-DD 형식
  canvasX: number;
  canvasY: number;
}

// 설비 상세 정보 응답 타입
export interface InkjetPrinterDetail {
  inkjetUuid: string;
  printerName: string;
  modelName: string;
  printerStatus: string; // "BROKEN" | "UNDER_REPAIR" | "OPERATIONAL"
  processStatus: string; // "WAITING" | "RUNNING"
  installDate: string; // YYYY-MM-DD 형식
  cpu: string;
  gpu: string;
  ram: string;
  vram: string;
  sheetCount: number | null;
  tiffName: string | null;
  tiffUrl: string | null;
  canvasX: number;
  canvasY: number;
}

// 페이지네이션 정보
export interface PaginationInfo {
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
  hasNext: boolean;
}

// 설비 목록 조회 응답 타입
export interface GetInkjetPrintersResponse {
  content: InkjetPrinter[];
  pagination: PaginationInfo;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://k13s404.p.ssafy.io:8443/api/v1";

/**
 * 설비 목록 조회 API 호출
 * @param params 조회 파라미터
 * @returns 설비 목록 조회 응답 데이터
 */
export async function getInkjetPrinters(
  params?: GetInkjetPrintersParams
): Promise<ApiResponse<GetInkjetPrintersResponse>> {
  const accessToken = localStorage.getItem("accessToken");

  // Query 파라미터 구성
  const queryParams = new URLSearchParams();
  if (params?.printerName) {
    queryParams.append("printerName", params.printerName);
  }
  if (params?.printerStatus) {
    queryParams.append("printerStatus", params.printerStatus);
  }
  if (params?.processStatus) {
    queryParams.append("processStatus", params.processStatus);
  }
  if (params?.installDate) {
    queryParams.append("installDate", params.installDate);
  }
  if (params?.page !== undefined) {
    queryParams.append("page", params.page.toString());
  }
  if (params?.size !== undefined) {
    queryParams.append("size", params.size.toString());
  }

  const url = `${API_BASE_URL}/inkjet-printer${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // 토큰이 있으면 Authorization 헤더에 추가
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `설비 목록 조회 실패: ${response.status} ${response.statusText}`
    );
  }

  const data: ApiResponse<GetInkjetPrintersResponse> = await response.json();
  return data;
}

// 설비 등록 요청 타입
export interface CreateInkjetPrinterRequest {
  modelName: string;
  printerName: string;
  installDate: string; // YYYY-MM-DD 형식
  cpu: string;
  gpu: string;
  ram: string;
  vram: string;
  printerStatus: string; // "BROKEN" | "UNDER_REPAIR" | "OPERATIONAL"
  processStatus: string; // "WAITING" | "RUNNING"
  canvasX: number;
  canvasY: number;
}

// 설비 수정 요청 타입
export interface UpdateInkjetPrinterRequest {
  modelName: string;
  printerName: string;
  cpu: string;
  gpu: string;
  ram: string;
  vram: string;
  printerStatus: string; // "BROKEN" | "UNDER_REPAIR" | "OPERATIONAL"
  canvasX: number;
  canvasY: number;
}

/**
 * 잉크젯 설비 등록 API 호출
 * @param data 설비 등록 요청 데이터
 * @returns 설비 등록 응답 데이터
 */
export async function createInkjetPrinter(
  data: CreateInkjetPrinterRequest
): Promise<ApiResponse<null>> {
  const accessToken = localStorage.getItem("accessToken");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // 토큰이 있으면 Authorization 헤더에 추가
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}/inkjet-printer`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `설비 등록 실패: ${response.status} ${response.statusText}`
    );
  }

  const result: ApiResponse<null> = await response.json();
  return result;
}

/**
 * 잉크젯 설비 상세 조회 API 호출
 * @param inkjetUuid 설비 UUID
 * @returns 설비 상세 정보 응답 데이터
 */
export async function getInkjetPrinterDetail(
  inkjetUuid: string
): Promise<ApiResponse<InkjetPrinterDetail>> {
  const accessToken = localStorage.getItem("accessToken");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // 토큰이 있으면 Authorization 헤더에 추가
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}/inkjet-printer/${inkjetUuid}`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `설비 상세 조회 실패: ${response.status} ${response.statusText}`
    );
  }

  const data: ApiResponse<InkjetPrinterDetail> = await response.json();
  return data;
}

/**
 * 잉크젯 설비 삭제 API 호출
 * @param inkjetUuid 설비 UUID
 * @returns 삭제 성공 여부
 */
export async function deleteInkjetPrinter(
  inkjetUuid: string
): Promise<void> {
  const accessToken = localStorage.getItem("accessToken");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // 토큰이 있으면 Authorization 헤더에 추가
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}/inkjet-printer/${inkjetUuid}`, {
    method: "DELETE",
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `설비 삭제 실패: ${response.status} ${response.statusText}`
    );
  }

  // 204 No Content 응답이므로 body가 없음
  return;
}

/**
 * 잉크젯 설비 수정 API 호출
 * @param inkjetUuid 설비 UUID
 * @param data 설비 수정 요청 데이터
 * @returns 수정 성공 여부
 */
export async function updateInkjetPrinter(
  inkjetUuid: string,
  data: UpdateInkjetPrinterRequest
): Promise<void> {
  const accessToken = localStorage.getItem("accessToken");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // 토큰이 있으면 Authorization 헤더에 추가
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}/inkjet-printer/${inkjetUuid}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `설비 수정 실패: ${response.status} ${response.statusText}`
    );
  }

  // 204 No Content 응답이므로 body가 없음
  return;
}

// 작업 내역 조회 요청 파라미터
export interface GetInkjetJobsParams {
  page?: number;
  size?: number;
}

// 작업 내역 항목
export interface InkjetJob {
  jobUuid: string;
  tiffImageUrl: string;
  requestedAt: string; // ISO 8601 형식
  completedAt: string; // ISO 8601 형식
  sheetCount: number;
}

// 작업 내역 조회 응답 타입
export interface GetInkjetJobsResponse {
  inkjetUuid: string;
  printerName: string;
  modelName: string;
  content: {
    content: InkjetJob[];
    pagination: PaginationInfo;
  };
}

// 잉크젯 설비 가동 응답 타입
export interface StartInkjetPrinterResponse {
  jobHistoryUuid: string;
}

/**
 * 잉크젯 설비 가동 (POST /inkjet-printer/{inkjetUuid})
 * tiffUrl, sheetCount는 백엔드에서 사용하지 않으므로 임의 값 전송
 */
export async function startInkjetPrinter(
  inkjetUuid: string,
): Promise<ApiResponse<StartInkjetPrinterResponse>> {
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem("accessToken") : null;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}/inkjet-printer/${inkjetUuid}`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      tiffUrl: "about:blank",
      sheetCount: 0,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `설비 가동 실패: ${response.status} ${response.statusText}`
    );
  }

  const data: ApiResponse<StartInkjetPrinterResponse> = await response.json();
  return data;
}

/**
 * 잉크젯 설비 가동 완료 (PATCH /inkjet-printer/{inkjetUuid}/jobs/{jobHistoryUuid})
 * 204 No Content
 */
export async function completeInkjetJob(
  inkjetUuid: string,
  jobHistoryUuid: string,
): Promise<void> {
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem("accessToken") : null;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}/inkjet-printer/${inkjetUuid}/jobs/${jobHistoryUuid}`, {
    method: "PATCH",
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `설비 가동 완료 실패: ${response.status} ${response.statusText}`
    );
  }

  return;
}

/**
 * 잉크젯 설비별 작업 내역 조회 API 호출
 * @param inkjetUuid 설비 UUID
 * @param params 조회 파라미터
 * @returns 작업 내역 조회 응답 데이터
 */
export async function getInkjetJobs(
  inkjetUuid: string,
  params?: GetInkjetJobsParams
): Promise<ApiResponse<GetInkjetJobsResponse>> {
  const accessToken = localStorage.getItem("accessToken");

  // Query 파라미터 구성
  const queryParams = new URLSearchParams();
  if (params?.page !== undefined) {
    queryParams.append("page", params.page.toString());
  }
  if (params?.size !== undefined) {
    queryParams.append("size", params.size.toString());
  }

  const url = `${API_BASE_URL}/inkjet-printer/${inkjetUuid}/jobs${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // 토큰이 있으면 Authorization 헤더에 추가
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `작업 내역 조회 실패: ${response.status} ${response.statusText}`
    );
  }

  const data: ApiResponse<GetInkjetJobsResponse> = await response.json();
  return data;
}

// 일일 패널 생산량 응답 타입
export interface DailyProductionResponse {
  totalSheetCount: number;
  completedDate: string; // YYYY-MM-DD 형식
}

/**
 * 일일 패널 생산량 조회 API 호출
 * @returns 일일 패널 생산량 응답 데이터
 */
export async function getDailyProduction(): Promise<ApiResponse<DailyProductionResponse>> {
  const accessToken = localStorage.getItem("accessToken");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // 토큰이 있으면 Authorization 헤더에 추가
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}/inkjet-printer/daily-production`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `일일 패널 생산량 조회 실패: ${response.status} ${response.statusText}`
    );
  }

  const data: ApiResponse<DailyProductionResponse> = await response.json();
  return data;
}

// 잉크젯 설비 대기열 등록 요청 타입
export interface CreateInkjetJobRequest {
  createConvertRequests: Array<{
    bmpUrl: string;
    compressionTypeUuid: string;
    bmpVolume: number;
    bmpWidth: number;
    bmpHeight: number;
  }>;
}

/**
 * 잉크젯 설비 대기열 등록 API 호출
 * @param printerUuid 설비 UUID
 * @param data 대기열 등록 요청 데이터
 * @returns 대기열 등록 응답 데이터
 */
export async function createInkjetJob(
  printerUuid: string,
  data: CreateInkjetJobRequest
): Promise<ApiResponse<{}>> {
  const accessToken = localStorage.getItem("accessToken");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // 토큰이 있으면 Authorization 헤더에 추가
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}/inkjet-printer/${printerUuid}/jobs`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `잉크젯 설비 대기열 등록 실패: ${response.status} ${response.statusText}`
    );
  }

  const result: ApiResponse<{}> = await response.json();
  return result;
}

// 압축 완료 이벤트 응답 타입
export interface ConvertHistoryItemResponse {
  convertHistoryUuid: string;
  tiffName: string;
  processingUnit: string;
  compressionType: string;
  version: number;
  bmpVolume: number;
  tiffVolume: number;
  compressionRatio: number;
  userName: string;
  employeeNo: string;
  completedAt: string;
  elapsedTime: number;
  tiffUrl: string;
  compressionTime?: number;
}

// SSE 이벤트 데이터 타입
export interface InkjetSSEEventData {
  convertHistoryUuid?: string;
  tiffName?: string;
  bmpVolume?: number;
  tiffVolume?: number;
  compressionRatio?: number;
  userName?: string;
  employeeNo?: string;
  completedAt?: string;
  elapsedTime?: number;
  tiffUrl?: string;
  [key: string]: any;
}

// SSE 이벤트 핸들러 타입
export interface InkjetSSEEventHandlers {
  onCompressionComplete?: (data: ConvertHistoryItemResponse) => void;
  onCompressionFailed?: (data: Partial<ConvertHistoryItemResponse> & { message?: string }) => void;
  onError?: (error: Error) => void;
}

/**
 * 설비 대기열 압축 완료를 위한 SSE 구독 함수
 * @param handlers 이벤트 핸들러
 * @returns AbortController (연결 종료용)
 */
export function subscribeInkjetCompressionSSE(
  handlers: InkjetSSEEventHandlers
): AbortController {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://k13s404.p.ssafy.io:8443/api/v1";
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem("accessToken") : null;

  const abortController = new AbortController();
  let stopped = false;
  abortController.signal.addEventListener('abort', () => {
    stopped = true;
  });

  const headers: HeadersInit = {
    Accept: "text/event-stream",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const connect = () => {
    if (stopped) return;
    console.log('설비 대기열 SSE 연결 시도:', `${API_BASE_URL}/sse/subscribe`);
    fetch(`${API_BASE_URL}/sse/subscribe`, {
      method: "GET",
      headers,
      cache: "no-store",
      signal: abortController.signal,
    })
      .then(async (response) => {
        console.log('설비 대기열 SSE 응답 상태:', response.status, response.ok);
        if (!response.ok) {
          throw new Error(`SSE 연결 실패: ${response.status}`);
        }

        console.log('설비 대기열 SSE 연결 성공, 스트림 읽기 시작');
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("응답 본문을 읽을 수 없습니다.");
        }

        let buffer = "";
        let currentEventName = "";

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('설비 대기열 SSE 스트림 종료');
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            // event: 라인 처리 (이벤트 이름 파싱)
            if (line.startsWith("event:")) {
              currentEventName = line.slice(6).trim();
              continue;
            }

            // data: 라인 처리
            if (line.startsWith("data:")) {
              const dataContent = line.slice(5).trim();
              
              // 빈 데이터, 하트비트/타임아웃 메시지는 무시
              if (
                dataContent === "" ||
                dataContent === "ok" ||
                dataContent === "ping" ||
                dataContent === "{\"timeout\":0}" ||
                dataContent.includes("\"timeout\"")
              ) {
                currentEventName = "";
                continue;
              }
              
              try {
                const data: InkjetSSEEventData = JSON.parse(dataContent);
                
                // CONVERT_BMP_SUCCESS 이벤트 처리
                if (currentEventName === "CONVERT_BMP_SUCCESS" && handlers.onCompressionComplete) {
                  const convertHistoryData: ConvertHistoryItemResponse = {
                    convertHistoryUuid: data.convertHistoryUuid || "",
                    tiffName: data.tiffName || "",
                    processingUnit: data.processingUnit || "",
                    compressionType: data.compressionType || "",
                    version: data.version || 0,
                    bmpVolume: data.bmpVolume || 0,
                    tiffVolume: data.tiffVolume || 0,
                    compressionRatio: data.compressionRatio || 0,
                    userName: data.userName || "",
                    employeeNo: data.employeeNo || "",
                    completedAt: data.completedAt || "",
                    elapsedTime: data.elapsedTime || 0,
                    tiffUrl: data.tiffUrl || "",
                  compressionTime: (data as any).compressionTime ?? undefined,
                  };
                  
                  console.log('설비 대기열 압축 완료 이벤트 수신:', convertHistoryData);
                  handlers.onCompressionComplete(convertHistoryData);
                }

                // CONVERT_BMP_FAILED 이벤트 처리
                if (currentEventName === "CONVERT_BMP_FAILED" && handlers.onCompressionFailed) {
                  const failedData: Partial<ConvertHistoryItemResponse> & { message?: string } = {
                    convertHistoryUuid: data.convertHistoryUuid,
                    tiffName: data.tiffName,
                    processingUnit: data.processingUnit,
                    compressionType: data.compressionType,
                    version: data.version,
                    bmpVolume: data.bmpVolume,
                    tiffVolume: data.tiffVolume,
                    compressionRatio: data.compressionRatio,
                    userName: data.userName,
                    employeeNo: data.employeeNo,
                    completedAt: data.completedAt,
                    elapsedTime: data.elapsedTime,
                    tiffUrl: data.tiffUrl,
                    message: typeof data.message === 'string' ? data.message : undefined,
                  };
                  console.warn('설비 대기열 압축 실패 이벤트 수신:', failedData);
                  handlers.onCompressionFailed(failedData);
                }
                
                // 이벤트 이름 초기화
                currentEventName = "";
              } catch (error) {
                console.error("설비 대기열 SSE 메시지 파싱 오류:", error, "원본:", dataContent);
                currentEventName = "";
              }
            }
          }
        }
        // 스트림이 종료되면 자동 재시도
        if (!stopped) {
          setTimeout(connect, 1000);
        }
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error("설비 대기열 SSE 연결 오류:", error);
          if (handlers.onError) {
            handlers.onError(error);
          }
        }
        // 오류 시에도 자동 재시도
        if (!stopped) {
          setTimeout(connect, 1500);
        }
      });
  };

  // 최초 연결
  connect();

  return abortController;
}

