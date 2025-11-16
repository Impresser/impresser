/// <reference lib="webworker" />
import { computeOptimalMotherGlassPlan } from '../utils/layoutCalculations';

export type OptimizationWorkerIn = {
  availableMotherGlasses: any[];
  goals: any[];
};

export type OptimizationWorkerOut = {
  ok: true;
  result: any;
} | {
  ok: false;
  error: string;
};

self.onmessage = (event: MessageEvent<OptimizationWorkerIn>) => {
  try {
    const { availableMotherGlasses, goals } = event.data;
    const result = computeOptimalMotherGlassPlan(availableMotherGlasses, goals);
    const out: OptimizationWorkerOut = { ok: true, result };
    (self as unknown as Worker).postMessage(out);
  } catch (err: any) {
    const out: OptimizationWorkerOut = { ok: false, error: String(err?.message ?? err) };
    (self as unknown as Worker).postMessage(out);
  }
};


