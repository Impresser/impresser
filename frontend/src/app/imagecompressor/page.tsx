'use client';

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/layout/sidebar';
import Navbar from '@/components/layout/navbar';
import CommonTable, { QueueItem } from '@/components/ui/CommonTable';
import AuthGuard from '@/components/auth/AuthGuard';
import CompressionSettings, {
  FileInfo,
} from './components/CompressionSettings';
import CompressionQueue from './components/CompressionQueue';
import CompressionHistory from './components/CompressionHistory';

export default function ImageCompressorPage() {
  const userName = '홍길동'; // 로그인한 유저명
  const [selectedFiles, setSelectedFiles] = useState<FileInfo[]>([]);
  const [processingMethod, setProcessingMethod] = useState('cpu');
  const [algorithm, setAlgorithm] = useState('lzw');
  const [version, setVersion] = useState('1.0');
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const idCounterRef = useRef(0);
  const queueSectionRef = useRef<HTMLDivElement | null>(null);

  const handleFileSelect = (files: File[]) => {
    const validFiles = files.filter(file => file.type === 'image/bmp');
    
    if (validFiles.length !== files.length) {
      alert('BMP 파일만 업로드 가능합니다.');
    }

    if (validFiles.length === 0) return;

    const filePromises = validFiles.map((file) => {
      return new Promise<FileInfo>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            resolve({
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
      });
    });

    Promise.all(filePromises).then((fileInfos) => {
      setSelectedFiles((prev) => [...prev, ...fileInfos]);
    });
  };

  const handleAddToQueue = () => {
    if (selectedFiles.length === 0) {
      alert('파일을 먼저 선택해주세요.');
      return;
    }

    const baseTime = Date.now();
    const newItems: QueueItem[] = selectedFiles.map((file, index) => {
      idCounterRef.current += 1;
      return {
        id: `${baseTime}-${idCounterRef.current}-${index}`,
        fileName: file.name,
        processingMethod: processingMethod.toUpperCase(),
        algorithm: algorithm,
        version: version,
        fileSize: file.size,
        status: '대기' as const,
        assignedUser: userName,
        startTime: null,
        elapsedTime: 0,
        estimatedTime: 0,
        progress: 0,
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
          estimatedTime: 10, // 예상 시간 10초로 설정 (임시)
        };
      }
      return updated;
    });
  };

  const handleUpdateQueueItem = (id: string, field: 'algorithm' | 'version' | 'processingMethod', value: string) => {
    setQueue((prev) => {
      return prev.map((item) => {
        if (item.id === id && item.status === '대기') {
          return {
            ...item,
            [field]: value,
          };
        }
        return item;
      });
    });
  };

  // 경과시간 업데이트 및 완료 처리를 위한 useEffect
  useEffect(() => {
    const interval = setInterval(() => {
      setQueue((prev) => {
        let hasCompleted = false;
        
        const updated = prev.map((item) => {
          if (item.status === '진행' && item.startTime) {
            const elapsed = Math.floor((Date.now() - item.startTime.getTime()) / 1000);
            const progress = item.estimatedTime > 0 
              ? Math.min(100, Math.floor((elapsed / item.estimatedTime) * 100))
              : 0;
            
            // 진행률이 100%에 도달하면 완료 처리
            if (progress >= 100) {
              hasCompleted = true;
              
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

        // 완료된 아이템들은 API를 통해 조회되므로 여기서는 처리하지 않음
        // 필요시 CompressionHistory 컴포넌트에서 API를 다시 호출하도록 함

        // 완료된 항목이 있고, 진행 중인 항목이 없으면 다음 대기 항목 자동 시작
        if (hasCompleted) {
          const hasProcessing = updated.some(item => item.status === '진행');
          if (!hasProcessing) {
            const waitingIndex = updated.findIndex(item => item.status === '대기');
            if (waitingIndex !== -1) {
              updated[waitingIndex] = {
                ...updated[waitingIndex],
                status: '진행',
                startTime: new Date(),
                estimatedTime: 10, // 예상 시간 10초로 설정 (임시)
              };
            }
          }
        }

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
        <Navbar userName="홍길동" />
        
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
                onUpdateQueueItem={handleUpdateQueueItem}
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