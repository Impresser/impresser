"use client";

import React from "react";
import PerformanceRanking from "./components/PerformanceRanking";
import EquipmentUsage from "./components/EquipmentUsage";
import PanelOutput from "./components/PanelOutput";
import Sidebar from "@/components/layout/sidebar";
import Navbar from "@/components/layout/navbar";
import AuthGuard from "@/components/auth/AuthGuard";
import Compressionlist from "./components/Compressionlist";

export default function DashboardPage() {
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
            <div className="flex flex-col gap-2">
              {/* 상단: 성능 순위 전체 영역 */}
              <PerformanceRanking />
              <Compressionlist />
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}


