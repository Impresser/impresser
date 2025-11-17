import { subscribeSSEWithAuth, SSEEventData as CompressorSSEEventData } from '@/service/imageCompressor';
import { SSEEventData as GeneratorSSEEventData } from '@/service/imageGenerator';

// 통합 SSE 이벤트 데이터 타입 (두 서비스 모두 지원)
export type SSEEventData = CompressorSSEEventData & GeneratorSSEEventData & {
  convertHistoryUuid?: string;
  generationUuid?: string;
  [key: string]: any;
};

type SSEEventHandler = (data: SSEEventData) => void;
type SSEErrorHandler = (error: Error) => void;

interface SSEListener {
  id: string;
  onMessage: SSEEventHandler;
  onError?: SSEErrorHandler;
}

/**
 * 전역 SSE 관리 서비스 (Singleton)
 * 페이지 전환 시에도 SSE 연결을 유지합니다.
 */
class GlobalSSEService {
  private abortController: AbortController | null = null;
  private listeners: Map<string, SSEListener> = new Map();
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  /**
   * SSE 연결 시작
   */
  private connect(): void {
    if (this.isConnecting || this.abortController) {
      return; // 이미 연결 중이거나 연결되어 있음
    }

    this.isConnecting = true;
    console.log('[전역 SSE] 연결 시작');

    this.abortController = subscribeSSEWithAuth(
      (data: SSEEventData) => {
        // 모든 리스너에 이벤트 전파
        this.listeners.forEach((listener) => {
          try {
            listener.onMessage(data);
          } catch (error) {
            console.error(`[전역 SSE] 리스너 ${listener.id} 오류:`, error);
          }
        });
      },
      (error: Error) => {
        console.error('[전역 SSE] 연결 오류:', error);
        
        // 모든 리스너에 에러 전파
        this.listeners.forEach((listener) => {
          if (listener.onError) {
            try {
              listener.onError(error);
            } catch (err) {
              console.error(`[전역 SSE] 리스너 ${listener.id} 에러 핸들러 오류:`, err);
            }
          }
        });

        // 연결이 끊어진 경우 재연결 시도
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`[전역 SSE] 재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
          
          // 기존 연결 정리
          if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
          }
          
          this.isConnecting = false;
          
          // 지수 백오프로 재연결
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 16000);
          setTimeout(() => {
            if (this.listeners.size > 0) {
              this.connect();
            }
          }, delay);
        } else {
          console.error('[전역 SSE] 최대 재연결 시도 횟수 초과');
          this.isConnecting = false;
        }
      }
    );

    this.isConnecting = false;
    this.reconnectAttempts = 0; // 연결 성공 시 재연결 시도 횟수 리셋
  }

  /**
   * SSE 이벤트 리스너 등록
   * @param id 리스너 고유 ID
   * @param onMessage 메시지 수신 핸들러
   * @param onError 에러 핸들러 (선택)
   * @returns 해제 함수
   */
  subscribe(id: string, onMessage: SSEEventHandler, onError?: SSEErrorHandler): () => void {
    console.log(`[전역 SSE] 리스너 등록: ${id}`);
    
    this.listeners.set(id, { id, onMessage, onError });

    // 첫 번째 리스너인 경우 연결 시작
    if (this.listeners.size === 1 && !this.abortController) {
      this.connect();
    }

    // 해제 함수 반환
    return () => {
      this.unsubscribe(id);
    };
  }

  /**
   * SSE 이벤트 리스너 해제
   * @param id 리스너 고유 ID
   */
  unsubscribe(id: string): void {
    console.log(`[전역 SSE] 리스너 해제: ${id}`);
    
    if (this.listeners.delete(id)) {
      // 마지막 리스너가 해제된 경우 연결 종료
      if (this.listeners.size === 0 && this.abortController) {
        console.log('[전역 SSE] 모든 리스너 해제, 연결 종료');
        this.abortController.abort();
        this.abortController = null;
        this.reconnectAttempts = 0;
      }
    }
  }

  /**
   * 모든 리스너 해제 및 연결 종료
   */
  disconnect(): void {
    console.log('[전역 SSE] 모든 연결 종료');
    
    this.listeners.clear();
    
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  /**
   * 현재 연결 상태 확인
   */
  isConnected(): boolean {
    return this.abortController !== null && !this.abortController.signal.aborted;
  }

  /**
   * 현재 리스너 수 확인
   */
  getListenerCount(): number {
    return this.listeners.size;
  }
}

// Singleton 인스턴스
export const globalSSEService = new GlobalSSEService();

