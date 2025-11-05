"use client";

import { create } from "zustand";
import { DashboardRankItem, GetDashboardRanksResult } from "@/types/dashboard";
import { getDashboardConvertRanks } from "@/service/dashboard";

type RankingStore = {
  items: DashboardRankItem[];
  pagination: GetDashboardRanksResult["pagination"] | null;
  loading: boolean;
  error: string | null;
  fetch: (page?: number, size?: number) => Promise<void>;
};

export const usePerformanceRankingStore = create<RankingStore>((set) => ({
  items: [],
  pagination: null,
  loading: false,
  error: null,
  async fetch(page = 0, size = 10) {
    set({ loading: true, error: null });
    try {
      const res = await getDashboardConvertRanks({ page, size });
      if (!res.isSuccess) {
        throw new Error(res.message || "API 실패");
      }
      set({ items: res.result.content || [], pagination: res.result.pagination || null });
    } catch (e: any) {
      set({ error: e?.message || String(e) });
    } finally {
      set({ loading: false });
    }
  },
}));




