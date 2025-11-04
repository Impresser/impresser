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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://k13s404.p.ssafy.io/dev/api/v1";

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

