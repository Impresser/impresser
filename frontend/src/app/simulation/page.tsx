'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/layout/sidebar';
import Navbar from '@/components/layout/navbar';
import AuthGuard from '@/components/auth/AuthGuard';
import ProductList from './components/ProductList';
import SelectedGoalList, { SelectedGoal } from './components/SelectedGoalList';
import ConfirmedGoalTable from './components/ConfirmedGoalTable';
import MotherGlassLayoutPreview from './components/MotherGlassLayoutPreview';
import OverallProductionSummary from './components/OverallProductionSummary';
import PrintSimulationPlan from './components/PrintSimulationPlan';
import InkConsumptionSummary from './components/InkConsumptionSummary';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import MotherGlassInfoList from './components/MotherGlassInfoList';
import { products } from './data/productionProducts';
import { motherGlasses } from './data/motherGlasses';
import { getInkjetPrinters, type GetInkjetPrintersResponse, type InkjetPrinter } from '@/service/inkjet';
import {
  computeOptimalMotherGlassPlan,
  MotherGlassOptimizationResult,
} from './utils/layoutCalculations';
import {
  GENERATION_CONFIG,
  type GenerationLabel,
  type GenerationStatsMap,
  type PrinterStatusKey,
  STATUS_ORDER,
  createInitialGenerationStats,
  resolveGenerationLabel,
} from './utils/motherGlassAvailability';

export default function SimulationPage() {
  const [selectedGoals, setSelectedGoals] = useState<SelectedGoal[]>([]);
  const [confirmedGoals, setConfirmedGoals] = useState<SelectedGoal[]>([]);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<MotherGlassOptimizationResult | null>(null);
  const [generationStats, setGenerationStats] = useState<GenerationStatsMap>(() => createInitialGenerationStats());
  const [totalAvailablePrinters, setTotalAvailablePrinters] = useState<number>(0);
  const [printersLoading, setPrintersLoading] = useState<boolean>(false);
  const [printersError, setPrintersError] = useState<string | null>(null);
  const [operationalPrinters, setOperationalPrinters] = useState<Record<GenerationLabel, InkjetPrinter[]>>(() => {
    return GENERATION_CONFIG.reduce((acc, config) => {
      acc[config.label as GenerationLabel] = [];
      return acc;
    }, {} as Record<GenerationLabel, InkjetPrinter[]>);
  });

  const productMap = useMemo(() => {
    return new Map(products.map((product) => [product.id, product]));
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchPrinters = async () => {
      try {
        setPrintersLoading(true);
        setPrintersError(null);

        const aggregatedPrinters: InkjetPrinter[] = [];
        let page = 0;
        const size = 100;

        while (true) {
          const response = await getInkjetPrinters({ page, size });

          if (!response.isSuccess) {
            throw new Error(response.message || '설비 목록 조회에 실패했습니다.');
          }

          const result: GetInkjetPrintersResponse = response.result;
          aggregatedPrinters.push(...result.content);

          if (result.pagination.last) {
            break;
          }

          page += 1;
        }

        if (!isMounted) {
          return;
        }

        const nextStats = createInitialGenerationStats();
        const nextOperationalPrinters = GENERATION_CONFIG.reduce((acc, config) => {
          acc[config.label as GenerationLabel] = [];
          return acc;
        }, {} as Record<GenerationLabel, InkjetPrinter[]>);

        aggregatedPrinters.forEach((printer) => {
          const generationLabel = resolveGenerationLabel(printer.modelName);
          if (!generationLabel) {
            return;
          }

          const printerStatus = printer.printerStatus as PrinterStatusKey;
          if (!STATUS_ORDER.includes(printerStatus)) {
            return;
          }

          const generation = nextStats[generationLabel];
          generation.total += 1;
          generation.byStatus[printerStatus] += 1;
          if (printerStatus === 'OPERATIONAL') {
            generation.available += 1;
            nextOperationalPrinters[generationLabel].push(printer);
          }
        });

        const totalAvailable = GENERATION_CONFIG.reduce(
          (sum, config) => sum + nextStats[config.label].available,
          0,
        );

        setGenerationStats(nextStats);
        setTotalAvailablePrinters(totalAvailable);
        setOperationalPrinters(nextOperationalPrinters);
      } catch (error) {
        if (isMounted) {
          setPrintersError(
            error instanceof Error ? error.message : '설비 정보를 가져오는 중 문제가 발생했습니다.',
          );
        }
      } finally {
        if (isMounted) {
          setPrintersLoading(false);
        }
      }
    };

    fetchPrinters();

    return () => {
      isMounted = false;
    };
  }, []);

  const availableMotherGlasses = useMemo(() => {
    return motherGlasses.filter((motherGlass) => {
      const stats = generationStats[motherGlass.generationName as GenerationLabel];
      return stats?.available > 0;
    });
  }, [generationStats]);

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

  const overallGenerationSummary = useMemo(() => {
    if (!optimizationResult) {
      return [];
    }

    const summaryMap = new Map<string, {
      motherGlassName: string;
      areaUsedPercentTotal: number;
      areaRemainingPercentTotal: number;
      sheetCount: number;
      productCounts: Map<string, number>;
    }>();

    optimizationResult.layoutResults.forEach((result) => {
      result.sheets.forEach((sheet) => {
        const generationName = result.motherGlass.generationName;
        if (!summaryMap.has(generationName)) {
          summaryMap.set(generationName, {
            motherGlassName: generationName,
            areaUsedPercentTotal: 0,
            areaRemainingPercentTotal: 0,
            sheetCount: 0,
            productCounts: new Map<string, number>(),
          });
        }

        const entry = summaryMap.get(generationName)!;
        entry.sheetCount += 1;

        const sheetAreaPercent = result.motherGlass.areaMm2 > 0
          ? (sheet.areaUsedMm2 * 100) / result.motherGlass.areaMm2
          : 0;
        entry.areaUsedPercentTotal += sheetAreaPercent;
        entry.areaRemainingPercentTotal += Math.max(0, 100 - sheetAreaPercent);

        sheet.placements.forEach((placement) => {
          const key = `${placement.productName} (${placement.modelName})`;
          entry.productCounts.set(key, (entry.productCounts.get(key) ?? 0) + 1);
        });
      });
    });

    return Array.from(summaryMap.values()).map((entry) => {
      const productSummary = Array.from(entry.productCounts.entries())
        .map(([name, count]) => `${name} × ${count}`)
        .join('\n');
      const averageUsedPercent = entry.sheetCount > 0 ? entry.areaUsedPercentTotal / entry.sheetCount : 0;
      const averageRemainingPercent = entry.sheetCount > 0 ? entry.areaRemainingPercentTotal / entry.sheetCount : 0;

      return {
        motherGlassName: entry.motherGlassName,
        productSummary: productSummary || '-',
        averageUsedPercent,
        averageRemainingPercent,
        sheetCount: entry.sheetCount,
      };
    });
  }, [optimizationResult]);

  const printSimulationPlan = useMemo(() => {
    return overallGenerationSummary.map((entry) => {
      const stats = generationStats[entry.motherGlassName as GenerationLabel];
      const printersForGeneration = operationalPrinters[entry.motherGlassName as GenerationLabel] ?? [];
      const available = printersForGeneration.length;
      const sheetCount = entry.sheetCount;
      const assignments = printersForGeneration.map((printer, index) => {
        if (available === 0) {
          return {
            printerUuid: printer.inkjetUuid,
            printerName: printer.printerName,
            modelName: printer.modelName,
            assignedSheets: 0,
          };
        }
        const base = Math.floor(sheetCount / available);
        const remainder = sheetCount % available;
        const assignedSheets = sheetCount === 0 ? 0 : base + (index < remainder ? 1 : 0);
        return {
          printerUuid: printer.inkjetUuid,
          printerName: printer.printerName,
          modelName: printer.modelName,
          assignedSheets,
        };
      });

      const status = available === 0
        ? '설비 없음'
        : sheetCount === 0
          ? '배치 없음'
          : assignments.every((assignment) => assignment.assignedSheets === 0)
            ? '대기'
            : '배정 완료';

      return {
        motherGlassName: entry.motherGlassName,
        sheetCount,
        assignments,
        status,
        shortage: available === 0,
      };
    });
  }, [overallGenerationSummary, generationStats, operationalPrinters]);

  const runOptimization = useCallback((goals: SelectedGoal[]) => {
    if (goals.length === 0) {
      setOptimizationResult(null);
      return;
    }
    if (availableMotherGlasses.length === 0) {
      setOptimizationResult(null);
      return;
    }
    const result = computeOptimalMotherGlassPlan(availableMotherGlasses, goals);
    setOptimizationResult(result);
  }, [availableMotherGlasses]);

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
                  activeProductId={activeProductId}
                />
              </div>

              <div className="pt-2">
                <h2 className="text-xl font-semibold text-gray-900">생산 계획 설계</h2>
              </div>

              <ConfirmedGoalTable goals={confirmedGoals} />

              <MotherGlassInfoList
                motherGlasses={motherGlasses}
                generationStats={generationStats}
                totalAvailable={totalAvailablePrinters}
                loading={printersLoading}
                error={printersError}
              />

              <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
                모든 원장 조합을 고려하여 최적 면취 효율을 계산합니다. 목표 수량을 확정하면 최적 배치가 자동 산출됩니다.
              </div>

              {optimizationResult ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                    총 배치 {optimizationResult.totalPlacedQuantity.toLocaleString()}개 · 미배치 {optimizationResult.totalUnplacedQuantity.toLocaleString()}개 · 사용 원장 {optimizationResult.totalMotherGlassesUsed.toLocaleString()}장 · 전체 면취 효율 {optimizationResult.overallAreaUtilizationPercent.toFixed(1)}%
                  </div>
                  {optimizationResult.layoutResults.map((result, index) => (
                    <MotherGlassLayoutPreview
                      key={`${result.motherGlass.id}-${index}`}
                      layoutResult={result}
                    />
                  ))}

                  <div className="space-y-4 pt-4">
                    <h2 className="text-xl font-semibold text-gray-900">생산 시뮬레이션</h2>
                    <OverallProductionSummary summary={overallGenerationSummary} />
                    <PrintSimulationPlan plan={printSimulationPlan} />
                    <InkConsumptionSummary plan={printSimulationPlan} />
                  </div>
                </div>
              ) : confirmedGoals.length > 0 ? (
                availableMotherGlasses.length === 0 ? (
                  <div className="rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-700">
                    사용 가능한 설비가 없어 배치를 진행할 수 없습니다. 설비 상태를 확인하거나 설비 가동을 요청해주세요.
                  </div>
                ) : (
                  <div className="rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
                    배치 가능한 조합을 찾지 못했습니다. 목표 제품 수량을 조정해주세요.
                  </div>
                )
              ) : null}
            </div>
          </main>
        </div>
    </div>
    </AuthGuard>
  );
}
