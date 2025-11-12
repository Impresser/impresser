'use client';

import React, { useRef, useState, useEffect } from 'react';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import CommonTableFrame from '@/components/ui/CommonTableFrame';
import RadioButton from '@/components/ui/RadioButton';
import CommonDropdown from '@/components/ui/CommonDropdown';
import Button from '@/components/ui/CommonButton';
import { getCompressionTypes, getCompressionTypeVersions } from '@/service/imageCompressor';
import { CompressionTypeItem, CompressionTypeVersionItem, FileInfo } from '@/types/imageCompressor';
import { useImageUploadStore } from '@/store/imageUploadStore';

interface CompressionSettingsProps {
  selectedFiles: FileInfo[];
  processingMethod: string;
  algorithm: string;
  version: string;
  onFileSelect: (files: File[]) => void;
  onFileRemove: (index: number) => void;
  onFileReorder: (fromIndex: number, toIndex: number) => void;
  onProcessingMethodChange: (value: string) => void;
  onAlgorithmChange: (value: string) => void;
  onVersionChange: (value: string) => void;
  onAddToQueue: () => void;
  hideTitle?: boolean;
  hideAddButton?: boolean;
  hideMethodSection?: boolean;
}

// File 객체를 저장하기 위한 확장 타입
interface FileWithUpload extends FileInfo {
  file?: File; // 원본 File 객체
  uploadStatus?: 'pending' | 'uploading' | 'completed' | 'error';
  uploadProgress?: number;
  uploadError?: string;
}

// File 객체를 저장하기 위한 확장 타입
interface FileWithUpload extends FileInfo {
  file?: File; // 원본 File 객체
  uploadStatus?: 'pending' | 'uploading' | 'completed' | 'error';
  uploadProgress?: number;
  uploadError?: string;
  estimatedTimeRemaining?: number; // 예상 남은 시간 (초)
  partProgress?: Record<number, number>; // 각 파트별 진행률
  uploadSpeed?: number; // 업로드 속도 (bytes/sec)
  partCount?: number; // 파트 개수
  startTime?: number; // 업로드 시작 시간 (timestamp)
}

export default function CompressionSettings({
  selectedFiles,
  processingMethod,
  algorithm,
  version,
  onFileSelect,
  onFileRemove,
  onFileReorder,
  onProcessingMethodChange,
  onAlgorithmChange,
  onVersionChange,
  onAddToQueue,
  hideTitle = false,
  hideAddButton = false,
  hideMethodSection = false,
}: CompressionSettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [algorithmOptions, setAlgorithmOptions] = useState<{ value: string; label: string; uuid: string }[]>([]);
  const [loadingAlgorithms, setLoadingAlgorithms] = useState(false);
  const [versionOptions, setVersionOptions] = useState<{ value: string; label: string }[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'images'>('list');
  const [filesWithUpload, setFilesWithUpload] = useState<FileWithUpload[]>([]);
  const fileMapRef = useRef<Map<string, File>>(new Map()); // File 객체 저장용
  const [expandedPartProgress, setExpandedPartProgress] = useState<Set<string>>(new Set()); // 파트 진행률 펼치기 상태
  const [, setTick] = useState(0); // 진행 시간 업데이트를 위한 tick
  
  const {
    uploadingFiles,
    initBatchUpload,
    getBatchPresignedUrls,
    uploadFileParts,
    completeBatchUpload,
    addUploadingFile,
    updateUploadingFile,
  } = useImageUploadStore();

  const handleFileDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      
      // File 객체 저장
      fileArray.forEach(file => {
        fileMapRef.current.set(file.name, file);
      });
      
      onFileSelect(fileArray);
      
      // 파일 업로드 시작 (비동기로 실행, 블로킹하지 않음)
      handleUploadFiles(fileArray).catch(error => {
        console.error('파일 업로드 중 오류:', error);
      });
    }
  };

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      // File 객체 저장
      files.forEach(file => {
        fileMapRef.current.set(file.name, file);
      });
      
      onFileSelect(files);
      
      // 파일 업로드 시작 (비동기로 실행, 블로킹하지 않음)
      handleUploadFiles(files).catch(error => {
        console.error('파일 업로드 중 오류:', error);
      });
    }
  };

  // 파일 업로드 처리 함수 (각 파일을 병렬로 처리)
  const handleUploadFiles = async (files: File[]) => {
    const validFiles = files.filter(file => file.type === 'image/bmp' || file.name.endsWith('.bmp'));
    
    if (validFiles.length === 0) return;

    // 각 파일에 대해 업로드 프로세스를 병렬로 시작
    const uploadPromises = validFiles.map(async (file) => {
      try {
        // 1. 파일을 store에 추가
        addUploadingFile(file.name, file.size);
        
        // 2. 배치 업로드 초기화
        const uploadItems = await initBatchUpload([file.name]);
        if (!uploadItems) {
          throw new Error('업로드 초기화 실패');
        }

        // 3. Presigned URL 발급
        const fileSizes = new Map([[file.name, file.size]]);
        const presignedItems = await getBatchPresignedUrls(uploadItems, fileSizes);
        if (!presignedItems) {
          throw new Error('Presigned URL 발급 실패');
        }

        // 4. 파일 파트 병렬 업로드
        const uploadSuccess = await uploadFileParts(file, file.name, 10, 3);
        if (!uploadSuccess) {
          throw new Error('파일 업로드 실패');
        }

        // 5. 업로드 완료
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
        throw error; // 에러를 다시 throw하여 Promise.allSettled에서 처리 가능하도록
      }
    });

    // 모든 업로드를 병렬로 실행 (실패해도 다른 파일 업로드는 계속 진행)
    await Promise.allSettled(uploadPromises);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      onFileReorder(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // 처리방식 변경 시 알고리즘 목록 조회
  useEffect(() => {
    if (hideMethodSection) return;
    const fetchAlgorithms = async () => {
      if (!processingMethod) return;
      
      setLoadingAlgorithms(true);
      try {
        const response = await getCompressionTypes({
          processingUnit: processingMethod.toUpperCase(),
        });
        
        if (response.isSuccess && response.result) {
          const options = response.result.map((item: CompressionTypeItem) => ({
            value: item.type,
            label: item.type,
            uuid: item.compressionTypeUuid,
          }));
          setAlgorithmOptions(options);
          
          // 현재 선택된 알고리즘이 새로운 목록에 없으면 첫 번째 알고리즘으로 변경
          if (options.length > 0 && !options.find(opt => opt.value === algorithm)) {
            onAlgorithmChange(options[0].value);
          }
        }
      } catch (error) {
        console.error('알고리즘 조회 실패:', error);
        setAlgorithmOptions([]);
      } finally {
        setLoadingAlgorithms(false);
      }
    };

    fetchAlgorithms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processingMethod, hideMethodSection]); // processingMethod 변경 시에만 실행

  // selectedFiles와 uploadingFiles를 동기화하여 업로드 상태 표시
  useEffect(() => {
    setFilesWithUpload(
      selectedFiles.map((fileInfo) => {
        const uploadingFile = uploadingFiles.find((uf) => uf.fileName === fileInfo.name);
        return {
          ...fileInfo,
          uploadStatus: uploadingFile?.status || 'pending',
          uploadProgress: uploadingFile?.progress || 0,
          uploadError: uploadingFile?.error,
        };
      })
    );
  }, [selectedFiles, uploadingFiles]);

  // selectedFiles와 uploadingFiles를 동기화하여 업로드 상태 표시
  useEffect(() => {
    setFilesWithUpload(
      selectedFiles.map((fileInfo) => {
        const uploadingFile = uploadingFiles.find((uf) => uf.fileName === fileInfo.name);
        return {
          ...fileInfo,
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

  // 백그라운드 업로드 지원: 페이지가 백그라운드로 이동해도 업로드 계속 진행
  useEffect(() => {
    const handleVisibilityChange = () => {
      // 탭이 백그라운드로 이동하거나 다시 활성화될 때
      // XMLHttpRequest는 백그라운드에서도 계속 작동하므로 특별한 처리는 필요 없음
      // 다만 사용자에게 알림을 표시할 수 있음
      if (document.hidden) {
        // 백그라운드로 이동 - 업로드는 계속 진행됨
        console.log('페이지가 백그라운드로 이동했습니다. 업로드는 계속 진행됩니다.');
      } else {
        // 다시 활성화 - 업로드 상태 확인
        console.log('페이지가 다시 활성화되었습니다.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // 알고리즘 변경 시 버전 목록 조회
  useEffect(() => {
    if (hideMethodSection) return;
    const fetchVersions = async () => {
      if (!algorithm || algorithmOptions.length === 0) {
        setVersionOptions([]);
        return;
      }
      
      // 선택된 알고리즘의 UUID 찾기
      const selectedAlgorithm = algorithmOptions.find(opt => opt.value === algorithm);
      if (!selectedAlgorithm) {
        setVersionOptions([]);
        return;
      }
      
      setLoadingVersions(true);
      try {
        const response = await getCompressionTypeVersions({
          compressionTypeUuid: selectedAlgorithm.uuid,
        });
        
        if (response.isSuccess && response.result) {
          const options = response.result.map((item: CompressionTypeVersionItem) => ({
            value: item.version.toString(),
            label: `Version ${item.version}`,
          }));
          setVersionOptions(options);
          
          // 현재 선택된 버전이 새로운 목록에 없으면 첫 번째 버전으로 변경
          if (options.length > 0 && !options.find(opt => opt.value === version)) {
            onVersionChange(options[0].value);
          }
        }
      } catch (error) {
        console.error('버전 조회 실패:', error);
        setVersionOptions([]);
      } finally {
        setLoadingVersions(false);
      }
    };

    fetchVersions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [algorithm, algorithmOptions, hideMethodSection]); // algorithm 변경 시 실행

  return (
    <div>
      {!hideTitle && <h1 className="text-lg font-bold text-gray-900 mb-4">압축이미지</h1>}

      <CommonContainerBox>
        <div className="space-y-6">
          {/* 파일 선택 영역 */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">파일선택</h3>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="blue"
                className="px-4 py-2"
              >
                {selectedFiles.length > 0 ? '추가 업로드' : '업로드'}
              </Button>
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
              // 파일이 있을 때: 탭 형식 (단일/다중 모두 동일)
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
                          <th className="text-left font-semibold text-xs tracking-wide py-2 px-3 w-8"></th>
                          <th className="text-left font-semibold text-xs tracking-wide py-2 px-3">파일명</th>
                          <th className="text-left font-semibold text-xs tracking-wide py-2 px-3">크기</th>
                          <th className="text-left font-semibold text-xs tracking-wide py-2 px-3">용량</th>
                          <th className="text-left font-semibold text-xs tracking-wide py-2 px-3">포맷</th>
                          <th className="text-left font-semibold text-xs tracking-wide py-2 px-3">업로드 상태</th>
                          <th className="text-left font-semibold text-xs tracking-wide py-2 px-3">작업</th>
                        </tr>
                      </thead>
                    }
                    body={
                      <tbody>
                        {filesWithUpload.map((file, index) => {
                          const getStatusColor = () => {
                            switch (file.uploadStatus) {
                              case 'completed':
                                return 'text-green-600';
                              case 'uploading':
                                return 'text-blue-600';
                              case 'error':
                                return 'text-red-600';
                              default:
                                return 'text-gray-500';
                            }
                          };

                          const formatTime = (seconds: number): string => {
                            if (seconds < 60) return `${seconds}초`;
                            const mins = Math.floor(seconds / 60);
                            const secs = seconds % 60;
                            return secs > 0 ? `${mins}분 ${secs}초` : `${mins}분`;
                          };

                          const formatSpeed = (bytesPerSec: number): string => {
                            if (bytesPerSec < 1024) return `${bytesPerSec.toFixed(0)} B/s`;
                            if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
                            return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
                          };

                          const getElapsedTime = (): number => {
                            if (!file.startTime) return 0;
                            return Math.floor((Date.now() - file.startTime) / 1000);
                          };

                          const getStatusText = () => {
                            switch (file.uploadStatus) {
                              case 'completed':
                                return '완료';
                              case 'uploading':
                                const progressText = `업로드 중 (${file.uploadProgress}%)`;
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
                          };

                          return (
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
                              <td className="py-3 px-3">
                                {selectedFiles.length > 1 && (
                                  <svg
                                    className="w-4 h-4 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M4 8h16M4 16h16"
                                    />
                                  </svg>
                                )}
                              </td>
                              <td className="py-3 px-3">{file.name}</td>
                              <td className="py-3 px-3">
                                {file.dimensions.width.toLocaleString()} ×{' '}
                                {file.dimensions.height.toLocaleString()}
                              </td>
                              <td className="py-3 px-3">{formatFileSize(file.size)}</td>
                              <td className="py-3 px-3">{file.format}</td>
                              <td className="py-3 px-3">
                                <div className="space-y-2">
                                  {file.uploadStatus === 'uploading' ? (
                                    <div className="flex items-center justify-between gap-2">
                                      <div className={`text-xs font-medium ${getStatusColor()} flex-1`}>
                                        {getStatusText()}
                                      </div>
                                      {file.startTime && (
                                        <div className="text-xs text-gray-500">
                                          경과: {formatTime(getElapsedTime())}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className={`text-xs font-medium ${getStatusColor()}`}>
                                      {getStatusText()}
                                    </div>
                                  )}
                                  {file.uploadStatus === 'uploading' && (
                                    <div className="space-y-1.5">
                                      {/* 전체 진행률 바 */}
                                      <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                          style={{ width: `${file.uploadProgress || 0}%` }}
                                        />
                                      </div>
                                      {/* 파트별 업로드 상태 */}
                                      {file.partProgress && file.partCount && file.partCount > 0 && (
                                        <div className="space-y-1.5">
                                          {(() => {
                                            const isExpanded = expandedPartProgress.has(file.name);
                                            
                                            // 완료된 파트 수 계산 (100% 완료된 파트)
                                            const completedParts = Object.values(file.partProgress).filter(prog => prog === 100).length;
                                            
                                            // 진행 중인 파트 수 계산 (0 < progress < 100)
                                            const inProgressParts = Object.values(file.partProgress).filter(prog => prog > 0 && prog < 100).length;
                                            
                                            // 완료된 파트 번호 찾기
                                            const completedPartNumbers = Object.entries(file.partProgress)
                                              .filter(([_, prog]) => prog === 100)
                                              .map(([partNum]) => parseInt(partNum))
                                              .sort((a, b) => a - b);
                                            
                                            // 진행 중인 파트 번호 찾기
                                            const inProgressPartNumbers = Object.entries(file.partProgress)
                                              .filter(([_, prog]) => prog > 0 && prog < 100)
                                              .map(([partNum]) => parseInt(partNum))
                                              .sort((a, b) => a - b);
                                            
                                            return (
                                              <>
                                                {/* 기본 표시: 완료된 파트 수 */}
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
                                                
                                                {/* 펼쳤을 때: 각 파트별 상세 진행률 */}
                                                {isExpanded && (
                                                  <div className="pt-1 border-t border-gray-200">
                                                    <div className="space-y-1.5">
                                                      {/* 진행 중인 파트 */}
                                                      {inProgressPartNumbers.length > 0 && (
                                                        <div>
                                                          <div className="text-[10px] text-gray-500 mb-1">진행 중인 파트:</div>
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
                                                      
                                                      {/* 대기 중인 파트 */}
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
                              <td className="py-3 px-3 ">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // File 객체도 제거
                                    fileMapRef.current.delete(file.name);
                                    onFileRemove(index);
                                  }}
                                  className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-xs"
                                >
                                  제거
                                </button>
                              </td>
                            </tr>
                          );
                        })}
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
                            const formatTime = (seconds: number): string => {
                              if (seconds < 60) return `${seconds}초`;
                              const mins = Math.floor(seconds / 60);
                              const secs = seconds % 60;
                              return secs > 0 ? `${mins}분 ${secs}초` : `${mins}분`;
                            };
                            const timeText = file.estimatedTimeRemaining !== undefined && file.estimatedTimeRemaining > 0
                              ? ` • ${formatTime(file.estimatedTimeRemaining)}`
                              : '';
                            return (
                              <span className="absolute top-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-md shadow-md">
                                업로드 중 {file.uploadProgress}%{timeText}
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
                          {/* 이미지 미리보기 */}
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
                                  style={{ width: `${file.uploadProgress}%` }}
                                />
                              </div>
                            )}
                          </div>
                          {/* 파일 정보 */}
                          <div className="p-3 bg-white">
                            <p className="text-sm font-medium text-gray-900 truncate mb-1" title={file.name}>
                              {file.name}
                            </p>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
                              <span>
                                크기: {file.dimensions.width.toLocaleString()} × {file.dimensions.height.toLocaleString()}
                              </span>
                              <span>용량: {formatFileSize(file.size)}</span>
                              <span>포맷:{file.format}</span>
                            </div>
                            {file.uploadError && (
                              <p className="text-xs text-red-600 mt-1 truncate" title={file.uploadError}>
                                {file.uploadError}
                              </p>
                            )}
                          </div>
                          {/* 제거 버튼 */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // File 객체도 제거
                              fileMapRef.current.delete(file.name);
                              onFileRemove(index);
                            }}
                            className="absolute top-2 right-2 px-2 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-xs shadow-md"
                          >
                            제거
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

          {!hideMethodSection && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">압축방법</h3>

            {/* 처리방식, 알고리즘, 버전 한 줄 */}
            <div className="grid grid-cols-3 gap-4">
              {/* 알고리즘 */}
              <CommonDropdown
                label="알고리즘"
                options={algorithmOptions}
                value={algorithm}
                onChange={onAlgorithmChange}
                placeholder={loadingAlgorithms ? "로딩 중..." : algorithmOptions.length === 0 ? "알고리즘 없음" : "알고리즘 선택"}
                disabled={loadingAlgorithms || algorithmOptions.length === 0}
              />

              {/* 버전 */}
              <CommonDropdown
                label="버전"
                options={versionOptions}
                value={version}
                onChange={onVersionChange}
                placeholder={loadingVersions ? "로딩 중..." : versionOptions.length === 0 ? "알고리즘을 먼저 선택하세요" : "버전 선택"}
                disabled={loadingVersions || versionOptions.length === 0}
              />
              {/* 처리방식 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  처리방식
                </label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <RadioButton
                      name="processingMethod"
                      value="cpu"
                      label="CPU"
                      checked={processingMethod === 'cpu'}
                      onChange={onProcessingMethodChange}
                    />
                  </div>
                  <div className="flex-1">
                    <RadioButton
                      name="processingMethod"
                      value="gpu"
                      label="GPU"
                      checked={processingMethod === 'gpu'}
                      onChange={onProcessingMethodChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
      </CommonContainerBox>
      {!hideAddButton && selectedFiles.length > 0 && (
          <div className="flex justify-end mt-4">
            <Button 
              onClick={onAddToQueue} 
              variant="blue"
            >
              대기열 추가
            </Button>
          </div>
          )}
    </div>
  );
}


