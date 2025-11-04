"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import CommonContainerBox from "@/components/ui/CommonContainerBox";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, RadialBarChart, RadialBar, PolarAngleAxis, Cell, ReferenceLine, ReferenceArea } from "recharts";
import CommonPagination from "@/components/ui/CommonPagination";
import RadioButton from "@/components/ui/RadioButton";

type AlgorithmKey = "LZW" | "PackBits" | "Deflate";

type AlgorithmPerf = {
  key: AlgorithmKey;
  label: string;
  avgSpeedMBps: number; // 평균 속도 (MB/s)
  version: string;
  mode: "GPU" | "CPU";
};

type DetailRow = {
  id: number;
  name: string;
  mode: "GPU" | "CPU";
  algorithm: AlgorithmKey;
  version: string;
  size: string;
  owner: string;
  startedAt: string;
  finishedAt: string;
  elapsed: string; // 소요시간
  inputFormat: string;
  outputFormat: string;
  avgGpuUtilPercent: number;
  avgSpeedMBps: number;
  maxSpeedMBps: number;
  minSpeedKBps: number;
};

// 20개 데이터 생성 (CPU와 GPU 혼합)
const ALGORITHMS: AlgorithmPerf[] = [
  { key: "LZW" as AlgorithmKey, label: "LZW", avgSpeedMBps: 20, version: "0.114", mode: "GPU" as const },
  { key: "PackBits" as AlgorithmKey, label: "PackBits", avgSpeedMBps: 12.3, version: "0.2.1", mode: "GPU" as const },
  { key: "Deflate" as AlgorithmKey, label: "Deflate", avgSpeedMBps: 9.2, version: "0.4.1", mode: "GPU" as const },
  { key: "LZW" as AlgorithmKey, label: "LZW", avgSpeedMBps: 18.5, version: "0.114", mode: "CPU" as const },
  { key: "PackBits" as AlgorithmKey, label: "PackBits", avgSpeedMBps: 11.8, version: "0.2.1", mode: "CPU" as const },
  { key: "Deflate" as AlgorithmKey, label: "Deflate", avgSpeedMBps: 8.7, version: "0.4.1", mode: "CPU" as const },
  { key: "LZW" as AlgorithmKey, label: "LZW", avgSpeedMBps: 19.2, version: "0.115", mode: "GPU" as const },
  { key: "PackBits" as AlgorithmKey, label: "PackBits", avgSpeedMBps: 13.1, version: "0.2.2", mode: "GPU" as const },
  { key: "Deflate" as AlgorithmKey, label: "Deflate", avgSpeedMBps: 9.8, version: "0.4.2", mode: "GPU" as const },
  { key: "LZW" as AlgorithmKey, label: "LZW", avgSpeedMBps: 17.9, version: "0.115", mode: "CPU" as const },
  { key: "PackBits" as AlgorithmKey, label: "PackBits", avgSpeedMBps: 11.2, version: "0.2.2", mode: "CPU" as const },
  { key: "Deflate" as AlgorithmKey, label: "Deflate", avgSpeedMBps: 8.3, version: "0.4.2", mode: "CPU" as const },
  { key: "LZW" as AlgorithmKey, label: "LZW", avgSpeedMBps: 20.3, version: "0.116", mode: "GPU" as const },
  { key: "PackBits" as AlgorithmKey, label: "PackBits", avgSpeedMBps: 12.7, version: "0.2.3", mode: "GPU" as const },
  { key: "Deflate" as AlgorithmKey, label: "Deflate", avgSpeedMBps: 9.5, version: "0.4.3", mode: "GPU" as const },
  { key: "LZW" as AlgorithmKey, label: "LZW", avgSpeedMBps: 16.8, version: "0.116", mode: "CPU" as const },
  { key: "PackBits" as AlgorithmKey, label: "PackBits", avgSpeedMBps: 10.9, version: "0.2.3", mode: "CPU" as const },
  { key: "Deflate" as AlgorithmKey, label: "Deflate", avgSpeedMBps: 7.9, version: "0.4.3", mode: "CPU" as const },
  { key: "LZW" as AlgorithmKey, label: "LZW", avgSpeedMBps: 19.8, version: "0.117", mode: "GPU" as const },
  { key: "PackBits" as AlgorithmKey, label: "PackBits", avgSpeedMBps: 12.9, version: "0.2.4", mode: "GPU" as const }
].sort((a, b) => b.avgSpeedMBps - a.avgSpeedMBps); // 속도 기준으로 정렬

// 각 알고리즘+버전+방식 조합별 작업 목록 생성
const JOB_LISTS: DetailRow[] = [
  // LZW GPU 0.114
  { id: 1, name: "DLEDPRINTING0001.BMP", mode: "GPU", algorithm: "LZW", version: "0.114", size: "1.7GB", owner: "정유진", startedAt: "2025. 10. 21. 17:10:46", finishedAt: "2025. 10. 21. 17:40:48", elapsed: "10:46", inputFormat: "BMP", outputFormat: "TIFF", avgGpuUtilPercent: 57, avgSpeedMBps: 2.7, maxSpeedMBps: 3.2, minSpeedKBps: 200 },
  { id: 2, name: "DLEDPRINTING0002.BMP", mode: "GPU", algorithm: "LZW", version: "0.114", size: "2.1GB", owner: "김철수", startedAt: "2025. 10. 21. 18:00:00", finishedAt: "2025. 10. 21. 18:32:15", elapsed: "32:15", inputFormat: "BMP", outputFormat: "TIFF", avgGpuUtilPercent: 59, avgSpeedMBps: 2.8, maxSpeedMBps: 3.4, minSpeedKBps: 210 },
  { id: 3, name: "DLEDPRINTING0003.BMP", mode: "GPU", algorithm: "LZW", version: "0.114", size: "1.5GB", owner: "이영희", startedAt: "2025. 10. 21. 19:00:00", finishedAt: "2025. 10. 21. 19:28:30", elapsed: "28:30", inputFormat: "BMP", outputFormat: "TIFF", avgGpuUtilPercent: 55, avgSpeedMBps: 2.6, maxSpeedMBps: 3.1, minSpeedKBps: 195 },
  { id: 12, name: "DLEDPRINTING0006.BMP", mode: "GPU", algorithm: "LZW", version: "0.114", size: "1.8GB", owner: "박수진", startedAt: "2025. 10. 21. 20:15:00", finishedAt: "2025. 10. 21. 20:45:20", elapsed: "30:20", inputFormat: "BMP", outputFormat: "TIFF", avgGpuUtilPercent: 58, avgSpeedMBps: 2.75, maxSpeedMBps: 3.3, minSpeedKBps: 205 },
  { id: 13, name: "DLEDPRINTING0007.BMP", mode: "GPU", algorithm: "LZW", version: "0.114", size: "2.0GB", owner: "최민호", startedAt: "2025. 10. 21. 21:00:00", finishedAt: "2025. 10. 21. 21:31:45", elapsed: "31:45", inputFormat: "BMP", outputFormat: "TIFF", avgGpuUtilPercent: 60, avgSpeedMBps: 2.85, maxSpeedMBps: 3.5, minSpeedKBps: 215 },
  { id: 14, name: "DLEDPRINTING0008.BMP", mode: "GPU", algorithm: "LZW", version: "0.114", size: "1.6GB", owner: "이지은", startedAt: "2025. 10. 21. 22:00:00", finishedAt: "2025. 10. 21. 22:29:10", elapsed: "29:10", inputFormat: "BMP", outputFormat: "TIFF", avgGpuUtilPercent: 56, avgSpeedMBps: 2.65, maxSpeedMBps: 3.15, minSpeedKBps: 198 },
  // PackBits GPU 0.2.1
  { id: 4, name: "SCAN_20251021_002.TIF", mode: "GPU", algorithm: "PackBits", version: "0.2.1", size: "980MB", owner: "최가람", startedAt: "2025. 10. 22. 09:00:12", finishedAt: "2025. 10. 22. 09:18:33", elapsed: "18:21", inputFormat: "TIFF", outputFormat: "TIFF", avgGpuUtilPercent: 51, avgSpeedMBps: 2.1, maxSpeedMBps: 2.9, minSpeedKBps: 180 },
  { id: 5, name: "SCAN_20251021_003.TIF", mode: "GPU", algorithm: "PackBits", version: "0.2.1", size: "1.2GB", owner: "박민수", startedAt: "2025. 10. 22. 10:00:00", finishedAt: "2025. 10. 22. 10:22:45", elapsed: "22:45", inputFormat: "TIFF", outputFormat: "TIFF", avgGpuUtilPercent: 53, avgSpeedMBps: 2.2, maxSpeedMBps: 3.0, minSpeedKBps: 185 },
  // Deflate GPU 0.4.1
  { id: 6, name: "ARCHIVE_00123.BMP", mode: "GPU", algorithm: "Deflate", version: "0.4.1", size: "2.3GB", owner: "김도윤", startedAt: "2025. 10. 20. 14:02:10", finishedAt: "2025. 10. 20. 14:27:41", elapsed: "25:31", inputFormat: "BMP", outputFormat: "TIFF", avgGpuUtilPercent: 46, avgSpeedMBps: 1.8, maxSpeedMBps: 2.3, minSpeedKBps: 160 },
  { id: 7, name: "ARCHIVE_00124.BMP", mode: "GPU", algorithm: "Deflate", version: "0.4.1", size: "2.0GB", owner: "홍길동", startedAt: "2025. 10. 20. 15:00:00", finishedAt: "2025. 10. 20. 15:23:20", elapsed: "23:20", inputFormat: "BMP", outputFormat: "TIFF", avgGpuUtilPercent: 48, avgSpeedMBps: 1.9, maxSpeedMBps: 2.4, minSpeedKBps: 165 },
  // LZW CPU 0.114
  { id: 8, name: "DLEDPRINTING0004.BMP", mode: "CPU", algorithm: "LZW", version: "0.114", size: "1.7GB", owner: "정유진", startedAt: "2025. 10. 21. 20:00:00", finishedAt: "2025. 10. 21. 20:45:00", elapsed: "45:00", inputFormat: "BMP", outputFormat: "TIFF", avgGpuUtilPercent: 0, avgSpeedMBps: 2.5, maxSpeedMBps: 3.0, minSpeedKBps: 190 },
  { id: 9, name: "DLEDPRINTING0005.BMP", mode: "CPU", algorithm: "LZW", version: "0.114", size: "1.9GB", owner: "김철수", startedAt: "2025. 10. 21. 21:00:00", finishedAt: "2025. 10. 21. 21:48:30", elapsed: "48:30", inputFormat: "BMP", outputFormat: "TIFF", avgGpuUtilPercent: 0, avgSpeedMBps: 2.4, maxSpeedMBps: 2.9, minSpeedKBps: 185 },
  // PackBits CPU 0.2.1
  { id: 10, name: "SCAN_20251021_004.TIF", mode: "CPU", algorithm: "PackBits", version: "0.2.1", size: "980MB", owner: "최가람", startedAt: "2025. 10. 22. 11:00:00", finishedAt: "2025. 10. 22. 11:25:00", elapsed: "25:00", inputFormat: "TIFF", outputFormat: "TIFF", avgGpuUtilPercent: 0, avgSpeedMBps: 2.0, maxSpeedMBps: 2.7, minSpeedKBps: 175 },
  // Deflate CPU 0.4.1
  { id: 11, name: "ARCHIVE_00125.BMP", mode: "CPU", algorithm: "Deflate", version: "0.4.1", size: "2.3GB", owner: "김도윤", startedAt: "2025. 10. 20. 16:00:00", finishedAt: "2025. 10. 20. 16:35:00", elapsed: "35:00", inputFormat: "BMP", outputFormat: "TIFF", avgGpuUtilPercent: 0, avgSpeedMBps: 1.7, maxSpeedMBps: 2.2, minSpeedKBps: 155 },
];

function PrettyNumber({ value, unit }: { value: number; unit: string }) {
  return <span>{value.toLocaleString(undefined, { maximumFractionDigits: 1 })}{unit}</span>;
}

function RadialGauge({ percent, size = 120, color = "#5A73FF" }: { percent: number; size?: number; color?: string }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const inner = Math.max(10, Math.floor(size / 2) - 28);
  const outer = Math.max(inner + 10, Math.floor(size / 2) - 10);
  const startAngle = 90; // 12시
  const endAngle = -270; // 시계방향 360도

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      {/* 배경 링 */}
      <RadialBarChart width={size} height={size} cx="50%" cy="50%" innerRadius={inner} outerRadius={outer} startAngle={startAngle} endAngle={endAngle} data={[{ name: "bg", value: 100 }]}
        style={{ position: "absolute", inset: 0 }}>
        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
        <RadialBar dataKey="value" cornerRadius={10} fill="#E5E7EB" background={false} />
      </RadialBarChart>
      {/* 실제 값 */}
      <RadialBarChart width={size} height={size} cx="50%" cy="50%" innerRadius={inner} outerRadius={outer} startAngle={startAngle} endAngle={endAngle} data={[{ name: "v", value: clamped }]}
        style={{ position: "absolute", inset: 0 }}>
        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
        <RadialBar dataKey="value" cornerRadius={10} fill={color} />
      </RadialBarChart>
      {/* 중앙 텍스트 */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: Math.round(size * 0.2), color: "#111827" }}>
        {clamped}%
      </div>
    </div>
  );
}

export default function EquipmentUsage() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedDetailId, setSelectedDetailId] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [jobListPage, setJobListPage] = useState(1);
  const [modeFilter, setModeFilter] = useState<"전체" | "CPU" | "GPU">("전체");
  const detailRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => setMounted(true), []);

  // 필터링된 데이터
  const filteredAlgorithms = useMemo(() => {
    if (modeFilter === "전체") {
      return ALGORITHMS;
    }
    return ALGORITHMS.filter(a => a.mode === modeFilter);
  }, [modeFilter]);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredAlgorithms.length / itemsPerPage);
  
  const currentPageData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredAlgorithms.slice(start, end);
  }, [currentPage, filteredAlgorithms]);

  const maxSpeed = useMemo(() => {
    return Math.max(...filteredAlgorithms.map(a => a.avgSpeedMBps));
  }, [filteredAlgorithms]);
  const overallAvg = useMemo(() => {
    const sum = filteredAlgorithms.reduce((acc, a) => acc + a.avgSpeedMBps, 0);
    return sum / filteredAlgorithms.length;
  }, [filteredAlgorithms]);
  const range1 = maxSpeed * 0.5; // 낮음
  const range2 = maxSpeed * 0.8; // 보통

  const selectedItem = selectedIndex !== null ? filteredAlgorithms[selectedIndex] : null;
  
  // 선택된 알고리즘 조합과 일치하는 작업 목록
  const jobList = useMemo(() => {
    if (!selectedItem) return [];
    return JOB_LISTS.filter(
      job => job.algorithm === selectedItem.key && 
             job.version === selectedItem.version && 
             job.mode === selectedItem.mode
    );
  }, [selectedItem]);

  // 작업 목록 페이지네이션
  const jobListItemsPerPage = 5;
  const jobListTotalPages = Math.ceil(jobList.length / jobListItemsPerPage);
  const currentJobListData = useMemo(() => {
    const start = (jobListPage - 1) * jobListItemsPerPage;
    const end = start + jobListItemsPerPage;
    return jobList.slice(start, end);
  }, [jobList, jobListPage]);

  // 선택된 작업 상세 정보
  const selectedDetail = selectedDetailId !== null 
    ? JOB_LISTS.find(job => job.id === selectedDetailId) || null
    : null;

  function interpolateColor(startHex: string, endHex: string, t: number) {
    const sh = startHex.replace('#', '');
    const eh = endHex.replace('#', '');
    const sr = parseInt(sh.substring(0, 2), 16);
    const sg = parseInt(sh.substring(2, 4), 16);
    const sb = parseInt(sh.substring(4, 6), 16);
    const er = parseInt(eh.substring(0, 2), 16);
    const eg = parseInt(eh.substring(2, 4), 16);
    const eb = parseInt(eh.substring(4, 6), 16);
    const r = Math.round(sr + (er - sr) * t).toString(16).padStart(2, '0');
    const g = Math.round(sg + (eg - sg) * t).toString(16).padStart(2, '0');
    const b = Math.round(sb + (eb - sb) * t).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }

  // 항목 선택 시 상세 영역으로 스무스 스크롤
  useEffect(() => {
    if ((selectedItem || selectedDetail) && detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedItem, selectedDetail]);

  // 필터 변경 시 페이지와 선택 초기화
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIndex(null);
    setSelectedDetailId(null);
  }, [modeFilter]);

  // 알고리즘 조합 선택 시 작업 목록 초기화
  useEffect(() => {
    setSelectedDetailId(null);
    setJobListPage(1);
  }, [selectedIndex]);

  return (
    <CommonContainerBox>
      <div className="flex flex-col gap-4">
      {/* 상단: 좌측 그래프, 우측 순위 표 */}
      <div className="flex gap-4 flex-wrap min-w-0 items-stretch">
        {/* 좌측 Recharts 세로 막대 차트 */}
        <div className="flex-1 min-w-[280px] border border-gray-200 rounded-lg p-4 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold">전체 압축 성능 순위</div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">처리방식:</span>
            <div className="flex gap-3">
              <RadioButton
                name="modeFilter"
                value="전체"
                label="전체"
                checked={modeFilter === "전체"}
                onChange={(value) => setModeFilter(value as "전체" | "CPU" | "GPU")}
              />
              <RadioButton
                name="modeFilter"
                value="CPU"
                label="CPU"
                checked={modeFilter === "CPU"}
                onChange={(value) => setModeFilter(value as "전체" | "CPU" | "GPU")}
              />
              <RadioButton
                name="modeFilter"
                value="GPU"
                label="GPU"
                checked={modeFilter === "GPU"}
                onChange={(value) => setModeFilter(value as "전체" | "CPU" | "GPU")}
              />
            </div>
          </div>
        </div>
          <div className="w-full flex-1 min-w-0 min-h-0">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={currentPageData} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }} barCategoryGap={12}>
                  <defs>
                    <linearGradient id="bulletBarGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#a9c0ff" />
                      <stop offset="100%" stopColor="#5A73FF" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#f3f4f6" />
                  <XAxis type="number" domain={[0, maxSpeed]} hide />
                  <YAxis 
                    type="category" 
                    dataKey="label" 
                    width={150} 
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                    tickFormatter={(value, index) => {
                      const item = currentPageData[index];
                      if (item) {
                        return `${item.label} ${item.version} ${item.mode}`;
                      }
                      return value;
                    }}
                  />
                  <Tooltip formatter={(v: number) => `${v.toLocaleString(undefined, { maximumFractionDigits: 1 })} MB/s`} />
                  {/* 불릿 차트: 정성 구간 배경 */}
                  <ReferenceArea x1={0} x2={range1} fill="#f7f7f8" strokeOpacity={0} />
                  <ReferenceArea x1={range1} x2={range2} fill="#eceef2" strokeOpacity={0} />
                  <ReferenceArea x1={range2} x2={maxSpeed} fill="#e2e6ee" strokeOpacity={0} />
                  {/* 타겟(전체 평균) 마커 */}
                  <ReferenceLine 
                    x={overallAvg} 
                    stroke="#ef4444" 
                    strokeWidth={2} 
                    strokeDasharray="3 3" 
                    label={{ 
                      value: `평균 ${overallAvg.toFixed(1)} MB/s`, 
                      position: "right", 
                      fill: "#ef4444", 
                      fontSize: 11,
                      fontWeight: 600,
                      offset: 5
                    }} 
                  />
                  {/* 측정값 바 (그라데이션) */}
                  <Bar dataKey="avgSpeedMBps" name="평균속도(MB/s)" fill="url(#bulletBarGradient)" radius={[0, 8, 8, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 우측 순위 표 */}
        <div className="flex-1 min-w-[280px] border border-gray-200 rounded-lg p-4 flex flex-col">
          <div className="overflow-hidden rounded-md border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-gray-700">
                  <th className="text-center font-semibold text-xs tracking-wide py-2 px-3 w-16">순위</th>
                  <th className="text-left font-semibold text-xs tracking-wide py-2 px-3">알고리즘</th>
                  <th className="text-center font-semibold text-xs tracking-wide py-2 px-3 w-20">버전</th>
                  <th className="text-center font-semibold text-xs tracking-wide py-2 px-3 w-16">방식</th>
                  <th className="text-right font-semibold text-xs tracking-wide py-2 px-3 w-36">평균압축속도</th>
                </tr>
              </thead>
              <tbody>
                {currentPageData.map((a, idx) => {
                  const globalIndex = (currentPage - 1) * itemsPerPage + idx;
                  const isActive = selectedIndex === globalIndex;
                  return (
                    <tr
                      key={`${a.key}-${globalIndex}`}
                      onClick={() => setSelectedIndex(prev => (prev === globalIndex ? null : globalIndex))}
                      className={`cursor-pointer odd:bg-white even:bg-gray-50 hover:bg-gray-100 ${isActive ? 'ring-1 ring-inset ring-blue-300 bg-blue-50' : ''}`}
                    >
                      <td className="py-2 px-3 text-center text-gray-600">
                        <span className="inline-flex items-center justify-center rounded-full bg-gray-200 text-gray-700 text-xs h-6 w-10">
                          {globalIndex + 1}위
                        </span>
                      </td>
                      <td className="py-2 px-3 text-left font-medium text-gray-800">{a.label}</td>
                      <td className="py-2 px-3 text-center">
                        <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 border border-gray-200 px-2 py-0.5 text-[11px]">
                          v{a.version}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className={`${a.mode === 'GPU' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'} inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]`}>
                          {a.mode}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right text-gray-800">
                        <PrettyNumber value={a.avgSpeedMBps} unit="MB/s" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* 페이지네이션: 공통 컴포넌트 사용 */}
          <div>
            <CommonPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onChange={(p) => {
                setCurrentPage(p);
                setSelectedIndex(null);
              }}
            />
          </div>
        </div>
      </div>

      {/* 하단 작업 목록 (알고리즘 조합 선택 시 표시) */}
      {selectedItem && jobList.length > 0 && (
      <div ref={detailRef} className="border border-gray-200 rounded-lg">
        <div className="p-3">
          <div className="mb-3 font-semibold text-gray-700">
            {selectedItem.label} {selectedItem.version} {selectedItem.mode} 작업 목록
          </div>
          {/* 작업 목록 표 */}
          <div className="overflow-hidden rounded-md border border-gray-200">
            <table className="w-full text-sm border-separate border-spacing-y-0">
              <thead>
                <tr className="text-gray-700 bg-gray-50">
                  <th className="text-left font-semibold text-xs tracking-wide py-2 px-3 w-[60px]">순위</th>
                  <th className="text-left font-semibold text-xs tracking-wide py-2 px-3">이름</th>
                  <th className="text-left font-semibold text-xs tracking-wide py-2 px-3 w-20">방식</th>
                  <th className="text-left font-semibold text-xs tracking-wide py-2 px-3 w-[110px]">알고리즘</th>
                  <th className="text-left font-semibold text-xs tracking-wide py-2 px-3 w-[90px]">버전</th>
                  <th className="text-left font-semibold text-xs tracking-wide py-2 px-3 w-[90px]">용량</th>
                  <th className="text-left font-semibold text-xs tracking-wide py-2 px-3 w-[90px]">담당자</th>
                  <th className="text-right font-semibold text-xs tracking-wide py-2 px-3 w-[100px]">평균압축속도</th>
                  <th className="text-right font-semibold text-xs tracking-wide py-2 px-3 w-20">소요시간</th>
                </tr>
              </thead>
              <tbody>
                {currentJobListData.map((job, idx) => {
                  const isActive = selectedDetailId === job.id;
                  const globalIndex = (jobListPage - 1) * jobListItemsPerPage + idx;
                  return (
                    <tr
                      key={job.id}
                      onClick={() => setSelectedDetailId(prev => (prev === job.id ? null : job.id))}
                      className={`cursor-pointer group ${isActive ? 'ring-1 ring-inset ring-blue-300 bg-blue-50' : ''}`}
                    >
                      <td className="h-10 py-0 px-3 text-left text-gray-600 border border-gray-200 border-r-0 bg-white group-hover:bg-gray-50 w-[60px]">{globalIndex + 1}</td>
                      <td className="h-10 py-0 px-3 text-left border-t border-b border-gray-200 bg-white group-hover:bg-gray-50">{job.name}</td>
                      <td className="h-10 py-0 px-3 text-left border-t border-b border-gray-200 bg-white group-hover:bg-gray-50 w-20">{job.mode}</td>
                      <td className="h-10 py-0 px-3 text-left border-t border-b border-gray-200 bg-white group-hover:bg-gray-50 w-[110px]">{job.algorithm}</td>
                      <td className="h-10 py-0 px-3 text-left border-t border-b border-gray-200 bg-white group-hover:bg-gray-50 w-[90px]">{job.version}</td>
                      <td className="h-10 py-0 px-3 text-left border-t border-b border-gray-200 bg-white group-hover:bg-gray-50 w-[90px]">{job.size}</td>
                      <td className="h-10 py-0 px-3 text-left border-t border-b border-gray-200 bg-white group-hover:bg-gray-50 w-[90px]">{job.owner}</td>
                      <td className="h-10 py-0 px-3 text-right border-t border-b border-gray-200 bg-white group-hover:bg-gray-50 w-[100px]">
                        <PrettyNumber value={job.avgSpeedMBps} unit="MB/s" />
                      </td>
                      <td className="h-10 py-0 px-3 text-right border border-gray-200 border-l-0 bg-white group-hover:bg-gray-50 w-20">{job.elapsed}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* 작업 목록 페이지네이션 */}
          {jobListTotalPages > 1 && (
            <div className="mt-3">
              <CommonPagination
                currentPage={jobListPage}
                totalPages={jobListTotalPages}
                onChange={(p) => {
                  setJobListPage(p);
                  setSelectedDetailId(null);
                }}
              />
            </div>
          )}
        </div>
      </div>
      )}

      {/* 하단 상세 정보 (작업 선택 시 표시) */}
      {selectedDetail && (
      <div ref={detailRef} className="border border-gray-200 rounded-lg">
        <div className="p-3">
          {/* 상세 정보 표 */}
          <div className="mb-3 font-semibold text-gray-700">작업 상세 정보</div>
          <table className="w-full text-sm border-separate border-spacing-y-0 mb-4">
            <thead>
              <tr className="text-gray-700 bg-gray-50">
                <th className="text-left font-semibold text-xs tracking-wide py-2 px-3 w-[60px]">ID</th>
                <th className="text-left font-semibold text-xs tracking-wide py-2 px-3">이름</th>
                <th className="text-left font-semibold text-xs tracking-wide py-2 px-3 w-20">방식</th>
                <th className="text-left font-semibold text-xs tracking-wide py-2 px-3 w-[110px]">알고리즘</th>
                <th className="text-left font-semibold text-xs tracking-wide py-2 px-3 w-[90px]">버전</th>
                <th className="text-left font-semibold text-xs tracking-wide py-2 px-3 w-[90px]">용량</th>
                <th className="text-left font-semibold text-xs tracking-wide py-2 px-3 w-[90px]">담당자</th>
                <th className="text-right font-semibold text-xs tracking-wide py-2 px-3 w-[100px]">평균압축속도</th>
                <th className="text-right font-semibold text-xs tracking-wide py-2 px-3 w-20">소요시간</th>
              </tr>
            </thead>
            <tbody>
              <tr className="group">
                <td className="h-10 py-0 px-3 text-left text-gray-600 border border-gray-200 border-r-0 bg-white group-hover:bg-gray-50 w-[60px]">{selectedDetail.id}</td>
                <td className="h-10 py-0 px-3 text-left border-t border-b border-gray-200 bg-white group-hover:bg-gray-50">{selectedDetail.name}</td>
                <td className="h-10 py-0 px-3 text-left border-t border-b border-gray-200 bg-white group-hover:bg-gray-50 w-20">{selectedDetail.mode}</td>
                <td className="h-10 py-0 px-3 text-left border-t border-b border-gray-200 bg-white group-hover:bg-gray-50 w-[110px]">{selectedDetail.algorithm}</td>
                <td className="h-10 py-0 px-3 text-left border-t border-b border-gray-200 bg-white group-hover:bg-gray-50 w-[90px]">{selectedDetail.version}</td>
                <td className="h-10 py-0 px-3 text-left border-t border-b border-gray-200 bg-white group-hover:bg-gray-50 w-[90px]">{selectedDetail.size}</td>
                <td className="h-10 py-0 px-3 text-left border-t border-b border-gray-200 bg-white group-hover:bg-gray-50 w-[90px]">{selectedDetail.owner}</td>
                <td className="h-10 py-0 px-3 text-right border-t border-b border-gray-200 bg-white group-hover:bg-gray-50 w-[100px]">
                  <PrettyNumber value={selectedDetail.avgSpeedMBps} unit="MB/s" />
                </td>
                <td className="h-10 py-0 px-3 text-right border border-gray-200 border-l-0 bg-white group-hover:bg-gray-50 w-20">{selectedDetail.elapsed}</td>
              </tr>
            </tbody>
          </table>

          {/* 상세 카드 */}
          <div className="flex gap-6 mt-4 items-center">
            {/* 좌: 간단 KPI */}
            <div className="flex-1">
              <div className="flex items-center justify-center gap-4">
                <div className="font-semibold">압축 성능</div>
                {/* 평균 GPU 이용률: Recharts 원형 게이지 */}
                <div className="w-[140px] flex flex-col items-center">
                  <RadialGauge percent={selectedDetail.avgGpuUtilPercent} size={120} />
                  <div className="text-center text-gray-500 mt-2">평균 GPU 이용률</div>
                </div>
                <div className="shrink-0">
                  <div className="grid grid-cols-[160px_1fr] gap-y-2 gap-x-3">
                    <div className="text-gray-500">평균속도</div>
                    <div><PrettyNumber value={selectedDetail.avgSpeedMBps} unit="MB/s" /></div>
                    <div className="text-gray-500">최고속도</div>
                    <div><PrettyNumber value={selectedDetail.maxSpeedMBps} unit="MB/s" /></div>
                    <div className="text-gray-500">최저속도</div>
                    <div>{selectedDetail.minSpeedKBps.toLocaleString()}KB/s</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 우: 메타 정보 */}
            <div className="flex-1">
              <div className="grid grid-cols-[160px_1fr] gap-y-2 gap-x-3">
                <div className="text-gray-500">시작일시</div>
                <div>{selectedDetail.startedAt}</div>
                <div className="text-gray-500">완료일시</div>
                <div>{selectedDetail.finishedAt}</div>
                <div className="text-gray-500">원본확장자</div>
                <div>{selectedDetail.inputFormat}</div>
                <div className="text-gray-500">압축확장자</div>
                <div>{selectedDetail.outputFormat}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}
      </div>
    </CommonContainerBox>
  );
}


