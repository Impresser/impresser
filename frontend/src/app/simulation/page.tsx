'use client';

import React, { useCallback, useMemo, useState } from 'react';
import Sidebar from '@/components/layout/sidebar';
import Navbar from '@/components/layout/navbar';
import AuthGuard from '@/components/auth/AuthGuard';
import ProductList from './components/ProductList';
import SelectedGoalList, { SelectedGoal } from './components/SelectedGoalList';
import ConfirmedGoalTable from './components/ConfirmedGoalTable';
import MotherGlassLayoutPreview from './components/MotherGlassLayoutPreview';
import { products } from './data/productionProducts';
import { motherGlasses } from './data/motherGlasses';
import {
  computeOptimalMotherGlassPlan,
  MotherGlassOptimizationResult,
} from './utils/layoutCalculations';

export default function SimulationPage() {
  const [selectedGoals, setSelectedGoals] = useState<SelectedGoal[]>([]);
  const [confirmedGoals, setConfirmedGoals] = useState<SelectedGoal[]>([]);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<MotherGlassOptimizationResult | null>(null);

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
    [productMap],
  );

  const handleRemoveGoal = useCallback((productId: string) => {
    setSelectedGoals((prev) => prev.filter((goal) => goal.product.id !== productId));
  }, []);

  const selectedGoalSummaries = useMemo(
    () => selectedGoals.map((goal) => ({ productId: goal.product.id, quantity: goal.quantity })),
    [selectedGoals],
  );

  const runOptimization = useCallback((goals: SelectedGoal[]) => {
    if (goals.length === 0) {
      setOptimizationResult(null);
      return;
    }
    const result = computeOptimalMotherGlassPlan(motherGlasses, goals);
    setOptimizationResult(result);
  }, []);

  const handleConfirmGoals = useCallback(
    (goals: SelectedGoal[]) => {
      setConfirmedGoals(goals.map((goal) => ({ ...goal })));
      runOptimization(goals);
    },
    [runOptimization],
  );

  return (
    <AuthGuard>
    <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <Navbar />
          <main className="flex-1 overflow-y-auto px-6 py-6">
            <div className="mx-auto w-full max-w-7xl pb-2 space-y-6">
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

              <ConfirmedGoalTable goals={confirmedGoals} />

              <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
                모든 원장 조합을 고려하여 최적 면취 효율을 계산합니다. 목표 수량을 확정하면 최적 배치가 자동 산출됩니다.
              </div>

              {optimizationResult ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                    총 배치 {optimizationResult.totalPlacedQuantity.toLocaleString()}개 · 미배치 {optimizationResult.totalUnplacedQuantity.toLocaleString()}개 · 사용 원장 {optimizationResult.totalMotherGlassesUsed.toLocaleString()}장 · 전체 면취 효율 {optimizationResult.overallAreaUtilizationPercent.toFixed(1)}% · 원장별 최고 효율 합 {optimizationResult.bestPerMotherGlassAreaUtilizationScore.toFixed(1)}%
                  </div>
                  {optimizationResult.layoutResults.map((result, index) => (
                    <MotherGlassLayoutPreview key={`${result.motherGlass.id}-${index}`} layoutResult={result} />
                  ))}
                </div>
              ) : confirmedGoals.length > 0 ? (
                <div className="rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
                  배치 가능한 조합을 찾지 못했습니다. 목표 제품 수량을 조정해주세요.
                </div>
              ) : null}
            </div>
          </main>
        </div>
    </div>
    </AuthGuard>
  );
}
