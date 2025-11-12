'use client';

import React, { useCallback, useMemo, useState } from 'react';
import Sidebar from '@/components/layout/sidebar';
import Navbar from '@/components/layout/navbar';
import AuthGuard from '@/components/auth/AuthGuard';
import ProductList from './components/ProductList';
import SelectedGoalList, { SelectedGoal } from './components/SelectedGoalList';
import { products } from './data/ProductionProducts';

export default function SimulationPage() {
  const [selectedGoals, setSelectedGoals] = useState<SelectedGoal[]>([]);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);

  const productMap = useMemo(() => {
    return new Map(products.map((product) => [product.id, product]));
  }, []);

  const handleAddGoal = useCallback(
    (productId: string, quantity: number) => {
      const product = productMap.get(productId);
      if (!product) {
      return;
    }

      setSelectedGoals((prev) => {
        const existingIndex = prev.findIndex((goal) => goal.product.id === productId);
        if (existingIndex !== -1) {
      const next = [...prev];
          next[existingIndex] = { ...next[existingIndex], quantity };
      return next;
        }
        return [...prev, { product, quantity }];
      });
    },
    [productMap]
  );

  const handleRemoveGoal = useCallback((productId: string) => {
    setSelectedGoals((prev) => prev.filter((goal) => goal.product.id !== productId));
  }, []);

  const selectedGoalSummaries = useMemo(
    () => selectedGoals.map((goal) => ({ productId: goal.product.id, quantity: goal.quantity })),
    [selectedGoals]
  );

  const handleConfirmGoals = useCallback(() => {
    if (!selectedGoals.length) {
      return;
    }

    console.info('생산 목표 확정', selectedGoals.map((goal) => ({
      productId: goal.product.id,
      quantity: goal.quantity,
    })));
  }, [selectedGoals]);

  return (
    <AuthGuard>
    <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <Navbar />
          <main className="flex-1 overflow-y-auto px-6 py-6">
            <div className="mx-auto w-full max-w-7xl pb-2">
            <div className="flex gap-6">
                <div className="flex-1">
                  <ProductList
                    onConfirmGoal={(productId, quantity) => {
                      handleAddGoal(productId, quantity);
                      setActiveProductId(null);
                    }}
                    selectedGoals={selectedGoalSummaries}
                    activeProductId={activeProductId}
                    onModalClose={() => setActiveProductId(null)}
                      />
                    </div>
                <SelectedGoalList
                  goals={selectedGoals}
                  onRemove={handleRemoveGoal}
                  onEdit={(product) => setActiveProductId(product.id)}
                  onConfirm={handleConfirmGoals}
                  className="shrink-0"
                  />
                  </div>
          </div>
        </main>
      </div>
    </div>
    </AuthGuard>
  );
}
