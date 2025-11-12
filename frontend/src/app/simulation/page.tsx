'use client';

import React from 'react';
import Sidebar from '@/components/layout/sidebar';
import Navbar from '@/components/layout/navbar';
import AuthGuard from '@/components/auth/AuthGuard';
import ProductionSimulator from './components/ProductionSimulator';

export default function SimulationPage() {
  return (
    <AuthGuard>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <Navbar />
          <main className="flex-1 overflow-y-auto px-6 py-6">
            <div className="mx-auto h-full w-full max-w-7xl">
              <div className="flex items-center justify-between mb-4 gap-6">
                <h1 className="text-lg font-bold text-gray-900 whitespace-nowrap">생산 시뮬레이터</h1>
              </div>
              <ProductionSimulator className="h-full" />
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
