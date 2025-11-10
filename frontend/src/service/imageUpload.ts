import { ApiResponse } from "@/types/auth";
import {
  InitBatchMultipartUploadRequest,
  InitBatchMultipartUploadResponse,
  BatchPresignedUrlRequest,
  BatchPresignedUrlResponse,
  CompleteBatchMultipartUploadRequest,
  CompleteBatchMultipartUploadResponse,
} from "@/types/imageUpload";
import pLimit from "p-limit";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://k13s404.p.ssafy.io:8443/api/v1";

/**
 * 배치 멀티파트 업로드 초기화 API 호출
 * @param request 업로드할 파일명 목록
 * @returns 배치 멀티파트 업로드 초기화 응답 데이터
 */
export async function initBatchMultipartUpload(
  request: InitBatchMultipartUploadRequest
): Promise<InitBatchMultipartUploadResponse> {
  const accessToken = localStorage.getItem("accessToken");

  const url = `${API_BASE_URL}/s3/bmp/init-batch`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // 토큰이 있으면 Authorization 헤더에 추가
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `배치 멀티파트 업로드 초기화 실패: ${response.status} ${response.statusText}`
    );
  }

  const data: InitBatchMultipartUploadResponse = await response.json();
  return data;
}

/**
 * Presigned URL 배치 발급 API 호출
 * @param request 업로드 작업 정보 (objectName, uploadId, partCount)
 * @returns Presigned URL 배치 발급 응답 데이터
 */
export async function batchPresignedUrls(
  request: BatchPresignedUrlRequest
): Promise<BatchPresignedUrlResponse> {
  const accessToken = localStorage.getItem("accessToken");

  const url = `${API_BASE_URL}/s3/bmp/urls-batch`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // 토큰이 있으면 Authorization 헤더에 추가
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Presigned URL 배치 발급 실패: ${response.status} ${response.statusText}`
    );
  }

  const data: BatchPresignedUrlResponse = await response.json();
  return data;
}

/**
 * 파일 크기에 따른 청크 크기 계산
 * @param fileSize 파일 크기 (bytes)
 * @returns 청크 크기 (bytes)
 */
export function getChunkSize(fileSize: number): number {
  const MB = 1024 * 1024;
  const sizeMB = fileSize / MB;

  if (sizeMB < 1024) return 5 * MB; // 1GB 미만
  if (sizeMB < 1536) return 10 * MB; // 1~1.5GB
  if (sizeMB < 2048) return 15 * MB; // 1.5~2GB
  return 20 * MB; // 2GB 이상
}

/**
 * 파일 크기에 따른 파트 개수 계산
 * @param fileSize 파일 크기 (bytes)
 * @returns 파트 개수
 */
export function getPartCount(fileSize: number): number {
  const chunkSize = getChunkSize(fileSize);
  return Math.ceil(fileSize / chunkSize);
}

/**
 * 배치 멀티파트 업로드 완료 API 호출
 * @param request 업로드 완료 정보 (objectName, uploadId, parts)
 * @returns 배치 멀티파트 업로드 완료 응답 데이터
 */
export async function completeBatchMultipartUpload(
  request: CompleteBatchMultipartUploadRequest
): Promise<CompleteBatchMultipartUploadResponse> {
  const accessToken = localStorage.getItem("accessToken");

  const url = `${API_BASE_URL}/s3/bmp/complete-batch`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // 토큰이 있으면 Authorization 헤더에 추가
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `배치 멀티파트 업로드 완료 실패: ${response.status} ${response.statusText}`
    );
  }

  const data: CompleteBatchMultipartUploadResponse = await response.json();
  return data;
}

/**
 * 업로드 결과 타입
 */
export interface UploadPartResult {
  partNumber: number;
  eTag: string;
}

export interface UploadPartsResult {
  successParts: UploadPartResult[];
  failedParts: Array<{ partNumber: number; error: Error }>;
}

/**
 * 이미지 멀티파트 병렬 업로드 (ETag 수집 + 진행률 + 재시도 포함)
 * @param file 업로드할 파일
 * @param presignedUrls S3에서 받은 presigned URL 목록 (partNumber와 매핑)
 * @param onProgress 진행률 콜백 (0~100)
 * @param batchSize 동시 업로드 개수 (기본 10)
 * @param maxRetries 각 part 재시도 횟수 (기본 3)
 * @returns 업로드 성공/실패 결과
 */
export async function uploadPartsInBatch({
  file,
  presignedUrls,
  onProgress = () => {},
  batchSize = 20,
  maxRetries = 3,
}: {
  file: File;
  presignedUrls: Array<{ url: string; partNumber: number }>;
  onProgress?: (progress: number) => void;
  batchSize?: number;
  maxRetries?: number;
}): Promise<UploadPartsResult> {
  const chunkSize = getChunkSize(file.size);
  const chunks: Blob[] = [];
  let start = 0;

  // 파일을 청크로 분할
  while (start < file.size) {
    const end = Math.min(start + chunkSize, file.size);
    chunks.push(file.slice(start, end));
    start = end;
  }

  const total = chunks.length;
  let completed = 0;
  const limit = pLimit(batchSize);

  // 개별 part 업로드 (재시도 + ETag 수집)
  async function uploadPart({
    url,
    partNumber,
    chunk,
  }: {
    url: string;
    partNumber: number;
    chunk: Blob;
  }): Promise<UploadPartResult> {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        const res = await fetch(url, { method: 'PUT', body: chunk });

        if (!res.ok) {
          throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
        }

        const etag = res.headers.get('ETag')?.replace(/"/g, '');
        if (!etag) {
          throw new Error('ETag not found in response');
        }

        completed += 1;
        onProgress(Math.round((completed / total) * 100));

        return { partNumber, eTag: etag };
      } catch (err) {
        attempt++;
        if (attempt >= maxRetries) {
          throw err;
        }
        console.warn(
          `Part ${partNumber} 실패 (${attempt}/${maxRetries}) → 재시도 중...`
        );
        // 지수적 대기
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
    throw new Error('Max retries exceeded');
  }

  // 병렬 업로드 실행
  const uploadTasks = presignedUrls.map(({ url, partNumber }, index) =>
    limit(() =>
      uploadPart({
        url,
        partNumber,
        chunk: chunks[index],
      })
    )
  );

  const results = await Promise.allSettled(uploadTasks);

  // 성공한 part만 필터링 + 정렬
  const successParts: UploadPartResult[] = results
    .filter((r): r is PromiseFulfilledResult<UploadPartResult> => r.status === 'fulfilled')
    .map((r) => r.value)
    .sort((a, b) => a.partNumber - b.partNumber);

  // 실패한 조각 확인
  const failedParts = results
    .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    .map((r, index) => ({
      partNumber: presignedUrls[index].partNumber,
      error: r.reason instanceof Error ? r.reason : new Error(String(r.reason)),
    }));

  if (failedParts.length > 0) {
    console.error(`❌ 실패한 파트 ${failedParts.length}개 존재`);
  }

  return { successParts, failedParts };
}

