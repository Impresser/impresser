import { ApiResponse } from "@/types/auth";

// 배치 멀티파트 업로드 초기화 요청 타입
export interface InitBatchMultipartUploadRequest {
  fileNames: string[];
}

// 업로드 아이템 정보 타입
export interface UploadItem {
  uploadId: string;
  objectName: string;
  fileName: string;
  savedFileName: string;
  imageUrl: string;
}

// 배치 멀티파트 업로드 초기화 응답 결과 타입
export interface InitBatchMultipartUploadResult {
  items: UploadItem[];
}

// 배치 멀티파트 업로드 초기화 응답 타입
export type InitBatchMultipartUploadResponse = ApiResponse<InitBatchMultipartUploadResult>;

// Presigned URL 배치 발급 요청 타입
export interface BatchPresignedUrlRequest {
  jobs: {
    objectName: string;
    uploadId: string;
    partCount: number;
  }[];
}

// Presigned URL 아이템 타입
export interface PresignedUrlItem {
  objectName: string;
  uploadId: string;
  urls: {
    urls: string[];
  };
  imageUrl: string;
}

// Presigned URL 배치 발급 응답 결과 타입
export interface BatchPresignedUrlResult {
  items: PresignedUrlItem[];
}

// Presigned URL 배치 발급 응답 타입
export type BatchPresignedUrlResponse = ApiResponse<BatchPresignedUrlResult>;

// 업로드된 파트 정보 타입
export interface UploadedPart {
  partNumber: number;
  eTag: string;
}

// 배치 멀티파트 업로드 완료 요청 타입
export interface CompleteBatchMultipartUploadRequest {
  items: {
    objectName: string;
    uploadId: string;
    parts: UploadedPart[];
  }[];
}

// 배치 멀티파트 업로드 완료 응답 결과 타입
export interface CompleteBatchMultipartUploadResult {
  succeededUploadIds: string[];
  failed: Record<string, string>;
}

// 배치 멀티파트 업로드 완료 응답 타입
export type CompleteBatchMultipartUploadResponse = ApiResponse<CompleteBatchMultipartUploadResult>;

// 이미지 업로드 상태 타입
export interface ImageUploadState {
  // 업로드 중인 파일 목록
  uploadingFiles: {
    fileName: string;
    progress: number;
    status: "pending" | "uploading" | "completed" | "error";
    uploadId?: string;
    objectName?: string;
    savedFileName?: string;
    imageUrl?: string;
    error?: string;
  }[];
  
  // 로딩 상태
  loading: boolean;
  
  // 에러 상태
  error: string | null;
}

