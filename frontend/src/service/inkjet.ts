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

