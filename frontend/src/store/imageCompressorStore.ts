"use client";

import { create } from "zustand";
import { ConvertHistoryItem, GetConvertHistoriesParams } from "@/types/imageCompressor";
import { getConvertHistories, getConvertHistoriesMe } from "@/service/imageCompressor";

type ImageCompressorStore = {
  // 상태
  histories: ConvertHistoryItem[];
  pagination: {
    page: number;
    size: number;
    totalPages: number;
    totalElements: number;
    first: boolean;
    last: boolean;
    hasNext: boolean;
  } | null;
  loading: boolean;
  error: string | null;

  // 액션
  fetchHistories: (params?: GetConvertHistoriesParams) => Promise<void>;
  fetchMyHistories: (params?: GetConvertHistoriesParams) => Promise<void>;
  setHistories: (histories: ConvertHistoryItem[]) => void;
  setPagination: (pagination: ImageCompressorStore['pagination']) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
};

export const useImageCompressorStore = create<ImageCompressorStore>((set, get) => ({
  histories: [],
  pagination: null,
  loading: false,
  error: null,

  fetchHistories: async (params?: GetConvertHistoriesParams) => {
    set({ loading: true, error: null });
    try {
      const response = await getConvertHistories(params);
      if (response.isSuccess && response.result) {
        set({
          histories: response.result.content,
          pagination: response.result.pagination,
          loading: false,
        });
      } else {
        set({
          error: response.message || "압축 내역 조회에 실패했습니다.",
          loading: false,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "압축 내역 조회 중 오류가 발생했습니다.";
      set({
        error: errorMessage,
        loading: false,
      });
    }
  },

  fetchMyHistories: async (params?: GetConvertHistoriesParams) => {
    set({ loading: true, error: null });
    try {
      const response = await getConvertHistoriesMe(params);
      if (response.isSuccess && response.result) {
        set({
          histories: response.result.content,
          pagination: response.result.pagination,
          loading: false,
        });
      } else {
        set({
          error: response.message || "내 압축 내역 조회에 실패했습니다.",
          loading: false,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "내 압축 내역 조회 중 오류가 발생했습니다.";
      set({
        error: errorMessage,
        loading: false,
      });
    }
  },

  setHistories: (histories) => set({ histories }),
  
  setPagination: (pagination) => set({ pagination }),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),
}));

