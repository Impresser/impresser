'use client';

import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import type { FileInfo } from '@/types/imageCompressor';
import CommonButton from '@/components/ui/CommonButton';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import CommonTableFrame from '@/components/ui/CommonTableFrame';
import { useImageUploadStore } from '@/store/imageUploadStore';
import { getCompressionTypes, getCompressionTypeVersions } from '@/service/imageCompressor';
import type { CompressionTypeItem, CompressionTypeVersionItem } from '@/types/imageCompressor';

interface FacilityFileUploadProps {
  settings: {
    processingMethod: 'cpu' | 'gpu';
    algorithm: string;
    version: string;
  };
  onSubmit?: (payload: {
    files: File[];
    processingMethod: string;
    algorithm: string;
    version: string;
    fileInfos?: Array<{
      fileName: string;
      imageUrl: string;
      compressionTypeUuid: string;
      bmpVolume: number;
      bmpWidth: number;
      bmpHeight: number;
      algorithm: string;
      version: string;
      processingMethod: string;
    }>;
  }) => void;
  submitLabel?: string;
  skipAlgorithmCheck?: boolean; // 알고리즘/버전 체크 건너뛰기 (공통 업로드용)
}

interface UploadEntry {
  file: File;
  info: FileInfo;
}

interface FileWithUpload extends FileInfo {
  file?: File;
  uploadStatus?: 'pending' | 'uploading' | 'completed' | 'error';
  uploadProgress?: number;
  uploadError?: string;
  estimatedTimeRemaining?: number;
  partProgress?: Record<number, number>;
  uploadSpeed?: number;
  partCount?: number;
  startTime?: number;
}

const readBmpDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const view = new DataView(arrayBuffer);
        const signature = String.fromCharCode(view.getUint8(0), view.getUint8(1));
        if (signature !== 'BM') {
          reject(new Error('유효하지 않은 BMP 파일입니다.'));
          return;
        }
        const width = view.getInt32(18, true);
        const height = view.getInt32(22, true);
        resolve({ width: Math.abs(width), height: Math.abs(height) });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.readAsArrayBuffer(file.slice(0, 26));
  });
};

const createPreview = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    if (file.size > 10 * 1024 * 1024) {
      resolve('');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(e.target?.result as string);
      img.onerror = () => resolve('');
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export default function FacilityFileUpload({ settings, onSubmit, submitLabel = '대기열 추가', skipAlgorithmCheck = false }: FacilityFileUploadProps) {
  const [uploads, setUploads] = useState<UploadEntry[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'images'>('list');
  const [filesWithUpload, setFilesWithUpload] = useState<FileWithUpload[]>([]);
  const [expandedPartProgress, setExpandedPartProgress] = useState<Set<string>>(new Set());
  const [, setTick] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileMapRef = useRef<Map<string, File>>(new Map());

  const {
    uploadingFiles,
    initBatchUpload,
    getBatchPresignedUrls,
    uploadFileParts,
    completeBatchUpload,
    addUploadingFile,
    updateUploadingFile,
    abortUpload,
  } = useImageUploadStore();

  const selectedFiles = useMemo<FileInfo[]>(
    () => uploads.map((entry) => entry.info),
    [uploads]
  );

  // selectedFiles와 uploadingFiles를 동기화하여 업로드 상태 표시
  useEffect(() => {
    setFilesWithUpload(
      selectedFiles.map((fileInfo) => {
        const uploadingFile = uploadingFiles.find((uf) => uf.fileName === fileInfo.name);
        return {
          ...fileInfo,
          file: fileMapRef.current.get(fileInfo.name),
          uploadStatus: uploadingFile?.status || 'pending',
          uploadProgress: uploadingFile?.progress || 0,
          uploadError: uploadingFile?.error,
          estimatedTimeRemaining: uploadingFile?.estimatedTimeRemaining,
          partProgress: uploadingFile?.partProgress,
          uploadSpeed: uploadingFile?.uploadSpeed,
          partCount: uploadingFile?.partCount,
          startTime: uploadingFile?.startTime,
        };
      })
    );
  }, [selectedFiles, uploadingFiles]);

  // 진행 시간 실시간 업데이트를 위한 타이머
  useEffect(() => {
    const hasUploadingFiles = filesWithUpload.some(f => f.uploadStatus === 'uploading' && f.startTime);
    if (!hasUploadingFiles) return;

    const interval = setInterval(() => {
      setTick(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [filesWithUpload]);

  // 파일 업로드 처리 함수
  const handleUploadFiles = useCallback(async (files: File[]) => {
    const validFiles = files.filter(file => file.type === 'image/bmp' || file.name.endsWith('.bmp'));
    
    if (validFiles.length === 0) return;

    const uploadPromises = validFiles.map(async (file) => {
      try {
        addUploadingFile(file.name, file.size);
        
        const uploadItems = await initBatchUpload([file.name]);
        if (!uploadItems) {
          throw new Error('업로드 초기화 실패');
        }

        const fileSizes = new Map([[file.name, file.size]]);
        const presignedItems = await getBatchPresignedUrls(uploadItems, fileSizes);
        if (!presignedItems) {
          throw new Error('Presigned URL 발급 실패');
        }

        const uploadSuccess = await uploadFileParts(file, file.name, 10, 3);
        if (!uploadSuccess) {
          const { uploadingFiles: currentFiles } = useImageUploadStore.getState();
          const isAborted = !currentFiles.some((f) => f.fileName === file.name);
          
          if (isAborted) {
            console.log(`${file.name} 업로드가 중단되었습니다.`);
            return;
          }
          
          throw new Error('파일 업로드 실패');
        }

        const uploadItem = uploadItems[0];
        const succeededIds = await completeBatchUpload([{
          objectName: uploadItem.objectName,
          uploadId: uploadItem.uploadId,
          fileName: file.name,
        }]);

        if (!succeededIds || !succeededIds.includes(uploadItem.uploadId)) {
          throw new Error('업로드 완료 처리 실패');
        }

        console.log(`${file.name} 업로드 완료`);
      } catch (error) {
        console.error(`${file.name} 업로드 실패:`, error);
        updateUploadingFile(file.name, {
          status: 'error',
          error: error instanceof Error ? error.message : '업로드 실패',
        });
        throw error;
      }
    });

    await Promise.allSettled(uploadPromises);
  }, [addUploadingFile, initBatchUpload, getBatchPresignedUrls, uploadFileParts, completeBatchUpload, updateUploadingFile]);

  const handleFileSelect = useCallback((files: File[]) => {
    const validFiles = files.filter((file) =>
      file.type === 'image/bmp' || file.name.toLowerCase().endsWith('.bmp')
    );

    if (validFiles.length !== files.length) {
      alert('BMP 파일만 업로드 가능합니다.');
    }

    if (!validFiles.length) return;

    (async () => {
      const entries = await Promise.all(
        validFiles.map(async (file) => {
          let dimensions = { width: 0, height: 0 };
          try {
            dimensions = await readBmpDimensions(file);
          } catch (error) {
            console.error(`${file.name} 크기 추출 실패:`, error);
          }

          const preview = await createPreview(file);

          const info: FileInfo = {
            name: file.name,
            size: file.size,
            format: 'BMP',
            dimensions,
            preview,
          };

          fileMapRef.current.set(file.name, file);
          return { file, info };
        })
      );

      setUploads((prev) => [...prev, ...entries]);
      
      // 파일 업로드 시작
      handleUploadFiles(validFiles).catch(error => {
        console.error('파일 업로드 중 오류:', error);
      });
    })();
  }, [handleUploadFiles]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(Array.from(files));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFileSelect]);

  const handleFileDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, [handleFileSelect]);

  const handleFileRemove = useCallback(async (index: number) => {
    const entry = uploads[index];
    if (entry) {
      // 업로드 중이면 중단 처리
      const uploadingFile = uploadingFiles.find(uf => uf.fileName === entry.info.name);
      if (uploadingFile?.status === 'uploading') {
        await abortUpload(entry.info.name);
      }
      fileMapRef.current.delete(entry.info.name);
    }
    setUploads((prev) => prev.filter((_, idx) => idx !== index));
  }, [uploads, uploadingFiles, abortUpload]);

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  }, [draggedIndex]);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    setUploads((prev) => {
      const next = [...prev];
      const [removed] = next.splice(draggedIndex, 1);
      next.splice(dropIndex, 0, removed);
      return next;
    });

    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  // 알고리즘 옵션 가져오기
  const getAlgorithmOptions = useCallback(async (processingUnit: string) => {
    try {
      const response = await getCompressionTypes({
        processingUnit: processingUnit.toUpperCase(),
      });
      
      if (response.isSuccess && response.result) {
        return response.result.map((item: CompressionTypeItem) => ({
          value: item.type,
          label: item.type,
          uuid: item.compressionTypeUuid,
        }));
      }
    } catch (error) {
      console.error('알고리즘 조회 실패:', error);
    }
    
    return [];
  }, []);

  const handleAddToQueue = useCallback(async () => {
    if (!uploads.length) {
      alert('파일을 선택해주세요.');
      return;
    }

    // skipAlgorithmCheck가 false일 때만 알고리즘/버전 체크
    if (!skipAlgorithmCheck && (!settings.algorithm || !settings.version)) {
      alert('파일과 알고리즘, 버전을 모두 선택해주세요.');
      return;
    }

    const { uploadingFiles: uploadFiles } = useImageUploadStore.getState();
    
    // 업로드 완료된 파일 정보 수집
    const fileInfos: Array<{
      fileName: string;
      imageUrl: string;
      compressionTypeUuid: string;
      bmpVolume: number;
      bmpWidth: number;
      bmpHeight: number;
      algorithm: string;
      version: string;
      processingMethod: string;
    }> = [];

    for (const entry of uploads) {
      const uploadingFile = uploadFiles.find(uf => uf.fileName === entry.info.name);
      if (!uploadingFile || uploadingFile.status !== 'completed' || !uploadingFile.imageUrl) {
        alert(`${entry.info.name} 파일이 아직 업로드되지 않았습니다. 업로드가 완료될 때까지 기다려주세요.`);
        return;
      }

      // skipAlgorithmCheck가 true면 compressionTypeUuid는 나중에 설정 (공통 업로드용)
      let compressionTypeUuid = '';
      let algorithm = '';
      let version = '';
      let processingMethod = '';

      if (!skipAlgorithmCheck) {
        // 알고리즘 UUID 가져오기
        const algorithmOptions = await getAlgorithmOptions(settings.processingMethod);
        const selectedAlgorithm = algorithmOptions.find(opt => opt.value === settings.algorithm);
        if (!selectedAlgorithm) {
          alert(`${entry.info.name} 파일의 알고리즘 정보를 찾을 수 없습니다.`);
          return;
        }

        compressionTypeUuid = selectedAlgorithm.uuid;

        // 버전 조회 API를 통해 정확한 compressionTypeUuid 확인
        try {
          const versionResponse = await getCompressionTypeVersions({
            compressionTypeUuid: compressionTypeUuid,
          });
          
          if (versionResponse.isSuccess && versionResponse.result) {
            const selectedVersion = versionResponse.result.find(
              item => item.version.toString() === settings.version
            );
            
            if (selectedVersion) {
              compressionTypeUuid = selectedVersion.compressionTypeUuid;
            }
          }
        } catch (error) {
          console.warn(`${entry.info.name} 파일의 버전 정보 조회 실패, 알고리즘 UUID 사용:`, error);
        }
        
        algorithm = settings.algorithm;
        version = settings.version;
        processingMethod = settings.processingMethod;
      }
      
      fileInfos.push({
        fileName: entry.info.name,
        imageUrl: uploadingFile.imageUrl,
        compressionTypeUuid: compressionTypeUuid,
        bmpVolume: entry.info.size,
        bmpWidth: entry.info.dimensions.width,
        bmpHeight: entry.info.dimensions.height,
        algorithm: algorithm,
        version: version,
        processingMethod: processingMethod,
      });
    }

    // onSubmit 호출 (파일 상세 정보 포함)
    if (onSubmit) {
      onSubmit({
        files: uploads.map((entry) => entry.file),
        processingMethod: skipAlgorithmCheck ? '' : settings.processingMethod.toUpperCase(),
        algorithm: skipAlgorithmCheck ? '' : settings.algorithm,
        version: skipAlgorithmCheck ? '' : settings.version,
        fileInfos: fileInfos,
      });
    }

    setUploads([]);
    fileMapRef.current.clear();
  }, [uploads, settings, onSubmit, getAlgorithmOptions]);

  const isSubmitDisabled = !uploads.length || 
    (!skipAlgorithmCheck && (!settings.algorithm || !settings.version)) ||
    filesWithUpload.some(f => f.uploadStatus === 'uploading' || f.uploadStatus === 'pending');

  const formatTime = useCallback((seconds: number): string => {
    if (!seconds) return '-';
    if (seconds < 60) return `${seconds}초`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}분 ${secs}초` : `${mins}분`;
  }, []);

  const formatSpeed = useCallback((bytesPerSec: number): string => {
    if (bytesPerSec < 1024) return `${bytesPerSec.toFixed(0)} B/s`;
    if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
    return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
  }, []);

  const getElapsedTime = useCallback((file: FileWithUpload): number => {
    if (!file.startTime) return 0;
    return Math.floor((Date.now() - file.startTime) / 1000);
  }, []);

  const getStatusColor = useCallback((status?: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'uploading':
        return 'text-blue-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  }, []);

  const getStatusText = useCallback((file: FileWithUpload): string => {
    switch (file.uploadStatus) {
      case 'completed':
        return '완료';
      case 'uploading':
        const progressText = `업로드 중 (${file.uploadProgress || 0}%)`;
        const timeText = file.estimatedTimeRemaining !== undefined && file.estimatedTimeRemaining > 0
          ? ` • 약 ${formatTime(file.estimatedTimeRemaining)} 남음`
          : '';
        const speedText = file.uploadSpeed !== undefined && file.uploadSpeed > 0
          ? ` • ${formatSpeed(file.uploadSpeed)}`
          : '';
        return progressText + timeText + speedText;
      case 'error':
        return `실패: ${file.uploadError || '알 수 없는 오류'}`;
      default:
        return '대기 중';
    }
  }, [formatTime, formatSpeed]);

  return (
    <div className="space-y-6">
      <CommonContainerBox>
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">파일선택</h3>
            <CommonButton
              onClick={() => fileInputRef.current?.click()}
              variant="blue"
              className="px-4 py-2"
            >
              {selectedFiles.length > 0 ? '추가 업로드' : '업로드'}
            </CommonButton>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".bmp"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
          />
          {selectedFiles.length > 0 ? (
            <div>
              {/* 탭 헤더 */}
              <div className="flex border-b border-gray-200 mb-4">
                <button
                  onClick={() => setActiveTab('list')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'list'
                      ? 'text-[#0059FF] border-b-2 border-[#0059FF]'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  목록
                </button>
                <button
                  onClick={() => setActiveTab('images')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'images'
                      ? 'text-[#0059FF] border-b-2 border-[#0059FF]'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  이미지
                </button>
              </div>

              {/* 탭 컨텐츠 */}
              {activeTab === 'list' ? (
                <CommonTableFrame
                  header={
                    <thead className="bg-gray-50">
                      <tr className="text-gray-700">
                        <th className="text-left font-semibold text-medium tracking-wide py-2 px-3">파일명</th>
                        <th className="text-center font-semibold text-medium tracking-wide py-2 px-3">크기</th>
                        <th className="text-center font-semibold text-medium tracking-wide py-2 px-3">용량</th>
                        <th className="text-center font-semibold text-medium tracking-wide py-2 px-3">알고리즘</th>
                        <th className="text-center font-semibold text-medium tracking-wide py-2 px-3">버전</th>
                        <th className="text-center font-semibold text-medium tracking-wide py-2 px-3 whitespace-nowrap">처리방식</th>
                        <th className="text-center font-semibold text-medium tracking-wide py-2 px-3">업로드 상태</th>
                        <th className="text-center font-semibold text-medium tracking-wide py-2 px-3">작업</th>
                      </tr>
                    </thead>
                  }
                  body={
                    <tbody>
                      {filesWithUpload.map((file, index) => (
                        <tr
                          key={index}
                          draggable={selectedFiles.length > 1}
                          onDragStart={() => handleDragStart(index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, index)}
                          onDragEnd={handleDragEnd}
                          className={`border-b border-gray-100 text-sm text-gray-900 hover:bg-gray-50 ${
                            selectedFiles.length > 1 ? 'cursor-move' : ''
                          } ${
                            draggedIndex === index ? 'opacity-50' : ''
                          } ${
                            dragOverIndex === index ? 'bg-blue-50 border-blue-300' : ''
                          }`}
                        >
                          <td className="max-w-xs truncate py-3 px-3" title={file.name}>
                            {file.name}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {file.dimensions.width.toLocaleString()} × {file.dimensions.height.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-center">{formatFileSize(file.size)}</td>
                          <td className="py-3 px-3 text-center">
                            <span className="text-sm font-medium text-gray-900">
                              {settings.algorithm || '미선택'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="text-sm font-medium text-gray-900">
                              {settings.version || '미선택'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="text-sm font-medium text-gray-900">
                              {settings.processingMethod.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="space-y-2">
                              {file.uploadStatus === 'uploading' ? (
                                <div className="flex items-center justify-between gap-2">
                                  <div className={`text-xs font-medium ${getStatusColor(file.uploadStatus)}`}>
                                    {getStatusText(file)}
                                  </div>
                                  {file.startTime && (
                                    <div className="text-xs text-gray-500">
                                      경과: {formatTime(getElapsedTime(file))}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className={`${file.uploadStatus === 'completed' ? 'text-medium' : 'text-xs'} font-medium ${file.uploadStatus === 'completed' ? '' : getStatusColor(file.uploadStatus)}`}
                                  style={file.uploadStatus === 'completed' ? { color: '#0059ff' } : undefined}
                                >
                                  {getStatusText(file)}
                                </div>
                              )}
                              {file.uploadStatus === 'uploading' && (
                                <div className="space-y-1.5">
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${file.uploadProgress || 0}%` }}
                                    />
                                  </div>
                                  {file.partProgress && file.partCount && file.partCount > 0 && (
                                    <div className="space-y-1.5">
                                      {(() => {
                                        const isExpanded = expandedPartProgress.has(file.name);
                                        const completedParts = Object.values(file.partProgress).filter(prog => prog === 100).length;
                                        const inProgressParts = Object.values(file.partProgress).filter(prog => prog > 0 && prog < 100).length;
                                        const inProgressPartNumbers = Object.entries(file.partProgress)
                                          .filter(([_, prog]) => prog > 0 && prog < 100)
                                          .map(([partNum]) => parseInt(partNum))
                                          .sort((a, b) => a - b);
                                        
                                        return (
                                          <>
                                            <div className="flex items-center justify-between text-[11px] text-gray-600">
                                              <span>
                                                완료: {completedParts}/{file.partCount}개
                                                {inProgressParts > 0 && ` • 진행 중: ${inProgressParts}개`}
                                              </span>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setExpandedPartProgress((prev) => {
                                                    const newSet = new Set(prev);
                                                    if (isExpanded) {
                                                      newSet.delete(file.name);
                                                    } else {
                                                      newSet.add(file.name);
                                                    }
                                                    return newSet;
                                                  });
                                                }}
                                                className="text-[10px] text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-0.5"
                                              >
                                                {isExpanded ? (
                                                  <>
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                    </svg>
                                                    접기
                                                  </>
                                                ) : (
                                                  <>
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                    상세보기
                                                  </>
                                                )}
                                              </button>
                                            </div>
                                            {isExpanded && (
                                              <div className="pt-1 border-t border-gray-200">
                                                <div className="space-y-1.5">
                                                  {inProgressPartNumbers.length > 0 && (
                                                    <div>
                                                      <div className="space-y-1">
                                                        {inProgressPartNumbers.map((partNum) => {
                                                          const partProg = file.partProgress?.[partNum] || 0;
                                                          return (
                                                            <div key={partNum} className="flex items-center gap-2">
                                                              <span className="text-[10px] text-gray-600 w-8">#{partNum}</span>
                                                              <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                                                <div
                                                                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                                                                  style={{ width: `${partProg}%` }}
                                                                />
                                                              </div>
                                                              <span className="text-[10px] text-gray-500 w-8">{partProg}%</span>
                                                            </div>
                                                          );
                                                        })}
                                                      </div>
                                                    </div>
                                                  )}
                                                  {completedParts + inProgressParts < file.partCount && (
                                                    <div>
                                                      <div className="text-[10px] text-gray-500 mb-1">
                                                        대기 중: {file.partCount - completedParts - inProgressParts}개
                                                      </div>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            )}
                                          </>
                                        );
                                      })()}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (file.uploadStatus === 'uploading') {
                                  await abortUpload(file.name);
                                }
                                fileMapRef.current.delete(file.name);
                                handleFileRemove(index);
                              }}
                              className={`px-3 py-1 text-white rounded-full transition-colors text-xs ${
                                file.uploadStatus === 'uploading'
                                  ? 'bg-orange-600 hover:bg-orange-700'
                                  : 'bg-red-600 hover:bg-red-700'
                              }`}
                            >
                              {file.uploadStatus === 'uploading' ? '중단' : '제거'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  }
                />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filesWithUpload.map((file, index) => {
                    const getStatusBadge = () => {
                      switch (file.uploadStatus) {
                        case 'completed':
                          return (
                            <span className="absolute top-2 left-2 px-2 py-1 bg-green-500 text-white text-xs rounded-md shadow-md">
                              완료
                            </span>
                          );
                        case 'uploading':
                          const timeText = file.estimatedTimeRemaining !== undefined && file.estimatedTimeRemaining > 0
                            ? ` • ${formatTime(file.estimatedTimeRemaining)}`
                            : '';
                          return (
                            <span className="absolute top-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-md shadow-md">
                              업로드 중 {file.uploadProgress || 0}%{timeText}
                            </span>
                          );
                        case 'error':
                          return (
                            <span className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs rounded-md shadow-md">
                              실패
                            </span>
                          );
                        default:
                          return (
                            <span className="absolute top-2 left-2 px-2 py-1 bg-gray-500 text-white text-xs rounded-md shadow-md">
                              대기 중
                            </span>
                          );
                      }
                    };

                    return (
                      <div
                        key={index}
                        className="relative border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        <div className="aspect-3/2 bg-gray-100 flex items-center justify-center relative">
                          {file.preview ? (
                            <img
                              src={file.preview}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <svg
                              className="w-16 h-16 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          )}
                          {getStatusBadge()}
                          {file.uploadStatus === 'uploading' && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gray-200 h-1">
                              <div
                                className="bg-blue-600 h-1 transition-all duration-300"
                                style={{ width: `${file.uploadProgress || 0}%` }}
                              />
                            </div>
                          )}
                        </div>
                        <div className="p-3 bg-white">
                          <p className="text-medium font-medium text-gray-900 truncate mb-1" title={file.name}>
                            {file.name}
                          </p>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
                            <span>
                              크기: {file.dimensions.width.toLocaleString()} × {file.dimensions.height.toLocaleString()}
                            </span>
                            <span>용량: {formatFileSize(file.size)}</span>
                          </div>
                          {file.uploadError && (
                            <p className="text-medium text-red-600 mt-1 truncate" title={file.uploadError}>
                              {file.uploadError}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (file.uploadStatus === 'uploading') {
                              await abortUpload(file.name);
                            }
                            fileMapRef.current.delete(file.name);
                            handleFileRemove(index);
                          }}
                          className={`absolute top-2 right-2 px-2 py-1 text-white rounded-md transition-colors text-xs shadow-md ${
                            file.uploadStatus === 'uploading'
                              ? 'bg-orange-600 hover:bg-orange-700'
                              : 'bg-red-600 hover:bg-red-700'
                          }`}
                        >
                          {file.uploadStatus === 'uploading' ? '중단' : '제거'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-gray-400 transition-colors cursor-pointer"
              onDrop={handleFileDrop}
              onDragOver={handleFileDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="space-y-4 text-center">
                <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    파일을 드래그하거나 클릭하여 업로드
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    BMP 파일만 지원 (다중 선택 가능)
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CommonContainerBox>

      <div className="flex justify-end">
        <CommonButton
          type="button"
          variant={isSubmitDisabled ? 'gray' : 'blue'}
          className="px-6 py-2"
          onClick={handleAddToQueue}
          disabled={isSubmitDisabled}
        >
          {submitLabel}
        </CommonButton>
      </div>
    </div>
  );
}
