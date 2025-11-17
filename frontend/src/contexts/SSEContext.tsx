'use client';

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { globalSSEService, SSEEventData } from '@/service/globalSSEService';

type SSEEventHandler = (data: SSEEventData) => void;
type SSEErrorHandler = (error: Error) => void;

interface SSEContextValue {
  subscribe: (id: string, onMessage: SSEEventHandler, onError?: SSEErrorHandler) => () => void;
  isConnected: () => boolean;
  getListenerCount: () => number;
}

const SSEContext = createContext<SSEContextValue | null>(null);

export function SSEProvider({ children }: { children: React.ReactNode }) {
  const contextValue: SSEContextValue = {
    subscribe: (id: string, onMessage: SSEEventHandler, onError?: SSEErrorHandler) => {
      return globalSSEService.subscribe(id, onMessage, onError);
    },
    isConnected: () => globalSSEService.isConnected(),
    getListenerCount: () => globalSSEService.getListenerCount(),
  };

  // 컴포넌트 언마운트 시 연결 정리 (필요한 경우)
  useEffect(() => {
    return () => {
      // 모든 리스너가 해제되면 자동으로 연결이 종료되므로
      // 여기서는 별도 처리가 필요 없음
    };
  }, []);

  return (
    <SSEContext.Provider value={contextValue}>
      {children}
    </SSEContext.Provider>
  );
}

export function useSSE() {
  const context = useContext(SSEContext);
  if (!context) {
    throw new Error('useSSE must be used within SSEProvider');
  }
  return context;
}

/**
 * 컴포넌트에서 SSE 이벤트를 구독하는 훅
 * @param id 리스너 고유 ID (컴포넌트별로 고유해야 함)
 * @param onMessage 메시지 수신 핸들러
 * @param onError 에러 핸들러 (선택)
 */
export function useSSESubscription(
  id: string,
  onMessage: SSEEventHandler,
  onError?: SSEErrorHandler
) {
  const { subscribe } = useSSE();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // 구독 시작
    unsubscribeRef.current = subscribe(id, onMessage, onError);

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [id, subscribe]); // onMessage와 onError는 의존성에서 제외 (참조가 변경되어도 재구독하지 않음)

  // onMessage와 onError가 변경되면 리스너 업데이트
  useEffect(() => {
    if (unsubscribeRef.current) {
      // 기존 구독 해제
      unsubscribeRef.current();
      // 새로운 핸들러로 재구독
      unsubscribeRef.current = subscribe(id, onMessage, onError);
    }
  }, [onMessage, onError, id, subscribe]);
}

