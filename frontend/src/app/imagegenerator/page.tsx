'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/sidebar';
import Navbar from '@/components/layout/navbar';
import PatternGenerator from './components/PatternGenerator';
import PatternList from './components/PatternList';
import Button from '@/components/ui/CommonButton';
import { useImageGeneratorStore } from '@/store/imageGeneratorStore';
import { createBmpPattern, subscribeSSEWithAuth, SSEEventData } from '@/service/imageGenerator';
import AuthGuard from '@/components/auth/AuthGuard';
import { useToast } from '@/components/ui/CommonToast';

export default function PatternGeneratorPage() {
  const form = useImageGeneratorStore((s) => s.form);
  const generatedCount = useImageGeneratorStore((s) => s.generatedCount);
  const addJob = useImageGeneratorStore((s) => s.addJob);
  const updateJobProgress = useImageGeneratorStore((s) => s.updateJobProgress);
  const markJobDone = useImageGeneratorStore((s) => s.markJobDone);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const [sseControllers, setSseControllers] = useState<Map<string, AbortController>>(new Map());
  const { showToast } = useToast();

  // 메시지 자동 숨김
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000); // 5초 후 자동 숨김
      return () => clearTimeout(timer);
    }
  }, [message]);

  // 컴포넌트 언마운트 시 SSE 연결 정리
  useEffect(() => {
    return () => {
      sseControllers.forEach((controller) => {
        controller.abort();
      });
    };
  }, [sseControllers]);

  // 유효성 검사 함수
  const validateForm = (): { isValid: boolean; message?: string } => {
    // 1. 이미지 크기 필수 검사
    if (form.imageSize.w === "" || form.imageSize.h === "") {
      return { isValid: false, message: "이미지 크기(너비, 높이)를 모두 입력해주세요." };
    }

    const imageW = Number(form.imageSize.w);
    const imageH = Number(form.imageSize.h);
    if (!Number.isFinite(imageW) || imageW <= 0 || !Number.isFinite(imageH) || imageH <= 0) {
      return { isValid: false, message: "이미지 크기는 0보다 큰 숫자여야 합니다." };
    }

    // 2. R, G, B 중 최소 하나는 size 값이 있어야 함
    const hasR = form.channels.R.size.x !== "" && form.channels.R.size.y !== "";
    const hasG = form.channels.G.size.x !== "" && form.channels.G.size.y !== "";
    const hasB = form.channels.B.size.x !== "" && form.channels.B.size.y !== "";

    if (!hasR && !hasG && !hasB) {
      return { isValid: false, message: "R, G, B 중 최소 하나의 채널 크기를 입력해주세요." };
    }

    return { isValid: true };
  };

  const handleGenerate = async () => {
    // 유효성 검사
    const validation = validateForm();
    if (!validation.isValid) {
      setMessage({ text: validation.message || '입력 값을 확인해주세요.', type: 'error' });
      return;
    }

    try {
      setIsLoading(true);
      setMessage(null); // 이전 메시지 제거
      // API 호출
      const response = await createBmpPattern(form);
      
      // 성공 시 job 추가 (API 응답의 generationUuid를 전달)
      if (response.isSuccess && response.result) {
        const generationUuid = response.result.generationUuid;
        const jobId = addJob(undefined, generationUuid);
        
        // SSE 연결 시작
        console.log('SSE 연결 시작:', generationUuid);
        const sseController = subscribeSSEWithAuth(
          (data: SSEEventData) => {
            console.log('SSE 이벤트 수신:', data);
            // SSE 이벤트 처리
            if (data.progress !== undefined) {
              console.log('진행률 업데이트:', data.progress);
              // progress 업데이트
              updateJobProgress(jobId, data.progress);
            }
            
            // 완료 상태 확인 (여러 가능한 상태 값 체크)
            const isCompleted = 
              data.status === 'COMPLETED' || 
              data.status === '완료' || 
              data.status === 'Success' ||
              data.status === 'SUCCESS' ||
              data.progress === 100;
            
            if (isCompleted) {
              console.log('SSE 완료 이벤트:', data);
              // 완료 처리
              markJobDone(jobId);
              // 완료 토스트 알림
              showToast('패턴 생성이 완료되었습니다.');
              // SSE 연결 종료
              sseController.abort();
              setSseControllers((prev) => {
                const next = new Map(prev);
                next.delete(jobId);
                return next;
              });
              // 목록 새로고침
              window.dispatchEvent(new Event('refreshBmpList'));
            }
          },
          (error: Error) => {
            console.error('SSE 연결 오류:', error);
            setSseControllers((prev) => {
              const next = new Map(prev);
              next.delete(jobId);
              return next;
            });
          }
        );

        // SSE 컨트롤러 저장
        setSseControllers((prev) => {
          const next = new Map(prev);
          next.set(jobId, sseController);
          return next;
        });

        // 목록 새로고침 (첫 페이지로 이동)
        window.dispatchEvent(new CustomEvent('refreshBmpList', { detail: { resetPage: true } }));
        showToast('패턴 생성이 시작되었습니다.');
        console.log('패턴 생성 성공:', generationUuid);
      }
    } catch (error) {
      console.error('패턴 생성 실패:', error);
      setMessage({ 
        text: error instanceof Error ? error.message : '패턴 생성에 실패했습니다.', 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="flex h-screen bg-gray-50">
      {/* 🔹 Sidebar */}
      <Sidebar />

      {/* 🔹 Main Content */}
      <div className="flex-1 flex flex-col">
        <Navbar />

        <main className="flex-1 p-6 overflow-y-auto">
          {/* 메시지 표시 영역 */}
          {message && (
            <div
              className={`
                mb-4 p-4 rounded-lg shadow-md flex items-center justify-between
                transition-all duration-300
                ${message.type === 'error' 
                  ? 'bg-red-50 border border-red-200 text-red-800' 
                  : 'bg-green-50 border border-green-200 text-green-800'
                }
              `}
            >
              <span className="flex items-center gap-2">
                {message.type === 'error' ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {message.text}
              </span>
              <button
                onClick={() => setMessage(null)}
                className={`
                  ml-4 p-1 rounded hover:bg-opacity-20 transition-colors
                  ${message.type === 'error' ? 'hover:bg-red-200' : 'hover:bg-green-200'}
                `}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}

          {/* 상단: 입력 영역 - 전체 폭 사용 */}
          <div className="mb-4">
            <PatternGenerator />
          </div>

          {/* 하단 정보 및 버튼 - 반응형 정렬 */}
          <div className="flex flex-row justify-end items-center gap-2 md:gap-4">
            <Button variant="blue" onClick={handleGenerate} disabled={isLoading}>
              {isLoading ? '생성 중...' : '생성하기'}
            </Button>
          </div>

          {/* 하단: 목록 테이블 */}
          <PatternList />
        </main>
      </div>
    </div>
    </AuthGuard>
  );
}
