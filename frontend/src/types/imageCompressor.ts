// 압축 내역 API 요청 파라미터
export interface GetConvertHistoriesParams {
  page?: number;
  size?: number;
}

// 압축 내역 항목
export interface ConvertHistoryItem {
  convertHistoryUuid: string;
  tiffName: string;
  processingUnit: string;
  compressionType: string;
  version: number;
  bmpVolume: number;
  tiffVolume: number;
  compressionRatio: number;
  userName: string;
  completedAt: string; // ISO 8601 형식
  elapsedTime: number; // 초 단위
  tiffUrl: string;
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

// 압축 내역 조회 응답 타입
export interface GetConvertHistoriesResponse {
  content: ConvertHistoryItem[];
  pagination: PaginationInfo;
}

// 압축 알고리즘 조회 API 요청 파라미터
export interface GetCompressionTypesParams {
  processingUnit: string; // 'cpu' 또는 'gpu'
}

// 압축 알고리즘 항목
export interface CompressionTypeItem {
  compressionTypeUuid: string;
  type: string;
  processingUnit: string;
}

// 압축 알고리즘 조회 응답 타입
export interface GetCompressionTypesResponse {
  result: CompressionTypeItem[];
}

// 압축 방식 버전 조회 API 요청 파라미터
export interface GetCompressionTypeVersionsParams {
  compressionTypeUuid: string;
}

// 압축 방식 버전 항목
export interface CompressionTypeVersionItem {
  compressionTypeUuid: string;
  compressionType: string;
  version: number;
}

// 압축 방식 버전 조회 응답 타입
export interface GetCompressionTypeVersionsResponse {
  result: CompressionTypeVersionItem[];
}

// 압축 내역 상세 조회 응답 타입
export interface ConvertHistoryDetailItem {
  avgGpuUtilization: number;
  avgSpeed: number;
  maxSpeed: number;
  minSpeed: number;
  requestedAt: string; // ISO 8601 형식 (API: requestedAt)
  completedAt: string; // ISO 8601 형식
  elapsedTime?: number; // 초 단위 (있으면 사용)
  compressionTime?: number; // 초 단위 (옵션)
  sourceExtension: string;
  compressedExtension: string;
}

// 파일 정보 타입
export interface FileInfo {
  name: string;
  size: number;
  format: string;
  dimensions: { width: number; height: number };
  preview: string;
}

