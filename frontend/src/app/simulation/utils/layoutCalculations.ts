'use client';

import type { MotherGlass } from '../data/motherGlasses';
import type { SelectedGoal } from '../components/SelectedGoalList';

function toNumber(value: string | number): number {
  if (typeof value === 'number') {
    return value;
  }
  return Number(value.replace(/,/g, ''));
}

interface OrientationCandidate {
  width: number;
  height: number;
  rotated: boolean;
}

interface FreeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MotherGlassPlacement {
  productId: string;
  productName: string;
  modelName: string;
  widthMm: number;
  heightMm: number;
  rotated: boolean;
  x: number;
  y: number;
  areaMm2: number;
}

export interface MotherGlassSheetLayout {
  sheetIndex: number;
  placements: MotherGlassPlacement[];
  areaUsedMm2: number;
}

export interface MotherGlassProductSummary {
  productId: string;
  productName: string;
  modelName: string;
  requestedQuantity: number;
  placedQuantity: number;
  unplacedQuantity: number;
  rotatedCount: number;
  motherGlassesUsed: number;
  maxPerMotherGlass: number;
  theoreticalAreaUtilizationPercent: number;
  effectiveAreaUtilizationPercent: number;
  totalAreaUsedMm2: number;
}

export interface LayoutComputationResult {
  motherGlass: MotherGlass;
  sheets: MotherGlassSheetLayout[];
  summaries: MotherGlassProductSummary[];
}

interface ExpandItem {
  productId: string;
  productName: string;
  modelName: string;
  widthMm: number;
  heightMm: number;
  areaMm2: number;
}

interface SheetWorkingState extends MotherGlassSheetLayout {
  freeRects: FreeRect[];
}

type SheetSelection = {
  motherGlass: MotherGlass;
  sheet: MotherGlassSheetLayout;
  usedCounts: Map<string, number>;
  areaUsedPercent: number;
};

function createSheet(sheetIndex: number, motherGlass: MotherGlass): SheetWorkingState {
  return {
    sheetIndex,
    placements: [],
    freeRects: [
      {
        x: 0,
        y: 0,
        width: motherGlass.widthMm,
        height: motherGlass.heightMm,
      },
    ],
    areaUsedMm2: 0,
  };
}

function fitsInRect(rect: FreeRect, width: number, height: number): boolean {
  return width <= rect.width && height <= rect.height;
}

function rectsOverlap(a: FreeRect, b: FreeRect): boolean {
  return !(
    a.x >= b.x + b.width ||
    a.x + a.width <= b.x ||
    a.y >= b.y + b.height ||
    a.y + a.height <= b.y
  );
}

function splitFreeRectangles(freeRects: FreeRect[], placement: FreeRect): FreeRect[] {
  const updated: FreeRect[] = [];

  freeRects.forEach((rect) => {
    if (!rectsOverlap(rect, placement)) {
      updated.push(rect);
      return;
    }

    const leftOverlap = placement.x > rect.x;
    const rightOverlap = placement.x + placement.width < rect.x + rect.width;
    const topOverlap = placement.y > rect.y;
    const bottomOverlap = placement.y + placement.height < rect.y + rect.height;

    if (leftOverlap) {
      updated.push({
        x: rect.x,
        y: rect.y,
        width: placement.x - rect.x,
        height: rect.height,
      });
    }

    if (rightOverlap) {
      updated.push({
        x: placement.x + placement.width,
        y: rect.y,
        width: rect.x + rect.width - (placement.x + placement.width),
        height: rect.height,
      });
    }

    if (topOverlap) {
      const overlapWidthStart = Math.max(rect.x, placement.x);
      const overlapWidthEnd = Math.min(rect.x + rect.width, placement.x + placement.width);
      const width = overlapWidthEnd - overlapWidthStart;
      if (width > 0) {
        updated.push({
          x: overlapWidthStart,
          y: rect.y,
          width,
          height: placement.y - rect.y,
        });
      }
    }

    if (bottomOverlap) {
      const overlapWidthStart = Math.max(rect.x, placement.x);
      const overlapWidthEnd = Math.min(rect.x + rect.width, placement.x + placement.width);
      const width = overlapWidthEnd - overlapWidthStart;
      if (width > 0) {
        updated.push({
          x: overlapWidthStart,
          y: placement.y + placement.height,
          width,
          height: rect.y + rect.height - (placement.y + placement.height),
        });
      }
    }
  });

  return pruneFreeRectangles(updated);
}

function pruneFreeRectangles(freeRects: FreeRect[]): FreeRect[] {
  const pruned: FreeRect[] = [];

  freeRects.forEach((rect) => {
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }

    let contained = false;

    for (let i = 0; i < pruned.length; i += 1) {
      const existing = pruned[i];
      const contains =
        rect.x >= existing.x &&
        rect.y >= existing.y &&
        rect.x + rect.width <= existing.x + existing.width &&
        rect.y + rect.height <= existing.y + existing.height;

      const existingContained =
        existing.x >= rect.x &&
        existing.y >= rect.y &&
        existing.x + existing.width <= rect.x + rect.width &&
        existing.y + existing.height <= rect.y + rect.height;

      if (contains) {
        contained = true;
        break;
      }

      if (existingContained) {
        pruned.splice(i, 1);
        i -= 1;
      }
    }

    if (!contained) {
      pruned.push(rect);
    }
  });

  return pruned;
}

function tryPlaceOnSheet(sheet: SheetWorkingState, orientations: OrientationCandidate[]) {
  let bestRectIndex = -1;
  let bestOrientation: OrientationCandidate | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  let bestRect: FreeRect | null = null;

  sheet.freeRects.forEach((rect, rectIndex) => {
    orientations.forEach((orientation) => {
      if (fitsInRect(rect, orientation.width, orientation.height)) {
        const score = rect.width * rect.height - orientation.width * orientation.height;
        if (score < bestScore) {
          bestScore = score;
          bestRectIndex = rectIndex;
          bestOrientation = orientation;
          bestRect = rect;
        }
      }
    });
  });

  if (bestRectIndex === -1 || !bestOrientation || !bestRect) {
    return null;
  }

  if (!bestRect || !bestOrientation) {
    return null;
  }

  const resolvedRect = bestRect as FreeRect;
  const resolvedOrientation = bestOrientation as OrientationCandidate;

  const placementRect: FreeRect = {
    x: resolvedRect.x,
    y: resolvedRect.y,
    width: resolvedOrientation.width,
    height: resolvedOrientation.height,
  };

  const updatedFreeRects = splitFreeRectangles(sheet.freeRects, placementRect);

  return {
    placement: {
      ...placementRect,
      rotated: resolvedOrientation.rotated,
    },
    updatedFreeRects,
  };
}

function computeMaxCapacityForProduct(
  motherGlass: MotherGlass,
  widthMm: number,
  heightMm: number,
): { capacity: number; rotated: boolean } {
  const orientationA = Math.floor(motherGlass.widthMm / widthMm) * Math.floor(motherGlass.heightMm / heightMm);
  const orientationB = Math.floor(motherGlass.widthMm / heightMm) * Math.floor(motherGlass.heightMm / widthMm);

  if (orientationB > orientationA) {
    return { capacity: orientationB, rotated: true };
  }
  return { capacity: orientationA, rotated: false };
}

function canFitInMotherGlass(widthMm: number, heightMm: number, motherGlass: MotherGlass): boolean {
  return (
    (widthMm <= motherGlass.widthMm && heightMm <= motherGlass.heightMm) ||
    (heightMm <= motherGlass.widthMm && widthMm <= motherGlass.heightMm)
  );
}

function canFitInAnyMotherGlass(widthMm: number, heightMm: number, motherGlasses: MotherGlass[]): boolean {
  return motherGlasses.some((motherGlass) => canFitInMotherGlass(widthMm, heightMm, motherGlass));
}

function computeSingleMotherGlassSheet(
  motherGlass: MotherGlass,
  remaining: Map<string, { product: SelectedGoal['product']; remaining: number }>,
) {
  const expanded: ExpandItem[] = [];

  remaining.forEach((entry) => {
    for (let i = 0; i < entry.remaining; i += 1) {
      expanded.push({
        productId: entry.product.id,
        productName: entry.product.productName,
        modelName: entry.product.modelName,
        widthMm: toNumber(entry.product.widthMm),
        heightMm: toNumber(entry.product.heightMm),
        areaMm2: toNumber(entry.product.areaMm2),
      });
    }
  });

  if (expanded.length === 0) {
    return null;
  }

  expanded.sort((a, b) => b.areaMm2 - a.areaMm2);

  const sheetState = createSheet(0, motherGlass);
  const usedCounts = new Map<string, number>();

  expanded.forEach((item) => {
    const orientations: OrientationCandidate[] = [
      { width: item.widthMm, height: item.heightMm, rotated: false },
      { width: item.heightMm, height: item.widthMm, rotated: true },
    ];

    const fitsAny = orientations.some((orientation) =>
      canFitInMotherGlass(orientation.width, orientation.height, motherGlass),
    );
    if (!fitsAny) {
      return;
    }

    const placementResult = tryPlaceOnSheet(sheetState, orientations);
    if (!placementResult) {
      return;
    }

    const { placement, updatedFreeRects } = placementResult;
    sheetState.placements.push({
      productId: item.productId,
      productName: item.productName,
      modelName: item.modelName,
      widthMm: placement.width,
      heightMm: placement.height,
      rotated: placement.rotated,
      x: placement.x,
      y: placement.y,
      areaMm2: item.areaMm2,
    });
    sheetState.areaUsedMm2 += item.areaMm2;
    sheetState.freeRects = updatedFreeRects;
    usedCounts.set(item.productId, (usedCounts.get(item.productId) ?? 0) + 1);
  });

  if (sheetState.placements.length === 0) {
    return null;
  }

  const sheet: MotherGlassSheetLayout = {
    sheetIndex: 0,
    placements: sheetState.placements.map((placement) => ({ ...placement })),
    areaUsedMm2: sheetState.areaUsedMm2,
  };

  const areaUsedPercent = motherGlass.areaMm2 > 0 ? (sheet.areaUsedMm2 * 100) / motherGlass.areaMm2 : 0;

  return {
    sheet,
    usedCounts,
    areaUsedPercent,
  };
}

function buildLayoutResultFromSheets(
  motherGlass: MotherGlass,
  sheets: MotherGlassSheetLayout[],
  confirmedGoals: SelectedGoal[],
): LayoutComputationResult {
  const placedMap = new Map<string, { count: number; rotated: number; area: number }>();
  const productSheetCounts = new Map<string, number>();

  sheets.forEach((sheet) => {
    const uniqueProductIds = new Set<string>();
    sheet.placements.forEach((placement) => {
      uniqueProductIds.add(placement.productId);
      const entry = placedMap.get(placement.productId) ?? { count: 0, rotated: 0, area: 0 };
      entry.count += 1;
      entry.area += placement.areaMm2;
      if (placement.rotated) {
        entry.rotated += 1;
      }
      placedMap.set(placement.productId, entry);
    });
    uniqueProductIds.forEach((productId) => {
      productSheetCounts.set(productId, (productSheetCounts.get(productId) ?? 0) + 1);
    });
  });

  const summaries: MotherGlassProductSummary[] = confirmedGoals.map((goal) => {
    const widthMm = toNumber(goal.product.widthMm);
    const heightMm = toNumber(goal.product.heightMm);
    const areaMm2 = toNumber(goal.product.areaMm2);

    const placedEntry = placedMap.get(goal.product.id) ?? { count: 0, rotated: 0, area: 0 };
    const placedQuantity = placedEntry.count;
    const rotatedCount = placedEntry.rotated;
    const requestedQuantity = goal.quantity;
    const unplacedQuantity = Math.max(0, requestedQuantity - placedQuantity);
    const motherGlassesUsed = productSheetCounts.get(goal.product.id) ?? 0;

    const maxCapacityInfo = computeMaxCapacityForProduct(motherGlass, widthMm, heightMm);
    const theoreticalAreaUtilizationPercent = motherGlass.areaMm2 > 0
      ? (maxCapacityInfo.capacity * areaMm2 * 100) / motherGlass.areaMm2
      : 0;

    const effectiveAreaUtilizationPercent = motherGlassesUsed > 0
      ? (placedEntry.area * 100) / (motherGlassesUsed * motherGlass.areaMm2)
      : 0;

    return {
      productId: goal.product.id,
      productName: goal.product.productName,
      modelName: goal.product.modelName,
      requestedQuantity,
      placedQuantity,
      unplacedQuantity,
      rotatedCount,
      motherGlassesUsed,
      maxPerMotherGlass: maxCapacityInfo.capacity,
      theoreticalAreaUtilizationPercent,
      effectiveAreaUtilizationPercent,
      totalAreaUsedMm2: placedEntry.area,
    };
  });

  return {
    motherGlass,
    sheets,
    summaries,
  };
}

export interface MotherGlassOptimizationResult {
  layoutResults: LayoutComputationResult[];
  totalPlacedQuantity: number;
  totalUnplacedQuantity: number;
  totalMotherGlassesUsed: number;
  overallAreaUtilizationPercent: number;
}

export function computeOptimalMotherGlassPlan(
  motherGlasses: MotherGlass[],
  confirmedGoals: SelectedGoal[],
): MotherGlassOptimizationResult | null {
  const totalRequested = confirmedGoals.reduce((sum, goal) => sum + goal.quantity, 0);
  if (totalRequested === 0) {
    return null;
  }

  const remaining = new Map(
    confirmedGoals.map((goal) => [goal.product.id, { product: goal.product, remaining: goal.quantity }]),
  );

  const motherGlassSheets = new Map<string, { motherGlass: MotherGlass; sheets: MotherGlassSheetLayout[] }>();
  let totalAreaUsedMm2 = 0;

  while (true) {
    let bestChoice: SheetSelection | null = null;

    motherGlasses.forEach((motherGlass) => {
      const sheetResult = computeSingleMotherGlassSheet(motherGlass, remaining);
      if (!sheetResult) {
        return;
      }

      if (
        !bestChoice ||
        sheetResult.areaUsedPercent > bestChoice.areaUsedPercent + 1e-6 ||
        (
          Math.abs(sheetResult.areaUsedPercent - bestChoice.areaUsedPercent) <= 1e-6 &&
          sheetResult.sheet.areaUsedMm2 > bestChoice.sheet.areaUsedMm2
        )
      ) {
        bestChoice = {
          motherGlass,
          sheet: sheetResult.sheet,
          usedCounts: sheetResult.usedCounts,
          areaUsedPercent: sheetResult.areaUsedPercent,
        };
      }
    });

    if (!bestChoice) {
      break;
    }

    const choice = bestChoice as SheetSelection;

    choice.usedCounts.forEach((count, productId) => {
      const entry = remaining.get(productId);
      if (entry) {
        entry.remaining = Math.max(0, entry.remaining - count);
      }
    });

    const existing = motherGlassSheets.get(choice.motherGlass.id) ?? {
      motherGlass: choice.motherGlass,
      sheets: [],
    };
    const sheetIndex = existing.sheets.length + 1;
    existing.sheets.push({
      sheetIndex,
      placements: choice.sheet.placements.map((placement) => ({ ...placement })),
      areaUsedMm2: choice.sheet.areaUsedMm2,
    });
    motherGlassSheets.set(choice.motherGlass.id, existing);

    totalAreaUsedMm2 += choice.sheet.areaUsedMm2;
  }

  const remainingUnplaced = Array.from(remaining.values()).reduce((sum, entry) => sum + entry.remaining, 0);

  if (remainingUnplaced > 0) {
    const hasFeasibleRemaining = Array.from(remaining.values()).some((entry) =>
      entry.remaining > 0 &&
      canFitInAnyMotherGlass(
        toNumber(entry.product.widthMm),
        toNumber(entry.product.heightMm),
        motherGlasses,
      ),
    );
    if (hasFeasibleRemaining) {
      return null;
    }
  }

  const layoutResults: LayoutComputationResult[] = [];

  motherGlassSheets.forEach(({ motherGlass, sheets }) => {
    layoutResults.push(buildLayoutResultFromSheets(motherGlass, sheets, confirmedGoals));
  });

  if (layoutResults.length === 0) {
    return null;
  }

  const totalPlacedQuantity = layoutResults.reduce(
    (sum, result) => sum + result.summaries.reduce((inner, summary) => inner + summary.placedQuantity, 0),
    0,
  );

  const totalMotherGlassesUsed = layoutResults.reduce((sum, result) => sum + result.sheets.length, 0);
  const totalMotherGlassAreaMm2 = layoutResults.reduce(
    (sum, result) => sum + result.sheets.length * result.motherGlass.areaMm2,
    0,
  );

  const overallAreaUtilizationPercent = totalMotherGlassAreaMm2 > 0
    ? (totalAreaUsedMm2 * 100) / totalMotherGlassAreaMm2
    : 0;

  return {
    layoutResults,
    totalPlacedQuantity,
    totalUnplacedQuantity: remainingUnplaced,
    totalMotherGlassesUsed,
    overallAreaUtilizationPercent,
  };
}
