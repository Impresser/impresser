// BMP 패턴 생성 API 요청 타입
export interface CreateBmpPatternRequest {
  bmpWidth: number;
  bmpHeight: number;
  bmpVolume: number;
  redCountX: number;
  redCountY: number;
  redSizeX: number;
  redSizeY: number;
  redGapX: number;
  redGapY: number;
  greenCountX: number;
  greenCountY: number;
  greenSizeX: number;
  greenSizeY: number;
  greenGapX: number;
  greenGapY: number;
  blueCountX: number;
  blueCountY: number;
  blueSizeX: number;
  blueSizeY: number;
  blueGapX: number;
  blueGapY: number;
  rgGapX: number;
  rgGapY: number;
  gbGapX: number;
  gbGapY: number;
}

// BMP 패턴 생성 API 응답 결과 타입
export interface CreateBmpPatternResult {
  generationUuid: string;
  requestedAt: string;
}

// BMP 목록 조회 API 응답 항목 타입
export interface BmpListItem {
  generationUuid: string;
  bmpUrl: string;
  userName: string;
  bmpHeight: number;
  bmpWidth: number;
  requestedAt: string;
  completedAt: string;
  isGenerated: boolean;
}

// BMP 목록 조회 API 응답 결과 타입
export interface GetBmpListResult {
  content: BmpListItem[];
  pagination: {
    page: number;
    size: number;
    totalPages: number;
    totalElements: number;
    first: boolean;
    last: boolean;
    hasNext: boolean;
  };
}

// BMP 상세 조회 API 응답 결과 타입
export interface BmpDetailResult {
  generationUuid: string;
  bmpUrl: string;
  requestedAt: string;
  completedAt: string;
  bmpWidth: number;
  bmpHeight: number;
  bmpVolume: number;
  isGenerated: boolean;
  redCountX: number;
  redCountY: number;
  redSizeX: number;
  redSizeY: number;
  redGapX: number;
  redGapY: number;
  greenCountX: number;
  greenCountY: number;
  greenSizeX: number;
  greenSizeY: number;
  greenGapX: number;
  greenGapY: number;
  blueCountX: number;
  blueCountY: number;
  blueSizeX: number;
  blueSizeY: number;
  blueGapX: number;
  blueGapY: number;
  rgGapX: number;
  rgGapY: number;
  gbGapX: number;
  gbGapY: number;
}

