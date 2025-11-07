'use client';

import React, { useRef, useState, useEffect } from 'react';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import CommonTableFrame from '@/components/ui/CommonTableFrame';
import RadioButton from '@/components/ui/RadioButton';
import CommonDropdown from '@/components/ui/CommonDropdown';
import Button from '@/components/ui/CommonButton';
import { getCompressionTypes, getCompressionTypeVersions } from '@/service/imageCompressor';
import { CompressionTypeItem, CompressionTypeVersionItem } from '@/types/imageCompressor';

export interface FileInfo {
  name: string;
  size: number;
  format: string;
  dimensions: { width: number; height: number };
  preview: string;
}


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
}: CompressionSettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [algorithmOptions, setAlgorithmOptions] = useState<{ value: string; label: string; uuid: string }[]>([]);
  const [loadingAlgorithms, setLoadingAlgorithms] = useState(false);
  const [versionOptions, setVersionOptions] = useState<{ value: string; label: string }[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFileSelect(files);
    }
  };

  const handleFileDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(Array.from(files));
    }
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
  }, [processingMethod]); // processingMethod 변경 시에만 실행

  // 알고리즘 변경 시 버전 목록 조회
  useEffect(() => {
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
  }, [algorithm, algorithmOptions]); // algorithm 변경 시 실행

  return (
    <div>
      <h1 className="text-lg font-bold text-gray-900 mb-4">압축이미지</h1>

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
              selectedFiles.length === 1 ? (
                // 단일 파일: 기존 레이아웃
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onFileRemove(0);
                    }}
                    className="absolute top-0 right-0 px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                  >
                    제거
                  </button>
                  <div className="flex gap-6">
                    {/* 왼쪽: 이미지 미리보기 */}
                    <div className="shrink-0 w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                      {selectedFiles[0].preview ? (
                        <img
                          src={selectedFiles[0].preview}
                          alt="미리보기"
                          className="w-full h-full object-contain rounded-lg"
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
                    </div>

                    {/* 오른쪽: 파일 정보 */}
                    <div className="flex-1 space-y-2 pr-20">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 whitespace-nowrap">이름</span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedFiles[0].name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 whitespace-nowrap">크기</span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedFiles[0].dimensions.width.toLocaleString()} ×{' '}
                          {selectedFiles[0].dimensions.height.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 whitespace-nowrap">용량</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatFileSize(selectedFiles[0].size)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 whitespace-nowrap">포맷</span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedFiles[0].format}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // 다중 파일: 표 형식
                <div>
                  <CommonTableFrame
                    header={
                      <thead className="bg-gray-50">
                        <tr className="text-gray-700">
                          <th className="text-left font-semibold text-xs tracking-wide py-2 px-3 w-8"></th>
                          <th className="text-left font-semibold text-xs tracking-wide py-2 px-3">파일명</th>
                          <th className="text-left font-semibold text-xs tracking-wide py-2 px-3">크기</th>
                          <th className="text-left font-semibold text-xs tracking-wide py-2 px-3">용량</th>
                          <th className="text-left font-semibold text-xs tracking-wide py-2 px-3">포맷</th>
                          <th className="text-left font-semibold text-xs tracking-wide py-2 px-3">작업</th>
                        </tr>
                      </thead>
                    }
                    body={
                      <tbody>
                        {selectedFiles.map((file, index) => (
                          <tr
                            key={index}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, index)}
                            onDragEnd={handleDragEnd}
                            className={`border-b border-gray-100 text-sm text-gray-900 hover:bg-gray-50 cursor-move ${
                              draggedIndex === index ? 'opacity-50' : ''
                            } ${
                              dragOverIndex === index ? 'bg-blue-50 border-blue-300' : ''
                            }`}
                          >
                            <td className="py-3 px-3">
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
                            </td>
                            <td className="py-3 px-3">{file.name}</td>
                            <td className="py-3 px-3">
                              {file.dimensions.width.toLocaleString()} ×{' '}
                              {file.dimensions.height.toLocaleString()}
                            </td>
                            <td className="py-3 px-3">{formatFileSize(file.size)}</td>
                            <td className="py-3 px-3">{file.format}</td>
                            <td className="py-3 px-3 ">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onFileRemove(index);
                                }}
                                className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-xs"
                              >
                                제거
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    }
                  />
                </div>
              )
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

          {/* 압축방법 영역 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">압축방법</h3>

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

          {/* 압축 버튼 */}
          <div className="flex justify-end pt-4">
            <Button 
              onClick={onAddToQueue} 
              variant={selectedFiles.length > 0 ? "blue" : "gray"}
              disabled={selectedFiles.length === 0}
            >
              대기열 추가
            </Button>
          </div>
        </div>
      </CommonContainerBox>
    </div>
  );
}


