"use client";

import { create } from "zustand";
import { HistoryItem } from "@/components/ui/CommonTable";
import { ConvertHistoryItemResponse } from "@/service/inkjet";

type PerformanceHistoryData = {
  historyItems: HistoryItem[];
  isLoadingHistory: boolean;
  historyError: string | null;
};

type PerformanceHistoryStore = {
  // 설비별 작업 내역 상태
  performanceHistoryData: Record<string, PerformanceHistoryData>;
  
  // 액션
  addHistoryItem: (facilityId: string, historyItem: HistoryItem) => void;
  setHistoryData: (facilityId: string, data: PerformanceHistoryData) => void;
  updateHistoryData: (facilityId: string, update: Partial<PerformanceHistoryData>) => void;
  clearHistoryData: (facilityId: string) => void;
  clearAllHistoryData: () => void;
  
  // SSE로 받은 압축 완료 데이터를 작업 내역에 추가
  addCompressionComplete: (facilityId: string, data: ConvertHistoryItemResponse, matchedItem: {
    fileName: string;
    algorithm: string;
    version: string;
  }) => void;
};

export const usePerformanceHistoryStore = create<PerformanceHistoryStore>((set) => ({
  performanceHistoryData: {},

  addHistoryItem: (facilityId, historyItem) => {
    set((state) => {
      const existing = state.performanceHistoryData[facilityId] || {
        historyItems: [],
        isLoadingHistory: false,
        historyError: null,
      };

      return {
        performanceHistoryData: {
          ...state.performanceHistoryData,
          [facilityId]: {
            ...existing,
            historyItems: [historyItem, ...existing.historyItems],
          },
        },
      };
    });
  },

  setHistoryData: (facilityId, data) => {
    set((state) => ({
      performanceHistoryData: {
        ...state.performanceHistoryData,
        [facilityId]: data,
      },
    }));
  },

  updateHistoryData: (facilityId, update) => {
    set((state) => {
      const existing = state.performanceHistoryData[facilityId] || {
        historyItems: [],
        isLoadingHistory: false,
        historyError: null,
      };

      return {
        performanceHistoryData: {
          ...state.performanceHistoryData,
          [facilityId]: {
            ...existing,
            ...update,
          },
        },
      };
    });
  },

  clearHistoryData: (facilityId) => {
    set((state) => {
      const updated = { ...state.performanceHistoryData };
      delete updated[facilityId];
      return { performanceHistoryData: updated };
    });
  },

  clearAllHistoryData: () => {
    set({ performanceHistoryData: {} });
  },

  addCompressionComplete: (facilityId, data, matchedItem) => {
    const historyItem: HistoryItem = {
      id: data.convertHistoryUuid,
      fileName: matchedItem.fileName,
      processingMethod: data.processingUnit.toUpperCase(),
      algorithm: matchedItem.algorithm,
      version: matchedItem.version,
      fileSize: data.tiffVolume,
      status: '완료',
      assignedUser: data.userName,
      completedTime: new Date(data.completedAt),
      duration: data.elapsedTime,
      tiffUrl: data.tiffUrl,
    };

    set((state) => {
      const existing = state.performanceHistoryData[facilityId] || {
        historyItems: [],
        isLoadingHistory: false,
        historyError: null,
      };

      return {
        performanceHistoryData: {
          ...state.performanceHistoryData,
          [facilityId]: {
            ...existing,
            historyItems: [historyItem, ...existing.historyItems],
          },
        },
      };
    });
  },
}));

