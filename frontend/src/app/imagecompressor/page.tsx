'use client';

import React, { useState, useRef, useEffect } from 'react';
import Sidebar from '@/components/layout/sidebar';
import Navbar from '@/components/layout/navbar';
import ContainerBox from '@/components/ui/ContainerBox';
import RadioButton from '@/components/ui/RadioButton';
import CommonDropdown from '@/components/ui/CommonDropdown';
import Button from '@/components/ui/Button';
import CommonTable, { QueueItem, HistoryItem } from '@/components/ui/CommonTable';

interface FileInfo {
  name: string;
  size: number;
  format: string;
  dimensions: { width: number; height: number };
  preview: string;
}

const algorithmOptions = [
  { value: 'lzw', label: 'LZW (Lempel-Ziv-Welch)' },
  { value: 'rle', label: 'RLE (Run-Length Encoding)' },
  { value: 'huffman', label: 'Huffman Coding' },
  { value: 'arithmetic', label: 'Arithmetic Coding' },
];

const versionOptions = [
  { value: '1.0', label: 'Version 1.0' },
  { value: '2.0', label: 'Version 2.0' },
  { value: '3.0', label: 'Version 3.0' },
];

export default function ImageCompressorPage() {
  const userName = '홍길동'; // 로그인한 유저명
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [processingMethod, setProcessingMethod] = useState('cpu');
  const [algorithm, setAlgorithm] = useState('lzw');
  const [version, setVersion] = useState('1.0');
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file.type !== 'image/bmp') {
      alert('BMP 파일만 업로드 가능합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setSelectedFile({
          name: file.name,
          size: file.size,
          format: 'BMP',
          dimensions: { width: img.width, height: img.height },
          preview: e.target?.result as string,
        });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getAlgorithmLabel = (value: string): string => {
    const option = algorithmOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  const handleAddToQueue = () => {
    if (!selectedFile) {
      alert('파일을 먼저 선택해주세요.');
      return;
    }

    const newItem: QueueItem = {
      id: Date.now().toString(),
      fileName: selectedFile.name,
      processingMethod: processingMethod.toUpperCase(),
      algorithm: getAlgorithmLabel(algorithm),
      version: version,
      fileSize: selectedFile.size,
      status: '대기',
      assignedUser: userName,
      startTime: null,
      elapsedTime: 0,
      estimatedTime: 0,
      progress: 0,
    };

    setQueue((prev) => [...prev, newItem]);
    
    // 선택된 파일 초기화
    setSelectedFile(null);
  };

  const handleStartCompression = () => {
    // 대기 상태인 첫 번째 항목을 진행 상태로 변경
    setQueue((prev) => {
      const updated = [...prev];
      const waitingIndex = updated.findIndex(item => item.status === '대기');
      if (waitingIndex !== -1) {
        updated[waitingIndex] = {
          ...updated[waitingIndex],
          status: '진행',
          startTime: new Date(),
          estimatedTime: 300, // 예상 시간 5분으로 설정 (임시)
        };
      }
      return updated;
    });
  };

  // 경과시간 업데이트 및 완료 처리를 위한 useEffect
  useEffect(() => {
    const interval = setInterval(() => {
      setQueue((prev) => {
        return prev.map((item) => {
          if (item.status === '진행' && item.startTime) {
            const elapsed = Math.floor((Date.now() - item.startTime.getTime()) / 1000);
            const progress = item.estimatedTime > 0 
              ? Math.min(100, Math.floor((elapsed / item.estimatedTime) * 100))
              : 0;
            
            // 진행률이 100%에 도달하면 완료 처리
            if (progress >= 100) {
              const completedTime = new Date();
              const duration = item.estimatedTime > 0 ? item.estimatedTime : elapsed;
              
              // 히스토리에 추가
              const historyItem: HistoryItem = {
                id: item.id,
                fileName: item.fileName,
                processingMethod: item.processingMethod,
                algorithm: item.algorithm,
                version: item.version,
                fileSize: item.fileSize,
                status: '완료',
                assignedUser: item.assignedUser,
                completedTime: completedTime,
                duration: duration,
              };
              
              setHistory((prevHistory) => [historyItem, ...prevHistory]);
              
              // 큐에서 제거 (null로 표시하고 나중에 필터링)
              return null as any;
            }
            
            return {
              ...item,
              elapsedTime: elapsed,
              progress: progress,
            };
          }
          return item;
        }).filter((item): item is QueueItem => item !== null);
      });
    }, 1000); // 1초마다 업데이트

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Navigation Bar */}
        <Navbar userName="홍길동" />
        
        {/* Content */}
        <main className="flex-1 px-6 py-6 overflow-y-auto">
          <div className="w-full max-w-7xl mx-auto">
            {/* 압축 이미지 타이틀 */}
            <h1 className="text-2xl font-bold text-gray-900 mb-6">압축이미지</h1>
            
            {/* 압축 이미지 컨테이너 */}
            <ContainerBox>
              <div className="space-y-6">
                {/* 파일 영역 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">파일선택</h3>
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {selectedFile ? (
                      <div className="space-y-4">
                        <div className="flex justify-center">
                          <img
                            src={selectedFile.preview}
                            alt="미리보기"
                            className="max-w-xs max-h-48 object-contain rounded-lg border border-gray-200"
                          />
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-medium text-gray-900 mb-2">
                            {selectedFile.name}
                          </p>
                          <div className="flex justify-center space-x-4 text-sm text-gray-500">
                            <span>크기: {selectedFile.dimensions.width} × {selectedFile.dimensions.height}</span>
                            <span>용량: {formatFileSize(selectedFile.size)}</span>
                            <span>형식: {selectedFile.format}</span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                        >
                          파일 제거
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
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
                            BMP 파일만 지원 (최대 10MB)
                          </p>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".bmp"
                          onChange={handleFileInputChange}
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 압축방법 영역 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">압축방법</h3>
                  
                  {/* 처리방식, 알고리즘, 버전 한 줄 */}
                  <div className="grid grid-cols-3 gap-4">
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
                            onChange={setProcessingMethod}
                          />
                        </div>
                        <div className="flex-1">
                          <RadioButton
                            name="processingMethod"
                            value="gpu"
                            label="GPU"
                            checked={processingMethod === 'gpu'}
                            onChange={setProcessingMethod}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 알고리즘 */}
                    <CommonDropdown
                      label="알고리즘"
                      options={algorithmOptions}
                      value={algorithm}
                      onChange={setAlgorithm}
                      placeholder="알고리즘 선택"
                    />

                    {/* 버전 */}
                    <CommonDropdown
                      label="버전"
                      options={versionOptions}
                      value={version}
                      onChange={setVersion}
                      placeholder="버전 선택"
                    />
                  </div>
                </div>

                {/* 압축 버튼 */}
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleAddToQueue}
                    variant="blue"
                  >
                    대기열 추가
                  </Button>
                </div>
              </div>
            </ContainerBox>

            {/* 압축대기열 영역 */}
            <div className="mt-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">압축대기열</h1>
              
              <ContainerBox>
                <CommonTable 
                  data={queue} 
                  emptyMessage="대기열에 추가된 항목이 없습니다."
                />

                {/* 압축 버튼 (우측 정렬) */}
                {queue.length > 0 && (
                  <div className="flex justify-end pt-6 mt-6 border-t border-gray-200">
                    {queue.some(item => item.status === '대기') ? (
                      <Button
                        onClick={handleStartCompression}
                        variant="blue"
                      >
                        압축
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {}}
                        variant="gray"
                      >
                        압축
                      </Button>
                    )}
                  </div>
                )}
              </ContainerBox>
            </div>

            {/* 압축내역 영역 */}
            <div className="mt-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">압축내역</h1>
              
              <ContainerBox>
                <CommonTable 
                  data={history} 
                  emptyMessage="완료된 압축 내역이 없습니다."
                  mode="history"
                  onDownload={(item) => {
                    console.log('다운로드:', item.fileName);
                    // 여기에 실제 다운로드 로직 구현
                  }}
                />
              </ContainerBox>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}