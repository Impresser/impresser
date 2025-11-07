"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type SidebarStore = {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
};

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set) => ({
      isCollapsed: false,
      setIsCollapsed: (collapsed: boolean) => set({ isCollapsed: collapsed }),
      toggleCollapsed: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
    }),
    {
      name: "sidebar-storage", // localStorage key
    }
  )
);

