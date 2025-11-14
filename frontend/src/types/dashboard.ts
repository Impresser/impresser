export interface DashboardRankItem {
  compressionType: string; // 예: LZW, PackBits, Deflate
  processingUnit: "GPU" | "CPU" | string;
  version: number; // API 응답은 number 타입
  avgSpeed: number; // MB/s - API에서 받아온 평균 압축 속도 값
  compressionTypeUuid?: string; // 상세 조회용 UUID
}

export interface PaginationInfo {
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
  hasNext: boolean;
}

export interface GetDashboardRanksResult {
  content: DashboardRankItem[];
  pagination: PaginationInfo;
}

// UI 표시용 가공 타입들 (컴포넌트에서 공통 사용)
export interface AlgorithmPerf {
  key: string;
  label: string;
  avgSpeedMBps: number;
  version: string;
  mode: "GPU" | "CPU";
  originalItem?: DashboardRankItem; // 원본 아이템 참조
}

export interface JobDetailRow {
  id: number;
  name: string;
  mode: "GPU" | "CPU";
  algorithm: string;
  version: string;
  size: string;
  owner: string;
  startedAt: string;
  finishedAt: string;
  elapsedTime: string; // 소요시간
  inputFormat: string;
  outputFormat: string;
  avgGpuUtilPercent: number;
  avgSpeedMBps: number;
  maxSpeedMBps: number;
  minSpeedKBps: number;
  convertHistoryUuid?: string; // 작업 상세 조회용 UUID
}

// 상세 조회 API 응답 타입
export interface ConvertDetailItem {
  convertHistoryUuid: string;
  tiffUrl: string | null;
  compressionType: string;
  processingUnit: string;
  version: number;
  tiffVolume: number;
  bmpVolume: number;
  userName: string;
  avgSpeed: number;
  elapsedTime: number;
}

export interface GetConvertDetailResult {
  content: ConvertDetailItem[];
  pagination: PaginationInfo;
}

// 작업 상세 조회 API 응답 타입
export interface ConvertHistoryDetailResult {
  avgGpuUtilization: number;
  avgSpeed: number;
  maxSpeed: number;
  minSpeed: number;
  requestAt: string;
  completedAt: string;
  sourceExtension: string;
  compressedExtension: string;
  compressionTime: number;
  elapsedTime: number;
}

// 설비 이용 시간 API 응답 타입
export interface UsageDay {
  dayOfWeek: string;
  usageHours: number;
}

export interface UsageWeek {
  label: string;
  days: UsageDay[];
}

export interface GetEquipmentUsageResult {
  previousWeek: UsageWeek;
  currentWeek: UsageWeek;
}



