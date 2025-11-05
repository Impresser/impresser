import { ApiResponse } from "@/types/auth";
import { GetDashboardRanksResult, GetConvertDetailResult, GetEquipmentUsageResult, ConvertHistoryDetailResult } from "@/types/dashboard";
import { fetchWithAuth } from "@/utils/fetchWithAuth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://k13s404.p.ssafy.io:8443/api/v1";

export async function getDashboardConvertRanks(
  params?: { page?: number; size?: number }
): Promise<ApiResponse<GetDashboardRanksResult>> {
  const queryParams = new URLSearchParams();
  if (params?.page !== undefined) queryParams.append("page", String(params.page));
  if (params?.size !== undefined) queryParams.append("size", String(params.size));

  const url = `${API_BASE_URL}/dashboard/convert/ranks${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  const response = await fetchWithAuth(url, { method: "GET" });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `순위 조회 실패: ${response.status} ${response.statusText}`);
  }
  const data: ApiResponse<GetDashboardRanksResult> = await response.json();
  return data;
}

export async function getDashboardConvertDetail(
  compressionTypeUuid: string,
  params?: { page?: number; size?: number }
): Promise<ApiResponse<GetConvertDetailResult>> {
  const queryParams = new URLSearchParams();
  if (params?.page !== undefined) queryParams.append("page", String(params.page));
  if (params?.size !== undefined) queryParams.append("size", String(params.size));

  const url = `${API_BASE_URL}/dashboard/convert/${compressionTypeUuid}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  const response = await fetchWithAuth(url, { method: "GET" });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `상세 조회 실패: ${response.status} ${response.statusText}`);
  }
  const data: ApiResponse<GetConvertDetailResult> = await response.json();
  return data;
}

export async function getEquipmentUsage(): Promise<ApiResponse<GetEquipmentUsageResult>> {
  const url = `${API_BASE_URL}/dashboard/inkjet/usage`;

  const response = await fetchWithAuth(url, { method: "GET" });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `설비 이용 시간 조회 실패: ${response.status} ${response.statusText}`);
  }
  const data: ApiResponse<GetEquipmentUsageResult> = await response.json();
  return data;
}

export async function getDashboardConvertHistoryDetail(
  convertHistoryUuid: string
): Promise<ApiResponse<ConvertHistoryDetailResult>> {
  const url = `${API_BASE_URL}/dashboard/convert/detail/${convertHistoryUuid}`;

  const response = await fetchWithAuth(url, { method: "GET" });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `작업 상세 조회 실패: ${response.status} ${response.statusText}`);
  }
  const data: ApiResponse<ConvertHistoryDetailResult> = await response.json();
  return data;
}




