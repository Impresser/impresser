export type PrinterStatusKey = 'OPERATIONAL' | 'UNDER_REPAIR' | 'BROKEN';

export const STATUS_ORDER: PrinterStatusKey[] = ['OPERATIONAL', 'UNDER_REPAIR', 'BROKEN'];

export const GENERATION_CONFIG = [
  { suffix: '8000', label: '8세대' },
  { suffix: '7000', label: '7세대' },
  { suffix: '6000', label: '6세대' },
] as const;

export type GenerationLabel = (typeof GENERATION_CONFIG)[number]['label'];

export interface GenerationStats {
  total: number;
  available: number;
  byStatus: Record<PrinterStatusKey, number>;
}

export type GenerationStatsMap = Record<GenerationLabel, GenerationStats>;

export function createInitialGenerationStats(): GenerationStatsMap {
  return GENERATION_CONFIG.reduce<GenerationStatsMap>((acc, config) => {
    acc[config.label] = {
      total: 0,
      available: 0,
      byStatus: {
        OPERATIONAL: 0,
        UNDER_REPAIR: 0,
        BROKEN: 0,
      },
    };
    return acc;
  }, {} as GenerationStatsMap);
}

export function resolveGenerationLabel(modelName: string): GenerationLabel | null {
  const suffix = modelName.slice(-4);
  const match = GENERATION_CONFIG.find((config) => suffix === config.suffix);
  return match ? match.label : null;
}

