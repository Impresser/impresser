"use client";

import { useImageGeneratorStore } from "@/store/imageGeneratorStore";

export function usePatternForm() {
  const form = useImageGeneratorStore((s) => s.form);
  const setFormField = useImageGeneratorStore((s) => s.setFormField);
  const resetForm = useImageGeneratorStore((s) => s.resetForm);
  return { form, setFormField, resetForm };
}









