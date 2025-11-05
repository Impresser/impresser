"use client";

import { useImageGeneratorStore } from "@/store/imageGeneratorStore";

export function usePatternJobs() {
  const jobs = useImageGeneratorStore((s) => s.jobs);
  const generatedCount = useImageGeneratorStore((s) => s.generatedCount);
  const addJob = useImageGeneratorStore((s) => s.addJob);
  const updateJobProgress = useImageGeneratorStore((s) => s.updateJobProgress);
  const markJobDone = useImageGeneratorStore((s) => s.markJobDone);
  return { jobs, generatedCount, addJob, updateJobProgress, markJobDone };
}








