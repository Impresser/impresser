import { ApiResponse } from "@/types/auth";
import { 
  GetConvertHistoriesParams, 
  GetConvertHistoriesResponse,
  GetCompressionTypesParams,
  CompressionTypeItem,
  GetCompressionTypeVersionsParams,
  CompressionTypeVersionItem,
  ConvertHistoryDetailItem
} from "@/types/imageCompressor";
import { fetchWithAuth } from "@/utils/fetchWithAuth";

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

