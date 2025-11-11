"use client";

import { create } from "zustand";
import { 
  initBatchMultipartUpload, 
  batchPresignedUrls,
  completeBatchMultipartUpload,
  uploadPartsInBatch,
  getPartCount 
} from "@/service/imageUpload";
import { UploadItem, PresignedUrlItem, UploadedPart } from "@/types/imageUpload";

// 업로드 중인 파일 정보 타입
export interface UploadingFile {
  fileName: string;
  fileSize?: number; // 파일 크기 (bytes)
  partCount?: number; // 파트 개수
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  uploadId?: string;
  objectName?: string;
  savedFileName?: string;
  imageUrl?: string;
  presignedUrls?: string[]; // Presigned URL 배열
  uploadedParts?: UploadedPart[]; // 업로드된 파트 정보 (partNumber, eTag)
  error?: string;
  // 업로드 진행 상태 추가
  estimatedTimeRemaining?: number; // 예상 남은 시간 (초)
  partProgress?: Record<number, number>; // 각 파트별 진행률 (partNumber -> progress 0-100) - 직렬화 가능한 형태
  uploadSpeed?: number; // 업로드 속도 (bytes/sec)
  startTime?: number; // 업로드 시작 시간 (timestamp)
}

type ImageUploadStore = {
  // 상태
  uploadingFiles: UploadingFile[];
  loading: boolean;
  error: string | null;

  // 액션
  initBatchUpload: (fileNames: string[]) => Promise<UploadItem[] | null>;
  getBatchPresignedUrls: (items: UploadItem[], fileSizes: Map<string, number>) => Promise<PresignedUrlItem[] | null>;
  uploadFileParts: (file: File, fileName: string, batchSize?: number, maxRetries?: number) => Promise<boolean>;
  completeBatchUpload: (items: { objectName: string; uploadId: string; fileName: string }[]) => Promise<string[] | null>;
  addUploadingFile: (fileName: string, fileSize?: number) => void;
  addUploadedPart: (fileName: string, part: UploadedPart) => void;
  updateUploadingFile: (
    fileName: string,
    updates: Partial<UploadingFile>
  ) => void;
  removeUploadingFile: (fileName: string) => void;
  clearUploadingFiles: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
};

export const useImageUploadStore = create<ImageUploadStore>((set, get) => ({
  uploadingFiles: [],
  loading: false,
  error: null,

  // 배치 업로드 초기화
  initBatchUpload: async (fileNames: string[]) => {
    set({ loading: true, error: null });
    try {
      const response = await initBatchMultipartUpload({ fileNames });
      
      if (response.isSuccess && response.result) {
        // 업로드 아이템 정보로 업로딩 파일 상태 업데이트
        const items = response.result.items;
        set((state) => {
          const updatedFiles = state.uploadingFiles.map((file) => {
            const item = items.find((item) => item.fileName === file.fileName);
            if (item) {
              return {
                ...file,
                uploadId: item.uploadId,
                objectName: item.objectName,
                savedFileName: item.savedFileName,
                imageUrl: item.imageUrl,
                status: "uploading" as const,
              };
            }
            return file;
          });
          return { uploadingFiles: updatedFiles, loading: false };
        });
        return items;
      } else {
        throw new Error(response.message || "배치 업로드 초기화에 실패했습니다.");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "배치 업로드 초기화 중 오류가 발생했습니다.";
      set({ error: errorMessage, loading: false });
      return null;
    }
  },

  // Presigned URL 배치 발급
  getBatchPresignedUrls: async (items: UploadItem[], fileSizes: Map<string, number>) => {
    set({ loading: true, error: null });
    try {
      // 각 아이템에 대해 partCount 계산
      const jobs = items.map((item) => {
        const fileSize = fileSizes.get(item.fileName) || 0;
        const partCount = getPartCount(fileSize);
        
        // 업로딩 파일 상태에 partCount 업데이트
        get().updateUploadingFile(item.fileName, { 
          partCount,
          fileSize 
        });
        
        return {
          objectName: item.objectName,
          uploadId: item.uploadId,
          partCount,
        };
      });

      const response = await batchPresignedUrls({ jobs });
      
      if (response.isSuccess && response.result) {
        const presignedItems = response.result.items;
        
        // Presigned URL 정보로 업로딩 파일 상태 업데이트
        set((state) => {
          const updatedFiles = state.uploadingFiles.map((file) => {
            const item = presignedItems.find(
              (item) => item.objectName === file.objectName && item.uploadId === file.uploadId
            );
            if (item) {
              return {
                ...file,
                presignedUrls: item.urls.urls,
                imageUrl: item.imageUrl,
              };
            }
            return file;
          });
          return { uploadingFiles: updatedFiles, loading: false };
        });
        
        return presignedItems;
      } else {
        throw new Error(response.message || "Presigned URL 배치 발급에 실패했습니다.");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Presigned URL 배치 발급 중 오류가 발생했습니다.";
      set({ error: errorMessage, loading: false });
      return null;
    }
  },

  // 파일 파트 병렬 업로드
  uploadFileParts: async (file: File, fileName: string, batchSize = 10, maxRetries = 3) => {
    const state = get();
    const uploadingFile = state.uploadingFiles.find((f) => f.fileName === fileName);
    
    if (!uploadingFile || !uploadingFile.presignedUrls || !uploadingFile.objectName) {
      set({ error: `${fileName}: 업로드 정보가 없습니다.` });
      return false;
    }

    // presignedUrls를 partNumber와 매핑
    const presignedUrlsWithPartNumber = uploadingFile.presignedUrls.map((url, index) => ({
      url,
      partNumber: index + 1, // partNumber는 1부터 시작
    }));

    try {
      set((state) => ({
        uploadingFiles: state.uploadingFiles.map((f) =>
          f.fileName === fileName
            ? { ...f, status: "uploading" as const }
            : f
        ),
      }));

      // 업로드 시작 시간 기록
      const uploadStartTime = Date.now();
      set((state) => ({
        uploadingFiles: state.uploadingFiles.map((f) =>
          f.fileName === fileName
            ? { ...f, status: "uploading" as const, startTime: uploadStartTime }
            : f
        ),
      }));

      const result = await uploadPartsInBatch({
        file,
        presignedUrls: presignedUrlsWithPartNumber,
        onProgress: (info) => {
          // Map을 객체로 변환하여 저장
          const partProgressObj: Record<number, number> = {};
          info.partProgress.forEach((value, key) => {
            partProgressObj[key] = value;
          });
          
          // 진행률 정보 업데이트
          get().updateUploadingFile(fileName, {
            progress: info.progress,
            estimatedTimeRemaining: info.estimatedTimeRemaining,
            partProgress: partProgressObj,
            uploadSpeed: info.uploadSpeed,
          });
        },
        batchSize,
        maxRetries,
      });

      // 성공한 파트들을 store에 추가
      result.successParts.forEach((part) => {
        get().addUploadedPart(fileName, {
          partNumber: part.partNumber,
          eTag: part.eTag,
        });
      });

      // 실패한 파트가 있으면 에러 처리
      if (result.failedParts.length > 0) {
        const errorMessage = `${fileName}: ${result.failedParts.length}개 파트 업로드 실패`;
        set((state) => ({
          uploadingFiles: state.uploadingFiles.map((f) =>
            f.fileName === fileName
              ? { ...f, status: "error" as const, error: errorMessage }
              : f
          ),
          error: errorMessage,
        }));
        return false;
      }

      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : `${fileName}: 업로드 중 오류가 발생했습니다.`;
      set((state) => ({
        uploadingFiles: state.uploadingFiles.map((f) =>
          f.fileName === fileName
            ? { ...f, status: "error" as const, error: errorMessage }
            : f
        ),
        error: errorMessage,
      }));
      return false;
    }
  },

  // 배치 업로드 완료
  completeBatchUpload: async (items: { objectName: string; uploadId: string; fileName: string }[]) => {
    set({ loading: true, error: null });
    try {
      // 각 파일의 업로드된 파트 정보 수집
      const state = get();
      const completeItems = items.map((item) => {
        const file = state.uploadingFiles.find((f) => 
          f.fileName === item.fileName && 
          f.objectName === item.objectName && 
          f.uploadId === item.uploadId
        );
        
        if (!file || !file.uploadedParts || file.uploadedParts.length === 0) {
          throw new Error(`${item.fileName}: 업로드된 파트 정보가 없습니다.`);
        }

        // partNumber 순서로 정렬
        const sortedParts = [...file.uploadedParts].sort((a, b) => a.partNumber - b.partNumber);

        return {
          objectName: item.objectName,
          uploadId: item.uploadId,
          parts: sortedParts,
        };
      });

      const response = await completeBatchMultipartUpload({ items: completeItems });
      
      if (response.isSuccess && response.result) {
        const succeededUploadIds = response.result.succeededUploadIds;
        
        // 성공한 업로드의 상태를 completed로 업데이트
        set((state) => {
          const updatedFiles = state.uploadingFiles.map((file) => {
            if (file.uploadId && succeededUploadIds.includes(file.uploadId)) {
              return {
                ...file,
                status: "completed" as const,
                progress: 100,
              };
            }
            return file;
          });
          return { uploadingFiles: updatedFiles, loading: false };
        });
        
        return succeededUploadIds;
      } else {
        throw new Error(response.message || "배치 업로드 완료에 실패했습니다.");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "배치 업로드 완료 중 오류가 발생했습니다.";
      set({ error: errorMessage, loading: false });
      return null;
    }
  },

  // 업로딩 파일 추가
  addUploadingFile: (fileName: string, fileSize?: number) => {
    set((state) => {
      // 이미 존재하는 파일이면 추가하지 않음
      if (state.uploadingFiles.some((file) => file.fileName === fileName)) {
        return state;
      }
      
      const partCount = fileSize ? getPartCount(fileSize) : undefined;
      
      return {
        uploadingFiles: [
          ...state.uploadingFiles,
          {
            fileName,
            fileSize,
            partCount,
            progress: 0,
            status: "pending",
            uploadedParts: [],
          },
        ],
      };
    });
  },

  // 업로드된 파트 추가
  addUploadedPart: (fileName: string, part: UploadedPart) => {
    set((state) => ({
      uploadingFiles: state.uploadingFiles.map((file) => {
        if (file.fileName === fileName) {
          const existingParts = file.uploadedParts || [];
          // 이미 같은 partNumber가 있으면 업데이트, 없으면 추가
          const partIndex = existingParts.findIndex((p) => p.partNumber === part.partNumber);
          const updatedParts = partIndex >= 0
            ? existingParts.map((p, idx) => idx === partIndex ? part : p)
            : [...existingParts, part];
          
          // 진행률 계산
          const partCount = file.partCount || 1;
          const progress = Math.min(Math.round((updatedParts.length / partCount) * 100), 100);
          
          return {
            ...file,
            uploadedParts: updatedParts,
            progress,
          };
        }
        return file;
      }),
    }));
  },

  // 업로딩 파일 업데이트
  updateUploadingFile: (fileName: string, updates: Partial<UploadingFile>) => {
    set((state) => ({
      uploadingFiles: state.uploadingFiles.map((file) =>
        file.fileName === fileName ? { ...file, ...updates } : file
      ),
    }));
  },

  // 업로딩 파일 제거
  removeUploadingFile: (fileName: string) => {
    set((state) => ({
      uploadingFiles: state.uploadingFiles.filter(
        (file) => file.fileName !== fileName
      ),
    }));
  },

  // 모든 업로딩 파일 제거
  clearUploadingFiles: () => {
    set({ uploadingFiles: [] });
  },

  // 로딩 상태 설정
  setLoading: (loading: boolean) => set({ loading }),

  // 에러 상태 설정
  setError: (error: string | null) => set({ error }),
}));

