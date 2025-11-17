"use client";

import React, { useCallback } from "react";
import PerformanceRanking from "./components/PerformanceRanking";
import Sidebar from "@/components/layout/sidebar";
import Navbar from "@/components/layout/navbar";
import AuthGuard from "@/components/auth/AuthGuard";
import Compressionlist from "./components/Compressionlist";
import RecommendationEngine from "./components/RecommendationEngine";
import { useSSESubscription } from "@/contexts/SSEContext";
import { SSEEventData } from "@/service/globalSSEService";

export default function DashboardPage() {
  // 전역 SSE 구독 - 압축/패턴 생성 완료 시 대시보드 새로고침
  useSSESubscription(
    'dashboard',
    useCallback((data: SSEEventData) => {
      console.log('[대시보드] SSE 이벤트 수신:', data);
      
      // 압축 완료 이벤트 확인
      const isCompressionCompleted = 
        data.convertHistoryUuid &&
        (data.eventType === 'COMPLETED' ||
         data.eventType === 'CONVERT_BMP_SUCCESS' ||
         data.status === '완료' ||
         data.status === 'COMPLETED' ||
         data.status === 'SUCCESS' ||
         data.progress === 100);
      
      // 패턴 생성 완료 이벤트 확인 (eventType과 status 모두 확인)
      const isPatternCompleted = 
        data.generationUuid &&
        (data.eventType === 'GENERATE_BMP_SUCCESS' ||
         data.eventType === 'COMPLETED' ||
         data.status === 'COMPLETED' ||
         data.status === '완료' ||
         data.status === 'Success' ||
         data.status === 'SUCCESS' ||
         data.progress === 100);
      
      // 완료 이벤트인 경우 대시보드 컴포넌트들 새로고침
      if (isCompressionCompleted || isPatternCompleted) {
        console.log('[대시보드] 완료 이벤트 감지, 대시보드 새로고침');
        // window 이벤트를 발생시켜서 각 컴포넌트가 새로고침하도록 함
        window.dispatchEvent(new CustomEvent('refreshDashboard'));
      }
    }, []),
    useCallback((error: Error) => {
      console.error('[대시보드] SSE 연결 오류:', error);
    }, [])
  );
  return (
    <AuthGuard>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Navigation Bar */}
          <Navbar />

          {/* Content */}
          <main className="flex-1 p-6 overflow-y-auto overflow-x-hidden">
            <div className="flex flex-col gap-2">
              {/* 상단: 성능 순위 전체 영역 */}
              <PerformanceRanking />
              <RecommendationEngine />
              <Compressionlist />
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}


