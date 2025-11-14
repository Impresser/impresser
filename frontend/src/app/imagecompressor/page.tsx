'use client';

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/layout/sidebar';
import Navbar from '@/components/layout/navbar';
import CommonTable, { QueueItem } from '@/components/ui/CommonTable';
import AuthGuard from '@/components/auth/AuthGuard';
import CompressionSettings from './components/CompressionSettings';
import { FileInfo } from '@/types/imageCompressor';
import CompressionQueue from './components/CompressionQueue';
import CompressionHistory from './components/CompressionHistory';
import { useAuthStore } from '@/store/authStore';
import { createConvert, createConvertJobs } from '@/service/imageCompressor';

export default function ImageCompressorPage() {
  const userName = useAuthStore((state) => state.user?.userName ?? '사용자');
  const [selectedFiles, setSelectedFiles] = useState<FileInfo[]>([]);
  const [processingMethod, setProcessingMethod] = useState('cpu');
  const [algorithm, setAlgorithm] = useState('lzw');
  const [version, setVersion] = useState('1.0');
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isStartingCompression, setIsStartingCompression] = useState(false);
  const idCounterRef = useRef(0);
  const queueSectionRef = useRef<HTMLDivElement | null>(null);

  // BMP 파일 헤더에서 이미지 크기 추출 (처음 26바이트만 읽음)
  const readBmpDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const view = new DataView(arrayBuffer);
          
          // BMP 파일 시그니처 확인 (BM)
          const signature = String.fromCharCode(view.getUint8(0), view.getUint8(1));
          if (signature !== 'BM') {
            reject(new Error('유효하지 않은 BMP 파일입니다.'));
            return;
          }
          
          // BMP 헤더에서 width, height 읽기 (오프셋 18-25)
          const width = view.getInt32(18, true); // little-endian
          const height = view.getInt32(22, true); // little-endian
          
          resolve({ width: Math.abs(width), height: Math.abs(height) });
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('파일 읽기 실패'));
      };
      
      // 처음 26바이트만 읽어서 헤더 정보 추출
      const blob = file.slice(0, 26);
      reader.readAsArrayBuffer(blob);
    });
  };

  // 작은 파일의 경우 미리보기 생성
  const createPreview = (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      // 10MB 이상 파일은 미리보기 생성하지 않음
      if (file.size > 10 * 1024 * 1024) {
        resolve(null);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          resolve(e.target?.result as string);
        };
        img.onerror = () => {
          resolve(null);
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        resolve(null);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = (files: File[]) => {
    const validFiles = files.filter(file => 
      file.type === 'image/bmp' || file.name.toLowerCase().endsWith('.bmp')
    );
    
    if (validFiles.length !== files.length) {
      alert('BMP 파일만 업로드 가능합니다.');
    }

    if (validFiles.length === 0) return;

    const filePromises = validFiles.map(async (file) => {
      try {
        // BMP 헤더에서 크기 정보 추출 (큰 파일도 처리 가능)
        const dimensions = await readBmpDimensions(file);
        
        // 작은 파일만 미리보기 생성
        const preview = await createPreview(file);
        
        return {
          name: file.name,
          size: file.size,
          format: 'BMP',
          dimensions,
          preview: preview || '', // 미리보기가 없으면 빈 문자열
        } as FileInfo;
      } catch (error) {
        console.error(`파일 ${file.name} 처리 실패:`, error);
        // 에러가 발생해도 기본 정보는 반환
        return {
          name: file.name,
          size: file.size,
          format: 'BMP',
          dimensions: { width: 0, height: 0 },
          preview: '',
        } as FileInfo;
      }
    });

    Promise.all(filePromises).then((fileInfos) => {
      setSelectedFiles((prev) => [...prev, ...fileInfos]);
    }).catch((error) => {
      console.error('파일 처리 중 오류:', error);
      alert('일부 파일 처리에 실패했습니다.');
    });
  };

  const handleAddToQueue = async (fileInfos: Array<{
    fileName: string;
    imageUrl: string;
    compressionTypeUuid: string;
    bmpVolume: number;
    bmpWidth: number;
    bmpHeight: number;
    algorithm: string;
    version: string;
    processingMethod: string;
  }>) => {
    if (fileInfos.length === 0) {
      alert('파일을 먼저 선택해주세요.');
      return;
    }

    try {
      // API 호출
      const response = await createConvertJobs({
        createConvertRequests: fileInfos.map(fileInfo => ({
          bmpUrl: fileInfo.imageUrl,
          compressionTypeUuid: fileInfo.compressionTypeUuid,
          bmpVolume: fileInfo.bmpVolume,
          bmpWidth: fileInfo.bmpWidth,
          bmpHeight: fileInfo.bmpHeight,
        })),
      });

      if (!response.isSuccess) {
        throw new Error(response.message || '대기열 등록에 실패했습니다.');
      }

      // 성공 시 로컬 대기열에 추가
      const baseTime = Date.now();
      const newItems: QueueItem[] = fileInfos.map((fileInfo, index) => {
        idCounterRef.current += 1;
        return {
          id: `${baseTime}-${idCounterRef.current}-${index}`,
          fileName: fileInfo.fileName,
          processingMethod: fileInfo.processingMethod.toUpperCase(),
          algorithm: fileInfo.algorithm,
          version: fileInfo.version,
          fileSize: fileInfo.bmpVolume,
          status: '대기' as const,
          assignedUser: userName,
          startTime: null,
          elapsedTime: 0,
          estimatedTime: 0,
          progress: 0,
          bmpUrl: fileInfo.imageUrl,
          compressionTypeUuid: fileInfo.compressionTypeUuid,
          bmpWidth: fileInfo.bmpWidth,
          bmpHeight: fileInfo.bmpHeight,
        };
      });

      setQueue((prev) => [...prev, ...newItems]);
      
      // 선택된 파일 초기화
      setSelectedFiles([]);

      // 대기열 섹션으로 스크롤 이동 (중앙 정렬)
      // 렌더링 완료 후 스크롤을 보장하기 위해 다음 틱에 실행
      requestAnimationFrame(() => {
        if (queueSectionRef.current) {
          queueSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    } catch (error) {
      console.error('대기열 등록 실패:', error);
      alert(error instanceof Error ? error.message : '대기열 등록에 실패했습니다.');
    }
  };

  const handleFileRemove = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileReorder = (fromIndex: number, toIndex: number) => {
    setSelectedFiles((prev) => {
      const newFiles = [...prev];
      const [removed] = newFiles.splice(fromIndex, 1);
      newFiles.splice(toIndex, 0, removed);
      return newFiles;
    });
  };

  const handleStartCompression = async () => {
    if (isStartingCompression) {
      return;
    }

    const processingExists = queue.some(item => item.status === '진행');
    if (processingExists) {
      alert('이미 진행 중인 작업이 있습니다.');
      return;
    }

    const waitingIndex = queue.findIndex(item => item.status === '대기');
    if (waitingIndex === -1) {
      alert('대기 중인 작업이 없습니다.');
      return;
    }

    const targetItem = queue[waitingIndex];
    if (!targetItem.bmpUrl || !targetItem.compressionTypeUuid) {
      alert('필수 변환 정보가 없습니다. 다시 대기열에 추가해주세요.');
      return;
    }

    setIsStartingCompression(true);
    try {
      const response = await createConvert({
        bmpUrl: targetItem.bmpUrl,
        compressionTypeUuid: targetItem.compressionTypeUuid,
        bmpVolume: targetItem.fileSize,
        bmpWidth: targetItem.bmpWidth ?? 0,
        bmpHeight: targetItem.bmpHeight ?? 0,
      });

      if (!response.isSuccess || !response.result) {
        throw new Error(response.message || '압축 요청에 실패했습니다.');
      }

      const convertHistoryUuid = response.result.convertHistoryUuid;

      setQueue((prev) => {
        const updated = [...prev];
        if (updated[waitingIndex]) {
          updated[waitingIndex] = {
            ...updated[waitingIndex],
            status: '진행',
            startTime: new Date(),
            estimatedTime: 10,
            convertHistoryUuid,
          };
        }
        return updated;
      });
    } catch (error) {
      console.error('압축 요청 실패:', error);
      alert(error instanceof Error ? error.message : '압축 요청에 실패했습니다.');
    } finally {
      setIsStartingCompression(false);
    }
  };

  // 경과시간 업데이트 및 완료 처리를 위한 useEffect
  useEffect(() => {
    const interval = setInterval(() => {
      setQueue((prev) => {
        const updated = prev.map((item) => {
          if (item.status === '진행' && item.startTime) {
            const elapsed = Math.floor((Date.now() - item.startTime.getTime()) / 1000);
            const progress = item.estimatedTime > 0 
              ? Math.min(100, Math.floor((elapsed / item.estimatedTime) * 100))
              : 0;
            
            // 진행률이 100%에 도달하면 완료 처리
            if (progress >= 100) {
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

        return updated;
      });
    }, 1000); // 1초마다 업데이트

    return () => clearInterval(interval);
  }, []);

  return (
    <AuthGuard>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Navigation Bar */}
        <Navbar />
        
        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto overflow-x-hidden">
          <div className="w-full">
            {/* 압축 이미지 영역 */}
            <CompressionSettings
              selectedFiles={selectedFiles}
              algorithm={algorithm}
              version={version}
              processingMethod={processingMethod}
              onFileSelect={handleFileSelect}
              onFileRemove={handleFileRemove}
              onFileReorder={handleFileReorder}
              onProcessingMethodChange={setProcessingMethod}
              onAlgorithmChange={setAlgorithm}
              onVersionChange={setVersion}
              onAddToQueue={handleAddToQueue}
            />

            {/* 압축대기열 영역 */}
            <div ref={queueSectionRef}>
              <CompressionQueue
                queue={queue}
                onStartCompression={handleStartCompression}
                isStarting={isStartingCompression}
              />
            </div>

            {/* 압축내역 영역 */}
            <CompressionHistory />
          </div>
        </main>
      </div>
    </div>
    </AuthGuard>
  );
}