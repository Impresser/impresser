'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Sidebar from '@/components/layout/sidebar';
import Navbar from '@/components/layout/navbar';
import AuthGuard from '@/components/auth/AuthGuard';
import ProductList from './components/ProductList';
import SelectedGoalList, { SelectedGoal } from './components/SelectedGoalList';
import ConfirmedGoalTable from './components/ConfirmedGoalTable';
import MotherGlassLayoutPreview from './components/MotherGlassLayoutPreview';
import OverallProductionSummary from './components/OverallProductionSummary';
import PrintSimulationPlan, { type PrintSimulationPlanEntry } from './components/PrintSimulationPlan';
import InkConsumptionSummary from './components/InkConsumptionSummary';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import MotherGlassInfoList from './components/MotherGlassInfoList';
import BmpImportModal from './components/BmpImportModal';
import CommonLoader from '@/components/ui/CommonLoader';
import { products } from './data/productionProducts';
import { motherGlasses } from './data/motherGlasses';
import { getInkjetPrinters, type GetInkjetPrintersResponse, type InkjetPrinter, subscribeInkjetCompressionSSE, type ConvertHistoryItemResponse } from '@/service/inkjet';
import { getDashboardConvertDetail, getDashboardConvertHistoryDetail } from '@/service/dashboard';
import { usePerformanceHistoryStore } from '@/store/performanceHistoryStore';
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
import type { BmpDetailResult } from '@/types/imageGenerator';

export default function SimulationPage() {
  const [selectedGoals, setSelectedGoals] = useState<SelectedGoal[]>([]);
  const [confirmedGoals, setConfirmedGoals] = useState<SelectedGoal[]>([]);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<MotherGlassOptimizationResult | null>(null);
  const [generationStats, setGenerationStats] = useState<GenerationStatsMap>(() => createInitialGenerationStats());
  const [totalAvailablePrinters, setTotalAvailablePrinters] = useState<number>(0);
  const [printersLoading, setPrintersLoading] = useState<boolean>(false);
  const [printersError, setPrintersError] = useState<string | null>(null);
  const [isSimulationRunning, setIsSimulationRunning] = useState<boolean>(false);
  const [hasAttemptedSimulation, setHasAttemptedSimulation] = useState<boolean>(false);
  const [operationalPrinters, setOperationalPrinters] = useState<Record<GenerationLabel, InkjetPrinter[]>>(() => {
    return GENERATION_CONFIG.reduce((acc, config) => {
      acc[config.label as GenerationLabel] = [];
      return acc;
    }, {} as Record<GenerationLabel, InkjetPrinter[]>);
  });
  const [assignmentSelections, setAssignmentSelections] = useState<Record<string, BmpDetailResult>>({});
  const [isBmpModalOpen, setIsBmpModalOpen] = useState<boolean>(false);
  const [activeAssignment, setActiveAssignment] = useState<{
    assignmentId: string;
    motherGlassName: string;
    printerName: string;
    modelName: string;
    assignedSheets: number;
  } | null>(null);
  const [activeAssignmentDetail, setActiveAssignmentDetail] = useState<BmpDetailResult | null>(null);
  const [isPrintPlanConfirmed, setIsPrintPlanConfirmed] = useState<boolean>(false);
  const [printTimeSeconds, setPrintTimeSeconds] = useState<number>(20); // 기본 20초
  const performanceHistoryData = usePerformanceHistoryStore((state) => state.performanceHistoryData);
  const addCompressionComplete = usePerformanceHistoryStore((state) => state.addCompressionComplete);

  // 성능 비교에서 저장된 압축 시간(CompressionTime) 데이터 사용
  const compressionTimes = useMemo(() => {
    const allCompressionTimes: number[] = [];
    
    // performanceHistoryData에서 모든 설비의 최근 완료된 작업들의 compressionTime 수집
    Object.values(performanceHistoryData).forEach((data) => {
      const completedItems = data.historyItems.filter((item) => item.status === '완료');
      if (completedItems.length > 0) {
        // 최근 5개에서 compressionTime 사용, 없으면 2초 기본값
        const recentTimes = completedItems
          .slice(0, 5)
          .map((item) => (typeof (item as any).compressionTime === 'number' ? (item as any).compressionTime as number : 2));
        allCompressionTimes.push(...recentTimes);
      }
    });

    if (allCompressionTimes.length === 0) {
      return { fast: null, slow: null }; // 데이터가 없으면 null 반환
    }

    // 정렬하여 가장 빠른 것과 가장 느린 것 추출
    const sortedTimes = [...allCompressionTimes].sort((a, b) => a - b);
    
    // 가장 빠른 것과 가장 느린 것
    // 2가지 이상 있으면 가장 작은 2개 중 빠른 것, 전체 중 가장 느린 것 사용
    const fast = sortedTimes[0]; // 가장 빠른 것
    const slow = sortedTimes[sortedTimes.length - 1]; // 가장 느린 것
    
    return { fast, slow };
  }, [performanceHistoryData]);

  // 빠른 압축 시간 (계산에 사용)
  const compressionTimeSeconds = compressionTimes.fast;

  // 압축 시간을 가져온 경우 인쇄시간을 압축시간의 9배로 자동 설정
  useEffect(() => {
    if (typeof compressionTimeSeconds === 'number' && !Number.isNaN(compressionTimeSeconds)) {
      const next = Math.max(0, Math.round(compressionTimeSeconds * 9));
      setPrintTimeSeconds(next);
    }
  }, [compressionTimeSeconds]);

  const productMap = useMemo(() => {
    return new Map(products.map((product) => [product.id, product]));
  }, []);

  // 시뮬레이션 페이지에서도 SSE 구독하여 성능 데이터 적재
  useEffect(() => {
    const controller = subscribeInkjetCompressionSSE({
      onCompressionComplete: (data: ConvertHistoryItemResponse) => {
        // 시뮬레이션에서는 매칭없이 공용 키로 적재
        const facilityId = 'SIMULATION';
        addCompressionComplete(facilityId, data, {
          fileName: data.tiffName?.replace(/\.tiff$/i, '.bmp') || data.tiffName || 'unknown.bmp',
          algorithm: data.compressionType || '-',
          version: String(data.version ?? '-'),
        });
      },
      onError: () => {},
    });
    return () => controller.abort();
  }, [addCompressionComplete]);

  // 진입 시 대시보드 변환 내역(최근 4건)으로 성능 데이터 시드
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await getDashboardConvertDetail(undefined, { page: 0, size: 4 });
        const list = resp?.result?.content ?? [];
        if (list.length === 0) return;

        const withDetails = await Promise.all(
          list.map(async (base) => {
            try {
              const d = await getDashboardConvertHistoryDetail(base.convertHistoryUuid);
              return { base, detail: d?.result || null };
            } catch {
              return { base, detail: null };
            }
          })
        );

        if (!mounted) return;

        withDetails.forEach(({ base, detail }) => {
          const tiffNameFromUrl = (() => {
            if (!base.tiffUrl) return undefined;
            try {
              const seg = base.tiffUrl.split('?')[0].split('/');
              return seg[seg.length - 1] || undefined;
            } catch {
              return undefined;
            }
          })();

          const fakeSSE: ConvertHistoryItemResponse = {
            convertHistoryUuid: base.convertHistoryUuid,
            tiffName: tiffNameFromUrl || 'unknown.tiff',
            processingUnit: (base.processingUnit || '').toUpperCase(),
            compressionType: base.compressionType,
            version: base.version,
            // 대시보드 tiffVolume은 KB 단위
            tiffVolume: base.tiffVolume,
            bmpVolume: base.bmpVolume,
            userName: base.userName,
            employeeNo: '',
            completedAt: (detail as any)?.completedAt || new Date().toISOString(),
            elapsedTime: (detail as any)?.elapsedTime ?? base.elapsedTime,
            tiffUrl: base.tiffUrl || '',
            compressionTime: (detail as any)?.compressionTime,
            // compressionRatio는 상세 타입에 없어 비움
            compressionRatio: 0,
          };

          addCompressionComplete('SIMULATION', fakeSSE, {
            fileName: (tiffNameFromUrl || 'unknown.tiff').replace(/\.tiff$/i, '.bmp'),
            algorithm: base.compressionType,
            version: String(base.version),
          });
        });
      } catch (e) {
        console.warn('대시보드 변환 내역 시드 실패:', e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [addCompressionComplete]);

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
      const totalProductCount = Array.from(entry.productCounts.values()).reduce((sum, count) => sum + count, 0);

      return {
        motherGlassName: entry.motherGlassName,
        productSummary: productSummary || '-',
        totalProductCount,
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
            assignmentId: `${entry.motherGlassName}-index-${index}`,
            printerUuid: printer.inkjetUuid,
            printerName: printer.printerName,
            modelName: printer.modelName,
            assignedSheets: 0,
          };
        }
        const base = Math.floor(sheetCount / available);
        const remainder = sheetCount % available;
        const assignedSheets = sheetCount === 0 ? 0 : base + (index < remainder ? 1 : 0);
        const assignmentId = `${entry.motherGlassName}-${printer.inkjetUuid ?? `index-${index}`}`;
        return {
          assignmentId,
          printerUuid: printer.inkjetUuid,
          printerName: printer.printerName,
          modelName: printer.modelName,
          assignedSheets,
        };
      });
      return {
        motherGlassName: entry.motherGlassName,
        sheetCount,
        assignments,
      };
    });
  }, [overallGenerationSummary, generationStats, operationalPrinters]);

  const requiredAssignmentIds = useMemo(() => {
    return printSimulationPlan.flatMap((entry) =>
      entry.assignments
        .filter((assignment) => assignment.assignedSheets > 0)
        .map((assignment) => assignment.assignmentId),
    );
  }, [printSimulationPlan]);

  const requiredAssignmentsKey = useMemo(() => requiredAssignmentIds.join('|'), [requiredAssignmentIds]);
  const previousAssignmentsKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (previousAssignmentsKeyRef.current === requiredAssignmentsKey) {
      return;
    }
    previousAssignmentsKeyRef.current = requiredAssignmentsKey;
    setAssignmentSelections((prev) => {
      const requiredSet = new Set(requiredAssignmentIds);
      const filteredEntries = Object.entries(prev).filter(([id]) => requiredSet.has(id));
      if (filteredEntries.length === Object.keys(prev).length) {
        return prev;
      }
      return filteredEntries.reduce<Record<string, BmpDetailResult>>((acc, [id, detail]) => {
        acc[id] = detail;
        return acc;
      }, {});
    });
    setIsPrintPlanConfirmed(false);
  }, [requiredAssignmentIds, requiredAssignmentsKey]);

  const handleRequestImport = useCallback(
    ({
      motherGlassName,
      assignment,
    }: {
      motherGlassName: string;
      assignment: PrintSimulationPlanEntry['assignments'][number];
    }) => {
      if (assignment.assignedSheets === 0) {
        return;
      }
      const existingDetail = assignmentSelections[assignment.assignmentId] ?? null;
      setActiveAssignmentDetail(existingDetail);
      setActiveAssignment({
        assignmentId: assignment.assignmentId,
        motherGlassName,
        printerName: assignment.printerName,
        modelName: assignment.modelName,
        assignedSheets: assignment.assignedSheets,
      });
      setIsBmpModalOpen(true);
    },
    [assignmentSelections],
  );

  const handleApplyBmpSelection = useCallback(
    (detail: BmpDetailResult) => {
      if (!activeAssignment) {
        return;
      }
      setAssignmentSelections((prev) => ({
        ...prev,
        [activeAssignment.assignmentId]: detail,
      }));
      setIsBmpModalOpen(false);
      setActiveAssignment(null);
      setActiveAssignmentDetail(null);
      setIsPrintPlanConfirmed(false);
    },
    [activeAssignment],
  );

  const handleClearAssignment = useCallback((assignmentId: string) => {
    setAssignmentSelections((prev) => {
      if (!(assignmentId in prev)) {
        return prev;
      }
      const next = { ...prev };
      delete next[assignmentId];
      return next;
    });
    setIsPrintPlanConfirmed(false);
  }, []);

  const handleCloseBmpModal = useCallback(() => {
    setIsBmpModalOpen(false);
    setActiveAssignment(null);
    setActiveAssignmentDetail(null);
  }, []);

  const isConfirmDisabled = useMemo(() => {
    if (requiredAssignmentIds.length === 0) {
      return true;
    }
    return requiredAssignmentIds.some((id) => !assignmentSelections[id]);
  }, [assignmentSelections, requiredAssignmentIds]);

  const handleConfirmAssignments = useCallback(() => {
    if (isConfirmDisabled) {
      return;
    }
    setIsPrintPlanConfirmed(true);
    
    // 잉크 사용량 섹션으로 스크롤
    setTimeout(() => {
      const inkConsumptionSummary = document.getElementById('ink-consumption-summary');
      if (inkConsumptionSummary) {
        inkConsumptionSummary.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }, [isConfirmDisabled]);

  const runOptimization = useCallback((goals: SelectedGoal[]) => {
    if (goals.length === 0) {
      setOptimizationResult(null);
      setHasAttemptedSimulation(false);
      return;
    }
    setHasAttemptedSimulation(true);
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
      setHasAttemptedSimulation(false);
      
      // 생산 계획 설계 섹션으로 스크롤
      setTimeout(() => {
        const productionPlanSection = document.getElementById('production-plan-section');
        if (productionPlanSection) {
          productionPlanSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    },
    [],
  );

  const handleRunSimulation = useCallback(() => {
    if (printersLoading || confirmedGoals.length === 0) {
      return;
    }
    setIsSimulationRunning(true);
    // 메인 스레드를 막지 않도록 웹 워커에서 최적화 실행
    try {
      const worker = new Worker(new URL('./workers/optimizationWorker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = (e: MessageEvent<{ ok: boolean; result?: any; error?: string }>) => {
        const data = e.data;
        if (data.ok) {
          setOptimizationResult(data.result);
          setHasAttemptedSimulation(true);
          // 설비별 배치 섹션으로 스크롤
          setTimeout(() => {
            const batchPlanSection = document.getElementById('batch-plan-section');
            if (batchPlanSection) {
              batchPlanSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 200);
        } else {
          console.error('Optimization worker error:', data.error);
          setOptimizationResult(null);
          setHasAttemptedSimulation(true);
        }
        setIsSimulationRunning(false);
        worker.terminate();
      };
      worker.onerror = (err) => {
        console.error('Optimization worker failed:', err);
        setOptimizationResult(null);
        setHasAttemptedSimulation(true);
        setIsSimulationRunning(false);
        worker.terminate();
      };
      worker.postMessage({
        availableMotherGlasses,
        goals: confirmedGoals,
      });
    } catch (err) {
      console.error('Worker setup failed:', err);
      try {
        runOptimization(confirmedGoals);
      } finally {
        setIsSimulationRunning(false);
      }
    }
  }, [confirmedGoals, printersLoading, runOptimization]);

  return (
    <AuthGuard>
    <div className="flex h-screen overflow-x-hidden bg-gray-50">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-x-hidden">
          <Navbar />
          <main className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-6">
            <div className="mx-auto w-full max-w-7xl overflow-x-hidden pb-2 space-y-6">
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

              <div id="production-plan-section" className="pt-2">
                <h2 className="text-xl font-semibold text-gray-900">생산 계획 설계</h2>
              </div>

              <ConfirmedGoalTable goals={confirmedGoals} />

              <MotherGlassInfoList
                motherGlasses={motherGlasses}
                generationStats={generationStats}
                totalAvailable={totalAvailablePrinters}
                loading={printersLoading}
                error={printersError}
                onCalculate={handleRunSimulation}
                isCalculating={isSimulationRunning}
                calculateDisabled={confirmedGoals.length === 0 || Boolean(printersError) || printersLoading}
              />

              {optimizationResult ? (
                <div id="batch-plan-section" className="space-y-4">
                  <div className="pt-2">
                    <h2 className="text-xl font-semibold text-gray-900">설비별 배치</h2>
                  </div>
                  <OverallProductionSummary summary={overallGenerationSummary} />
                  <div className="space-y-4">
                    {optimizationResult.layoutResults.map((result, index) => (
                      <MotherGlassLayoutPreview
                        key={`${result.motherGlass.id}-${index}`}
                        layoutResult={result}
                      />
                    ))}
                  </div>
                </div>
              ) : hasAttemptedSimulation ? (
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

              <div className="space-y-4 pt-4">
                <h2 className="text-xl font-semibold text-gray-900">잉크 사용량 및 최종 예상 시간</h2>
                <PrintSimulationPlan
                  plan={printSimulationPlan}
                  selectedAssignments={assignmentSelections}
                  onRequestImport={handleRequestImport}
                  onClearSelection={handleClearAssignment}
                  onConfirm={handleConfirmAssignments}
                  isConfirmDisabled={isConfirmDisabled}
                  isConfirmed={isPrintPlanConfirmed}
                  compressionTimeSeconds={compressionTimeSeconds}
                  printTimeSeconds={printTimeSeconds}
                  onPrintTimeChange={setPrintTimeSeconds}
                />
                {isPrintPlanConfirmed ? (
                  <InkConsumptionSummary 
                    plan={printSimulationPlan} 
                    selectedAssignments={assignmentSelections}
                    compressionTimeSeconds={compressionTimeSeconds}
                    compressionTimeSlow={compressionTimes.slow}
                    printTimeSeconds={printTimeSeconds}
                    confirmedGoals={confirmedGoals}
                  />
                ) : (
                  <CommonContainerBox className="px-4 py-4 text-sm text-gray-600">
                    설비별 이미지 등록을 모두 완료하고 확인 버튼을 누르면 잉크 사용량과 예상 시간이 계산됩니다.
                  </CommonContainerBox>
                )}
              </div>
            </div>
          </main>
        </div>
    </div>
    <BmpImportModal
      isOpen={isBmpModalOpen}
      onClose={handleCloseBmpModal}
      onSelect={handleApplyBmpSelection}
      preselectedDetail={activeAssignmentDetail}
      targetInfo={
        activeAssignment
          ? {
              motherGlassName: activeAssignment.motherGlassName,
              printerName: activeAssignment.printerName,
              modelName: activeAssignment.modelName,
              assignedSheets: activeAssignment.assignedSheets,
            }
          : null
      }
    />
    {isSimulationRunning && (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none">
        <CommonLoader className="w-[240px] h-[180px]" color="#0059FF" timeScale={3} />
      </div>
    )}
    </AuthGuard>
  );
}
