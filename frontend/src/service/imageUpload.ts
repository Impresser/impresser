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
 */
export async function initBatchMultipartUpload(
  request: InitBatchMultipartUploadRequest
): Promise<InitBatchMultipartUploadResponse> {
  const accessToken = localStorage.getItem("accessToken");

  const url = `${API_BASE_URL}/s3/bmp/init-batch`;

  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

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
 */
export async function batchPresignedUrls(
  request: BatchPresignedUrlRequest
): Promise<BatchPresignedUrlResponse> {
  const accessToken = localStorage.getItem("accessToken");

  const url = `${API_BASE_URL}/s3/bmp/urls-batch`;

  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

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
 * ✅ 2GB 파일을 32조각으로 나누기 위한 청크 크기 계산
 */
export function getChunkSize(fileSize: number): number {
  const partCount = 20; // 고정 32조각
  return Math.ceil(fileSize / partCount);
}

/**
 * ✅ 파일 크기에 관계없이 항상 32조각
 */
export function getPartCount(fileSize: number): number {
  return 20;
}

/**
 * 배치 멀티파트 업로드 완료 API 호출
 */
export async function completeBatchMultipartUpload(
  request: CompleteBatchMultipartUploadRequest
): Promise<CompleteBatchMultipartUploadResponse> {
  const accessToken = localStorage.getItem("accessToken");

  const url = `${API_BASE_URL}/s3/bmp/complete-batch`;

  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

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
 * 진행률 정보 타입
 */
export interface ProgressInfo {
  progress: number;
  completedParts: number;
  totalParts: number;
  partProgress: Map<number, number>;
  uploadSpeed: number;
  estimatedTimeRemaining: number;
}

/**
 * 이미지 멀티파트 병렬 업로드
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
  onProgress?: (info: ProgressInfo) => void;
  batchSize?: number;
  maxRetries?: number;
}): Promise<UploadPartsResult> {
  const chunkSize = getChunkSize(file.size);
  const chunks: Blob[] = [];
  let start = 0;

  // ✅ 32조각으로 분할
  while (start < file.size) {
    const end = Math.min(start + chunkSize, file.size);
    chunks.push(file.slice(start, end));
    start = end;
  }

  const total = chunks.length;
  let completed = 0;
  const limit = pLimit(batchSize);

  const partProgressMap = new Map<number, number>();
  const partBytesUploaded = new Map<number, number>();
  const startTime = Date.now();
  let lastProgressUpdate = startTime;
  let lastTotalBytesUploaded = 0;

  const updateProgress = (partNumber: number, bytesUploaded: number, chunkSize: number) => {
    const partProgress = Math.min(100, Math.round((bytesUploaded / chunkSize) * 100));
    partProgressMap.set(partNumber, partProgress);
    partBytesUploaded.set(partNumber, bytesUploaded);

    let totalProgress = 0;
    let totalBytesUploaded = 0;
    for (let i = 0; i < total; i++) {
      const partNum = i + 1;
      const progress = partProgressMap.get(partNum) || 0;
      totalProgress += progress;
      totalBytesUploaded += partBytesUploaded.get(partNum) || 0;
    }

    const overallProgress = Math.min(100, Math.round(totalProgress / total));
    const now = Date.now();
    const timeElapsed = (now - lastProgressUpdate) / 1000;
    if (timeElapsed >= 0.5) {
      const bytesDiff = totalBytesUploaded - lastTotalBytesUploaded;
      const speed = timeElapsed > 0 ? bytesDiff / timeElapsed : 0;
      lastProgressUpdate = now;
      lastTotalBytesUploaded = totalBytesUploaded;

      const remainingBytes = file.size - totalBytesUploaded;
      const estimatedTimeRemaining = speed > 0 ? Math.ceil(remainingBytes / speed) : 0;

      onProgress({
        progress: overallProgress,
        completedParts: completed,
        totalParts: total,
        partProgress: new Map(partProgressMap),
        uploadSpeed: speed,
        estimatedTimeRemaining,
      });
    }
  };

  // ✅ XMLHttpRequest로 각 파트 업로드 (ETag 추출 + 재시도 포함)
  async function uploadPart({
    url,
    partNumber,
    chunk,
  }: {
    url: string;
    partNumber: number;
    chunk: Blob;
  }): Promise<UploadPartResult> {
    const chunkSize = chunk.size;
    partBytesUploaded.set(partNumber, 0);

    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        return await new Promise<UploadPartResult>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const bytesUploaded = e.loaded;
              partBytesUploaded.set(partNumber, bytesUploaded);
              updateProgress(partNumber, bytesUploaded, chunkSize);
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const etag = xhr.getResponseHeader("ETag")?.replace(/"/g, "");
              if (!etag) {
                reject(new Error("ETag not found in response"));
                return;
              }

              completed += 1;
              partProgressMap.set(partNumber, 100);
              onProgress({
                progress: Math.round((completed / total) * 100),
                completedParts: completed,
                totalParts: total,
                partProgress: new Map(partProgressMap),
                uploadSpeed: 0,
                estimatedTimeRemaining: 0,
              });

              resolve({ partNumber, eTag: etag });
            } else {
              reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
            }
          });

          xhr.addEventListener("error", () => reject(new Error("Network error")));
          xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));

          xhr.open("PUT", url);
          xhr.send(chunk);
        });
      } catch (err) {
        attempt++;
        if (attempt >= maxRetries) throw err;
        console.warn(`⚠️ Part ${partNumber} 실패 (${attempt}/${maxRetries}) 재시도 중...`);
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
    throw new Error("Max retries exceeded");
  }

  // 병렬 업로드 실행
  const uploadTasks = presignedUrls.map(({ url, partNumber }, index) =>
    limit(() => uploadPart({ url, partNumber, chunk: chunks[index] }))
  );

  const results = await Promise.allSettled(uploadTasks);

  const successParts: UploadPartResult[] = results
    .filter((r): r is PromiseFulfilledResult<UploadPartResult> => r.status === "fulfilled")
    .map((r) => r.value)
    .sort((a, b) => a.partNumber - b.partNumber);

  const failedParts = results
    .filter((r): r is PromiseRejectedResult => r.status === "rejected")
    .map((r, index) => ({
      partNumber: presignedUrls[index].partNumber,
      error: r.reason instanceof Error ? r.reason : new Error(String(r.reason)),
    }));

  if (failedParts.length > 0) {
    console.error(`❌ 실패한 파트 ${failedParts.length}개 존재`);
  }

  return { successParts, failedParts };
}
