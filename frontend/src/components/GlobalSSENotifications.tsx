'use client';

import { useCallback, useRef } from 'react';
import { useSSESubscription } from '@/contexts/SSEContext';
import { SSEEventData } from '@/service/globalSSEService';
import { useToast } from '@/components/ui/CommonToast';

/**
 * 전역 SSE 알림 컴포넌트
 * 모든 페이지에서 압축/패턴 생성 완료 알림을 받을 수 있도록 함
 */
export function GlobalSSENotifications() {
  const { showToast } = useToast();
  const shownToastUuidsRef = useRef<Set<string>>(new Set()); // 중복 토스트 방지

  // 전역 SSE 구독 - 모든 완료 이벤트에 대해 토스트 알림 표시
  useSSESubscription(
    'global-notifications',
    useCallback((data: SSEEventData) => {
      // bmpKey에서 generationUuid 추출 (bmpKey 형식: 'bmp/xxx_generationUuid.')
      let generationUuid = data.generationUuid;
      if (!generationUuid && (data as any).bmpKey) {
        const bmpKey = (data as any).bmpKey as string;
        const uuidMatch = bmpKey.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
        if (uuidMatch) {
          generationUuid = uuidMatch[0];
          console.log('[전역 알림] bmpKey에서 generationUuid 추출:', generationUuid);
        }
      }

      // 압축 완료 이벤트 확인
      const isCompressionCompleted = 
        data.convertHistoryUuid &&
        (data.eventType === 'COMPLETED' ||
         data.eventType === 'CONVERT_BMP_SUCCESS' ||
         data.status === '완료' ||
         data.status === 'COMPLETED' ||
         data.status === 'SUCCESS' ||
         data.progress === 100);

      // 패턴 생성 시작 이벤트 확인
      const isPatternStarted = 
        (generationUuid || data.eventType === 'GENERATE_BMP_START' || data.eventType === 'PROGRESS' || data.eventType === 'GENERATE_BMP_PROGRESS') &&
        (
          data.eventType === 'GENERATE_BMP_START' ||
          data.eventType === 'PROGRESS' ||
          data.eventType === 'GENERATE_BMP_PROGRESS' ||
          data.status === '진행' ||
          data.status === '진행중' ||
          data.status === 'PROCESSING' ||
          data.status === 'IN_PROGRESS' ||
          (data.progress !== undefined && data.progress >= 0 && data.progress < 100)
        );

      // 패턴 생성 완료 이벤트 확인 (eventType과 status 모두 확인)
      const isPatternCompleted = 
        (generationUuid || data.eventType === 'GENERATE_BMP_SUCCESS') &&
        (data.eventType === 'GENERATE_BMP_SUCCESS' ||
         data.eventType === 'COMPLETED' ||
         data.status === 'COMPLETED' ||
         data.status === '완료' ||
         data.status === 'Success' ||
         data.status === 'SUCCESS' ||
         data.progress === 100);
      
      // 압축 완료 또는 패턴 생성 완료 이벤트만 로그 출력
      if (isCompressionCompleted || isPatternCompleted) {
        console.log('[전역 알림] SSE 이벤트 수신:', data);
      }
      
      // 패턴 생성 실패 이벤트 확인
      // 단, message가 'SSE_GENERATION_FAILED'이고 generationUuid가 있는 경우는
      // 서버에서 잘못된 이벤트를 보낸 것일 수 있으므로 실패로 처리하지 않음
      const isPatternFailed = 
        generationUuid &&
        (data.eventType === 'GENERATE_BMP_FAILED' ||
         (data.eventType === 'SSE_GENERATION_FAILED' && data.message !== 'SSE_GENERATION_FAILED') ||
         data.status === 'FAILED' ||
         data.status === '실패') &&
        !(generationUuid && data.message === 'SSE_GENERATION_FAILED');

      // 압축 완료 알림은 각 페이지(예: 압축 페이지)에서 별도 처리하므로
      // 전역 토스트를 표시하지 않음 (중복 방지)
      if (isCompressionCompleted && data.convertHistoryUuid) {
        console.log('[전역 알림] 압축 완료 이벤트 감지 - 페이지에서 자체 처리하도록 건너뜀:', data.convertHistoryUuid);
      }

      // 패턴 생성 시작 알림 및 목록 새로고침
      if (isPatternStarted) {
        const uuid = generationUuid ?? (data as any).generationUuid ?? 'unknown';
        // 중복 방지를 위해 시작 이벤트는 한 번만 처리 (UUID가 없으면 중복 제거 불가)
        const key = uuid === 'unknown' ? `pattern-started-${Date.now()}` : `pattern-started-${uuid}`;
        if (!shownToastUuidsRef.current.has(key)) {
          if (uuid !== 'unknown') {
            shownToastUuidsRef.current.add(key);
          }
          
          console.log('[전역 알림] 패턴 생성 시작 감지:', generationUuid ?? data);
          // 목록 새로고침 이벤트 발생 (새 작업이 위로 오도록 첫 페이지로 이동)
          window.dispatchEvent(new CustomEvent('refreshBmpList', { detail: { resetPage: true } }));
          
          if (uuid !== 'unknown') {
            // 10초 후 UUID 제거 (같은 작업이 다시 시작될 수 있으므로)
            setTimeout(() => {
              shownToastUuidsRef.current.delete(key);
            }, 10000);
          }
        }
      }

      // 패턴 생성 완료 알림
      if (isPatternCompleted && generationUuid) {
        const uuid = generationUuid;
        // 중복 알림 방지
        if (!shownToastUuidsRef.current.has(`pattern-success-${uuid}`)) {
          shownToastUuidsRef.current.add(`pattern-success-${uuid}`);
          
          console.log('[전역 알림] 패턴 생성 완료 알림 표시:', uuid);
          showToast('패턴 생성이 완료되었습니다.', 'success');
          
          // 목록 새로고침 이벤트 발생
          window.dispatchEvent(new Event('refreshBmpList'));
          
          // 1분 후 UUID 제거
          setTimeout(() => {
            shownToastUuidsRef.current.delete(`pattern-success-${uuid}`);
          }, 60000);
        } else {
          console.log('[전역 알림] 이미 표시된 패턴 생성 완료 알림:', uuid);
        }
      } else if (isPatternCompleted && !generationUuid) {
        console.warn('[전역 알림] 패턴 생성 완료 이벤트이지만 generationUuid가 없음:', data);
      }
      
      // 패턴 생성 실패 알림
      if (isPatternFailed && generationUuid) {
        const uuid = generationUuid;
        // 중복 알림 방지
        if (!shownToastUuidsRef.current.has(`pattern-failed-${uuid}`)) {
          shownToastUuidsRef.current.add(`pattern-failed-${uuid}`);
          
          showToast('패턴 생성에 실패했습니다.', 'error');
          
          // 1분 후 UUID 제거
          setTimeout(() => {
            shownToastUuidsRef.current.delete(`pattern-failed-${uuid}`);
          }, 60000);
        }
      }
    }, [showToast]),
    useCallback((error: Error) => {
      console.error('[전역 알림] SSE 연결 오류:', error);
    }, [])
  );

  return null; // UI를 렌더링하지 않음
}

