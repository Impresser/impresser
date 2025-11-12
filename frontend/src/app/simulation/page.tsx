'use client';

import React from 'react';
import Sidebar from '@/components/layout/sidebar';
import Navbar from '@/components/layout/navbar';
import AuthGuard from '@/components/auth/AuthGuard';
import ProductionGoalSetter from './components/ProductionGoalSetter';

export default function SimulationPage() {
  return (
    <AuthGuard>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <Navbar />
          <main className="flex-1 overflow-y-auto px-6 py-6">
            <div className="mx-auto h-full w-full max-w-7xl">
              <ProductionGoalSetter className="h-full" />
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
