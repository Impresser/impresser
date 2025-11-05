"use client";

import { create } from "zustand";

export type AxisPair = { x: number | ""; y: number | "" };

export type ChannelConfig = {
  count: AxisPair; // 개수 X,Y
  size: AxisPair; // 크기 X,Y
  spacing: AxisPair; // 간격 X,Y
};

export type PatternFormState = {
  imageSize: { w: number | ""; h: number | "" };
  gapRG: AxisPair;
  gapGB: AxisPair;
  channels: Record<"R" | "G" | "B", ChannelConfig>;
  rgb: { r: number | ""; g: number | ""; b: number | "" };
};

export type JobStatus = "진행" | "완료";

export type PatternJob = {
  id: string;
  generationUuid?: string; // API 응답에서 받은 UUID
  createdAt: string; // ISO string
  imageSizeLabel: string; // e.g. 1920x1080
  status: JobStatus;
  owner: string;
  startTime: string; // HH:mm:ss
  etaTime: string; // HH:mm:ss
  elapsed: string; // mm:ss
  progress: number; // 0-100
  form: PatternFormState; // 생성 시 사용한 폼 데이터
};

type ImageGeneratorStore = {
  form: PatternFormState;
  jobs: PatternJob[];
  generatedCount: number;

  // setters
  setFormField: (path: string, value: number | "") => void;
  resetForm: () => void;
  addJob: (owner?: string, generationUuid?: string) => string; // job ID 반환
  updateJobProgress: (id: string, progress: number) => void;
  markJobDone: (id: string) => void;
};

const emptyAxis = (): AxisPair => ({ x: "", y: "" });

const initialForm: PatternFormState = {
  imageSize: { w: "", h: "" },
  gapRG: emptyAxis(),
  gapGB: emptyAxis(),
  channels: {
    R: { count: emptyAxis(), size: emptyAxis(), spacing: emptyAxis() },
    G: { count: emptyAxis(), size: emptyAxis(), spacing: emptyAxis() },
    B: { count: emptyAxis(), size: emptyAxis(), spacing: emptyAxis() },
  },
  rgb: { r: 255, g: 255, b: 255 },
};

function formatTwo(n: number) {
  return n.toString().padStart(2, "0");
}

function nowTimes() {
  const now = new Date();
  const h = formatTwo(now.getHours());
  const m = formatTwo(now.getMinutes());
  const s = formatTwo(now.getSeconds());
  return `${h}:${m}:${s}`;
}

function addMinutes(time: string, minutes: number): string {
  const [h, m, s] = time.split(":").map((v) => parseInt(v, 10));
  const date = new Date();
  date.setHours(h, m + minutes, s, 0);
  return `${formatTwo(date.getHours())}:${formatTwo(date.getMinutes())}:${formatTwo(date.getSeconds())}`;
}

export const useImageGeneratorStore = create<ImageGeneratorStore>((set, get) => ({
  form: initialForm,
  jobs: [],
  generatedCount: 0,

  setFormField: (path, value) => {
    set((state) => {
      const draft: any = structuredClone(state.form);
      // path 예: "imageSize.w", "gapRG.x", "channels.R.count.x"
      const parts = path.split(".");
      let cursor: any = draft;
      for (let i = 0; i < parts.length - 1; i++) {
        cursor = cursor[parts[i]];
      }
      cursor[parts[parts.length - 1]] = value;
      return { form: draft };
    });
  },

  resetForm: () => set(() => ({ form: initialForm })),

  addJob: (owner = "홍길동", generationUuid?: string) => {
    const state = get();
    const { w, h } = state.form.imageSize;
    const imageSizeLabel = `${w || 0}x${h || 0}`;
    const createdAt = new Date().toISOString();
    const startTime = nowTimes();
    const etaTime = addMinutes(startTime, 10);
    const id = `${Date.now()}`;
    const newJob: PatternJob = {
      id,
      generationUuid,
      createdAt,
      imageSizeLabel,
      status: "진행",
      owner,
      startTime,
      etaTime,
      elapsed: "00:00",
      progress: 0,
      form: structuredClone(state.form), // 생성 시 폼 상태 저장
    };
    set((s) => ({ jobs: [newJob, ...s.jobs], generatedCount: s.generatedCount + 1 }));
    return id; // job ID 반환
  },

  updateJobProgress: (id, progress) => {
    set((s) => ({
      jobs: s.jobs.map((j) => (j.id === id ? { ...j, progress } : j)),
    }));
  },

  markJobDone: (id) => {
    set((s) => ({
      jobs: s.jobs.map((j) =>
        j.id === id ? { ...j, status: "완료", progress: 100 } : j
      ),
    }));
  },
}));


