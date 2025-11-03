"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import CommonContainerBox from "@/components/ui/CommonContainerBox";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, RadialBarChart, RadialBar, PolarAngleAxis, Cell, ReferenceLine, ReferenceArea } from "recharts";
import CommonPagination from "@/components/ui/CommonPagination";

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

const DETAILS: Record<AlgorithmKey, DetailRow> = {
  LZW: {
    id: 1,
    name: "DLEDPRINTING0001.BMP",
    mode: "GPU",
    algorithm: "LZW",
    version: "0.12.1",
    size: "1.7GB",
    owner: "정유진",
    startedAt: "2025. 10. 21. 17:10:46",
    finishedAt: "2025. 10. 21. 17:40:48",
    elapsed: "10:46",
    inputFormat: "BMP",
    outputFormat: "TIFF",
    avgGpuUtilPercent: 57,
    avgSpeedMBps: 2.7,
    maxSpeedMBps: 3.2,
    minSpeedKBps: 200
  },
  PackBits: {
    id: 2,
    name: "SCAN_20251021_002.TIF",
    mode: "GPU",
    algorithm: "PackBits",
    version: "0.2.1",
    size: "980MB",
    owner: "최가람",
    startedAt: "2025. 10. 22. 09:00:12",
    finishedAt: "2025. 10. 22. 09:18:33",
    elapsed: "18:21",
    inputFormat: "TIFF",
    outputFormat: "TIFF",
    avgGpuUtilPercent: 51,
    avgSpeedMBps: 2.1,
    maxSpeedMBps: 2.9,
    minSpeedKBps: 180
  },
  Deflate: {
    id: 3,
    name: "ARCHIVE_00123.BMP",
    mode: "GPU",
    algorithm: "Deflate",
    version: "0.4.1",
    size: "2.3GB",
    owner: "김도윤",
    startedAt: "2025. 10. 20. 14:02:10",
    finishedAt: "2025. 10. 20. 14:27:41",
    elapsed: "25:31",
    inputFormat: "BMP",
    outputFormat: "TIFF",
    avgGpuUtilPercent: 46,
    avgSpeedMBps: 1.8,
    maxSpeedMBps: 2.3,
    minSpeedKBps: 160
  }
};

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
  const [mounted, setMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const detailRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => setMounted(true), []);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(ALGORITHMS.length / itemsPerPage);
  
  const currentPageData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return ALGORITHMS.slice(start, end);
  }, [currentPage]);

  const maxSpeed = useMemo(() => {
    return Math.max(...ALGORITHMS.map(a => a.avgSpeedMBps));
  }, []);
  const overallAvg = useMemo(() => {
    const sum = ALGORITHMS.reduce((acc, a) => acc + a.avgSpeedMBps, 0);
    return sum / ALGORITHMS.length;
  }, []);
  const range1 = maxSpeed * 0.5; // 낮음
  const range2 = maxSpeed * 0.8; // 보통

  const selectedItem = selectedIndex !== null ? ALGORITHMS[selectedIndex] : null;
  const selectedDetail = selectedItem ? DETAILS[selectedItem.key] : null;

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
    if (selectedDetail && detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedDetail]);

  return (
    <CommonContainerBox>
      <div className="flex flex-col gap-4">
      {/* 상단: 좌측 그래프, 우측 순위 표 */}
      <div className="flex gap-4 flex-wrap min-w-0 items-stretch">
        {/* 좌측 Recharts 세로 막대 차트 */}
        <div className="flex-1 min-w-[280px] border border-gray-200 rounded-lg p-4 flex flex-col">
          <div className="font-semibold">전체 압축 성능 순위</div>
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
                    tickFormatter={(value) => {
                      const item = currentPageData.find(d => d.label === value);
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
                  <ReferenceLine x={overallAvg} stroke="#ef4444" strokeWidth={2} strokeDasharray="3 3" label={{ value: `AVG ${overallAvg.toFixed(1)} MB/s`, position: "top", fill: "#ef4444", fontSize: 12 }} />
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

      {/* 하단 상세 정보 (선택 시 표시) */}
      {selectedDetail && (
      <div ref={detailRef} className="border border-gray-200 rounded-lg">
        <div className="p-3">
          {/* PatternList.tsx와 동일한 표 스타일 적용 */}
          <table className="w-full text-sm border-separate border-spacing-y-0">
            <thead>
              <tr className="text-gray-700">
                <th className="text-left font-semibold text-xs tracking-wide py-2 px-3 w-[60px]">순위</th>
                <th className="text-left font-semibold text-xs tracking-wide py-2 px-3">이름</th>
                <th className="text-left font-semibold text-xs tracking-wide py-2 px-3 w-[80px]">방식</th>
                <th className="text-left font-semibold text-xs tracking-wide py-2 px-3 w-[110px]">알고리즘</th>
                <th className="text-left font-semibold text-xs tracking-wide py-2 px-3 w-[90px]">버전</th>
                <th className="text-left font-semibold text-xs tracking-wide py-2 px-3 w-[90px]">용량</th>
                <th className="text-left font-semibold text-xs tracking-wide py-2 px-3 w-[90px]">담당자</th>
                <th className="text-right font-semibold text-xs tracking-wide py-2 px-3 w-[80px]">소요시간</th>
              </tr>
            </thead>
            <tbody>
              <tr className="group">
                <td className="h-10 py-0 px-3 text-left text-gray-600 border border-gray-200 border-r-0 bg-white group-hover:bg-gray-50 w-[60px]">{selectedDetail.id}</td>
                <td className="h-10 py-0 px-3 text-left border-t border-b border-gray-200 bg-white group-hover:bg-gray-50">{selectedDetail.name}</td>
                <td className="h-10 py-0 px-3 text-left border-t border-b border-gray-200 bg-white group-hover:bg-gray-50 w-[80px]">{selectedDetail.mode}</td>
                <td className="h-10 py-0 px-3 text-left border-t border-b border-gray-200 bg-white group-hover:bg-gray-50 w-[110px]">{selectedDetail.algorithm}</td>
                <td className="h-10 py-0 px-3 text-left border-t border-b border-gray-200 bg-white group-hover:bg-gray-50 w-[90px]">{selectedDetail.version}</td>
                <td className="h-10 py-0 px-3 text-left border-t border-b border-gray-200 bg-white group-hover:bg-gray-50 w-[90px]">{selectedDetail.size}</td>
                <td className="h-10 py-0 px-3 text-left border-t border-b border-gray-200 bg-white group-hover:bg-gray-50 w-[90px]">{selectedDetail.owner}</td>
                <td className="h-10 py-0 px-3 text-right border border-gray-200 border-l-0 bg-white group-hover:bg-gray-50 w-[80px]">{selectedDetail.elapsed}</td>
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
                  <div className="grid [grid-template-columns:160px_1fr] gap-y-2 gap-x-3">
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
              <div className="grid [grid-template-columns:160px_1fr] gap-y-2 gap-x-3">
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


