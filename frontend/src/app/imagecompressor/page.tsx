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
import { createConvertJobs, subscribeSSEWithAuth, SSEEventData } from '@/service/imageCompressor';
import { useToast } from '@/components/ui/CommonToast';
import { useImageCompressorStore } from '@/store/imageCompressorStore';

export default function ImageCompressorPage() {
  const userName = useAuthStore((state) => state.user?.userName ?? '사용자');
  const { showToast } = useToast();
  const { fetchHistories } = useImageCompressorStore();
  const [selectedFiles, setSelectedFiles] = useState<FileInfo[]>([]);
  const [processingMethod, setProcessingMethod] = useState('cpu');
  const [algorithm, setAlgorithm] = useState('lzw');
  const [version, setVersion] = useState('1.0');
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const idCounterRef = useRef(0);
  const queueSectionRef = useRef<HTMLDivElement | null>(null);
  const previousStatusMapRef = useRef<Map<string, '대기' | '진행' | '완료'>>(new Map());
  const shownToastUuidsRef = useRef<Set<string>>(new Set()); // 이미 표시된 토스트 메시지 추적

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
    console.log('[압축] 파일 선택 시작:', files.length, '개 파일');
    
    const validFiles = files.filter(file => 
      file.type === 'image/bmp' || file.name.toLowerCase().endsWith('.bmp')
    );
    
    if (validFiles.length !== files.length) {
      console.warn('[압축] 일부 파일이 BMP 형식이 아닙니다:', files.length - validFiles.length, '개');
      showToast('BMP 파일만 업로드 가능합니다.', 'warning');
    }

    if (validFiles.length === 0) {
      console.warn('[압축] 유효한 파일이 없습니다.');
      return;
    }

    console.log('[압축] 유효한 파일:', validFiles.map(f => ({ name: f.name, size: f.size })));

    const filePromises = validFiles.map(async (file) => {
      try {
        console.log(`[압축] 파일 처리 시작: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
        
        // BMP 헤더에서 크기 정보 추출 (큰 파일도 처리 가능)
        const dimensions = await readBmpDimensions(file);
        console.log(`[압축] 파일 크기 추출 완료: ${file.name} - ${dimensions.width}x${dimensions.height}`);
        
        // 작은 파일만 미리보기 생성
        const preview = await createPreview(file);
        if (preview) {
          console.log(`[압축] 미리보기 생성 완료: ${file.name}`);
        } else {
          console.log(`[압축] 미리보기 건너뜀 (파일 크기 초과): ${file.name}`);
        }
        
        const fileInfo = {
          name: file.name,
          size: file.size,
          format: 'BMP',
          dimensions,
          preview: preview || '', // 미리보기가 없으면 빈 문자열
        } as FileInfo;
        
        console.log(`[압축] 파일 처리 완료: ${file.name}`, fileInfo);
        return fileInfo;
      } catch (error) {
        console.error(`[압축] 파일 처리 실패: ${file.name}`, error);
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
      console.log('[압축] 모든 파일 처리 완료:', fileInfos.length, '개');
      setSelectedFiles((prev) => {
        const updated = [...prev, ...fileInfos];
        console.log('[압축] 선택된 파일 목록 업데이트:', updated.length, '개');
        return updated;
      });
    }).catch((error) => {
      console.error('[압축] 파일 처리 중 오류:', error);
      showToast('일부 파일 처리에 실패했습니다.', 'error');
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
    console.log('[압축] 대기열 추가 시작:', fileInfos.length, '개 파일');
    console.log('[압축] 파일 정보:', fileInfos.map(f => ({
      fileName: f.fileName,
      algorithm: f.algorithm,
      version: f.version,
      processingMethod: f.processingMethod,
      size: f.bmpVolume,
      dimensions: `${f.bmpWidth}x${f.bmpHeight}`,
    })));

    if (fileInfos.length === 0) {
      console.warn('[압축] 추가할 파일이 없습니다.');
      showToast('파일을 먼저 선택해주세요.', 'warning');
      return;
    }

    try {
      const requestData = {
        createConvertRequests: fileInfos.map(fileInfo => ({
          bmpUrl: fileInfo.imageUrl,
          compressionTypeUuid: fileInfo.compressionTypeUuid,
          bmpVolume: fileInfo.bmpVolume,
          bmpWidth: fileInfo.bmpWidth,
          bmpHeight: fileInfo.bmpHeight,
        })),
      };
      
      console.log('[압축] API 요청 데이터:', JSON.stringify(requestData, null, 2));
      console.log('[압축] API 호출 시작: createConvertJobs');
      
      // API 호출
      const response = await createConvertJobs(requestData);
      
      console.log('[압축] API 응답 수신:', response);

      if (!response.isSuccess) {
        console.error('[압축] API 응답 실패:', response.message);
        throw new Error(response.message || '대기열 등록에 실패했습니다.');
      }

      console.log('[압축] API 호출 성공, 대기열 항목 생성 시작');

      // 성공 시 로컬 대기열에 추가
      const baseTime = Date.now();
      const newItems: QueueItem[] = fileInfos.map((fileInfo, index) => {
        idCounterRef.current += 1;
        const item: QueueItem = {
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
          estimatedTime: 10,
          progress: 0,
          bmpUrl: fileInfo.imageUrl,
          compressionTypeUuid: fileInfo.compressionTypeUuid,
          bmpWidth: fileInfo.bmpWidth,
          bmpHeight: fileInfo.bmpHeight,
        };
        console.log(`[압축] 대기열 항목 생성: ${item.fileName} (ID: ${item.id})`);
        return item;
      });

      console.log('[압축] 대기열에 항목 추가:', newItems.length, '개');
      setQueue((prev) => {
        const updated = [...prev, ...newItems];
        console.log('[압축] 전체 대기열 항목 수:', updated.length);
        return updated;
      });
      
      // 선택된 파일 초기화
      console.log('[압축] 선택된 파일 초기화');
      setSelectedFiles([]);

      // 대기열에 추가한 후 바로 압축 시작 (각 파일에 대해)
      // createConvertJobs가 이미 압축을 시작하므로 상태만 '진행'으로 변경
      console.log('[압축] 상태를 "진행"으로 변경 시작');
      setQueue((prev) => {
        const updated = [...prev];
        // 방금 추가한 항목들을 찾아서 '진행' 상태로 변경
        newItems.forEach((newItem) => {
          const index = updated.findIndex(item => item.id === newItem.id);
          if (index !== -1) {
            // 초기 상태 저장 (convertHistoryUuid가 있으면)
            if (updated[index].convertHistoryUuid) {
              previousStatusMapRef.current.set(updated[index].convertHistoryUuid, '대기');
            }
            console.log(`[압축] 상태 변경: ${newItem.fileName} - 대기 → 진행`);
            updated[index] = {
              ...updated[index],
              status: '진행' as const,
              startTime: new Date(),
            };
          }
        });
        return updated;
      });

      // 압축 시작 토스트 표시 (렌더링 완료 후)
      newItems.forEach((newItem) => {
        setTimeout(() => {
          console.log(`[압축] 토스트 표시: ${newItem.fileName} 압축 시작`);
          showToast(`${newItem.fileName} 압축이 시작되었습니다.`, 'info');
        }, 0);
      });

      console.log('[압축] 대기열 추가 완료');

      // 대기열 섹션으로 스크롤 이동 (중앙 정렬)
      // 렌더링 완료 후 스크롤을 보장하기 위해 다음 틱에 실행
      requestAnimationFrame(() => {
        if (queueSectionRef.current) {
          queueSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    } catch (error) {
      console.error('[압축] 대기열 등록 실패:', error);
      showToast(error instanceof Error ? error.message : '대기열 등록에 실패했습니다.', 'error');
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


  // SSE 연결 및 실시간 업데이트
  useEffect(() => {
    console.log('[압축] SSE 연결 초기화');
    
    const abortController = subscribeSSEWithAuth(
      (data: SSEEventData) => {
        console.log('[압축] SSE 메시지 수신:', {
          eventType: data.eventType || '없음',
          convertHistoryUuid: data.convertHistoryUuid,
          status: data.status,
          progress: data.progress,
          message: data.message,
          전체데이터: data,
        });
        
        // convertHistoryUuid가 있으면 큐에서 해당 항목 찾아서 업데이트
        if (data.convertHistoryUuid) {
          console.log(`[압축] convertHistoryUuid로 항목 찾기: ${data.convertHistoryUuid}`);
          
          // 이벤트 타입 또는 상태로 완료 여부 확인 (setQueue 밖에서 먼저 판단)
          const isCompleted = 
            data.eventType === 'COMPLETED' ||
            data.eventType === 'CONVERT_BMP_SUCCESS' || // 서버에서 보내는 완료 이벤트
            data.status === '완료' || 
            data.status === 'COMPLETED' ||
            data.status === 'SUCCESS' ||
            data.progress === 100;
          
          const isFailed = 
            data.eventType === 'CONVERT_BMP_FAILED' || // 서버에서 보내는 실패 이벤트
            data.status === '실패' ||
            data.status === 'FAILED';
          
          const isProcessing = 
            data.eventType === 'PROGRESS' ||
            data.status === '진행' || 
            data.status === 'PROCESSING';
          
          // 토스트 메시지를 저장할 객체 (참조로 공유)
          const toastInfo = { message: null as string | null, type: 'success' as 'success' | 'error' | 'info' | 'warning' };
          
          // 현재 큐에서 항목 찾기 및 업데이트
          setQueue((prev) => {
            // 1. convertHistoryUuid로 먼저 찾기
            let foundItem = prev.find(item => item.convertHistoryUuid === data.convertHistoryUuid);
            
            // 2. 못 찾으면 파일명으로 찾기 (tiffName과 비교)
            if (!foundItem && (data as any).tiffName) {
              const tiffName = (data as any).tiffName as string;
              const baseName = tiffName.replace('.tiff', '').replace('.TIFF', '');
              console.log(`[압축] convertHistoryUuid로 찾지 못함, 파일명으로 찾기 시도: ${baseName}`);
              
              foundItem = prev.find(item => {
                const itemBaseName = item.fileName.replace('.bmp', '').replace('.BMP', '');
                return itemBaseName === baseName && !item.convertHistoryUuid; // convertHistoryUuid가 없는 항목만
              });
              
              if (foundItem) {
                console.log(`[압축] 파일명으로 항목 찾음: ${foundItem.fileName} → ${baseName}`);
              }
            }
            
            if (!foundItem) {
              console.warn(`[압축] convertHistoryUuid에 해당하는 항목을 찾을 수 없음: ${data.convertHistoryUuid}`);
              console.log('[압축] 현재 대기열 항목들:', prev.map(item => ({
                id: item.id,
                fileName: item.fileName,
                convertHistoryUuid: item.convertHistoryUuid,
              })));
              console.log('[압축] SSE 메시지 데이터:', {
                convertHistoryUuid: data.convertHistoryUuid,
                tiffName: (data as any).tiffName,
              });
              return prev;
            }
            
            // 이전 상태 가져오기 (convertHistoryUuid가 있으면 맵에서, 없으면 현재 상태 사용)
            const previousStatus: '대기' | '진행' | '완료' = 
              (data.convertHistoryUuid && previousStatusMapRef.current.get(data.convertHistoryUuid)) || foundItem.status;
            
            console.log(`[압축] 항목 업데이트 시작: ${foundItem.fileName}`, {
              이전상태: previousStatus,
              현재상태: foundItem.status,
              이벤트타입: data.eventType,
              진행률: data.progress,
            });
            
            console.log(`[압축] 상태 판단: ${foundItem.fileName}`, {
              isCompleted,
              isFailed,
              isProcessing,
              eventType: data.eventType,
              status: data.status,
              progress: data.progress,
            });
            
            // 토스트 메시지 결정 (이미 설정되지 않은 경우에만)
            if (!toastInfo.message) {
              if (isCompleted) {
                // CONVERT_BMP_SUCCESS 이벤트이거나 상태가 변경된 경우 토스트 메시지 표시
                if (data.eventType === 'CONVERT_BMP_SUCCESS' || previousStatus !== '완료') {
                  toastInfo.message = `${foundItem.fileName} 압축이 완료되었습니다.`;
                  toastInfo.type = 'success';
                  console.log(`[압축] 완료 토스트 메시지 준비: ${toastInfo.message}`, {
                    eventType: data.eventType,
                    previousStatus,
                  });
                }
              } else if (isFailed) {
                if (previousStatus !== '완료') {
                  toastInfo.message = `${foundItem.fileName} 압축에 실패했습니다.`;
                  toastInfo.type = 'error';
                  console.log(`[압축] 실패 토스트 메시지 준비: ${toastInfo.message}`);
                }
              } else if (isProcessing) {
                if (previousStatus !== '진행') {
                  toastInfo.message = `${foundItem.fileName} 압축이 시작되었습니다.`;
                  toastInfo.type = 'info';
                  console.log(`[압축] 시작 토스트 메시지 준비: ${toastInfo.message}`);
                }
              }
            }
            
            // 완료된 항목은 큐에서 제거, 나머지는 업데이트
            const updatedQueue = prev
              .map((item) => {
                // convertHistoryUuid로 매칭하거나, 파일명으로 찾은 항목인 경우
                const isMatching = 
                  (item.convertHistoryUuid === data.convertHistoryUuid && data.convertHistoryUuid) ||
                  (item.id === foundItem!.id); // 파일명으로 찾은 경우
                
                if (isMatching) {
                  const updated: QueueItem = { ...item };
                  
                  // convertHistoryUuid가 없으면 저장
                  if (!updated.convertHistoryUuid && data.convertHistoryUuid) {
                    updated.convertHistoryUuid = data.convertHistoryUuid;
                    console.log(`[압축] convertHistoryUuid 저장: ${item.fileName} - ${data.convertHistoryUuid}`);
                  }
                  
                  // 진행률 업데이트
                  if (data.progress !== undefined) {
                    const oldProgress = updated.progress;
                    updated.progress = data.progress;
                    console.log(`[압축] 진행률 업데이트: ${item.fileName} - ${oldProgress}% → ${data.progress}%`);
                  }
                  
                  // 상태 업데이트
                  if (isCompleted) {
                    updated.status = '완료' as const;
                    updated.progress = 100;
                    console.log(`[압축] 상태 변경: ${item.fileName} - ${previousStatus} → 완료 (이벤트: ${data.eventType})`);
                  } else if (isFailed) {
                    updated.status = '완료' as const; // 실패도 완료 상태로 표시 (또는 별도 상태로 처리 가능)
                    console.log(`[압축] 상태 변경: ${item.fileName} - ${previousStatus} → 실패 (이벤트: ${data.eventType})`);
                  } else if (isProcessing) {
                    updated.status = '진행';
                    if (!updated.startTime) {
                      updated.startTime = new Date();
                      console.log(`[압축] 시작 시간 설정: ${item.fileName} - ${updated.startTime}`);
                    }
                    console.log(`[압축] 상태 변경: ${item.fileName} - ${previousStatus} → 진행`);
                  } else if (data.status === '대기' || data.status === 'WAITING') {
                    updated.status = '대기';
                    console.log(`[압축] 상태 변경: ${item.fileName} - ${previousStatus} → 대기`);
                  }
                  
                  // 이전 상태 저장
                  if (data.convertHistoryUuid) {
                    previousStatusMapRef.current.set(data.convertHistoryUuid, updated.status);
                  }
                  
                  console.log(`[압축] 항목 업데이트 완료: ${item.fileName}`, {
                    최종상태: updated.status,
                    최종진행률: updated.progress,
                    convertHistoryUuid: updated.convertHistoryUuid,
                  });
                  
                  return updated;
                }
                return item;
              })
              .filter((item) => {
                // 완료된 항목은 큐에서 제거
                const isCompletedItem = isCompleted && (
                  item.convertHistoryUuid === data.convertHistoryUuid ||
                  item.id === foundItem!.id // 파일명으로 찾은 경우도 포함
                );
                
                if (isCompletedItem) {
                  console.log(`[압축] 완료된 항목 큐에서 제거: ${item.fileName}`);
                  return false;
                }
                return true;
              });
            
            console.log(`[압축] 큐 업데이트 완료: ${prev.length}개 → ${updatedQueue.length}개`);
            
            // setQueue 내부에서 토스트 메시지 표시 (동기적으로 실행되므로 즉시 표시 가능)
            // convertHistoryUuid를 기준으로 이미 표시된 토스트는 다시 표시하지 않음
            if (toastInfo.message && data.convertHistoryUuid && !shownToastUuidsRef.current.has(data.convertHistoryUuid)) {
              shownToastUuidsRef.current.add(data.convertHistoryUuid);
              console.log(`[압축] 토스트 표시 예정: ${toastInfo.message} (UUID: ${data.convertHistoryUuid})`);
              // setTimeout을 사용하여 상태 업데이트 후 토스트 표시
              setTimeout(() => {
                console.log(`[압축] 토스트 표시 실행: ${toastInfo.message}`);
                showToast(toastInfo.message!, toastInfo.type);
              }, 100);
            } else if (toastInfo.message && data.convertHistoryUuid && shownToastUuidsRef.current.has(data.convertHistoryUuid)) {
              console.log(`[압축] 토스트 메시지 이미 표시됨, 건너뜀: ${toastInfo.message} (UUID: ${data.convertHistoryUuid})`);
            }
            
            return updatedQueue;
          });
          
          // 완료된 경우 압축 내역 목록 자동 새로고침
          if (isCompleted && (data.eventType === 'CONVERT_BMP_SUCCESS' || data.status === '완료' || data.status === 'COMPLETED' || data.status === 'SUCCESS')) {
            console.log('[압축] 압축 완료 감지 - 내역 목록 새로고침 시작');
            setTimeout(() => {
              fetchHistories({ page: 0, size: 10000 }).then(() => {
                console.log('[압축] 압축 내역 목록 새로고침 완료');
              }).catch((error) => {
                console.error('[압축] 압축 내역 목록 새로고침 실패:', error);
              });
            }, 1000); // 상태 업데이트 후 약간의 지연을 두고 새로고침 (서버 반영 시간 고려)
          }
        } else {
          console.warn('[압축] convertHistoryUuid가 없는 SSE 메시지:', data);
        }
      },
      (error) => {
        console.error('[압축] SSE 연결 오류:', error);
      }
    );

    return () => {
      console.log('[압축] SSE 연결 정리');
      abortController.abort();
    };
  }, [showToast]);

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
                onStartCompression={() => {}}
                isStarting={false}
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