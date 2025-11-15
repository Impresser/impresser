"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import CommonContainerBox from "@/components/ui/CommonContainerBox";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, RadialBarChart, RadialBar, PolarAngleAxis, Cell, ReferenceLine, ReferenceArea } from "recharts";
import CommonPagination from "@/components/ui/CommonPagination";
import RadioButton from "@/components/ui/RadioButton";
import { usePerformanceRankingStore } from "@/store/performanceRankingStore";
import { DashboardRankItem, AlgorithmPerf, JobDetailRow, ConvertDetailItem, ConvertHistoryDetailResult } from "@/types/dashboard";
import { getDashboardConvertDetail, getDashboardConvertHistoryDetail } from "@/service/dashboard";
import CommonTableFrame from "@/components/ui/CommonTableFrame";
import { useSidebarStore } from "@/store/sidebarStore";

// API 데이터 → 컴포넌트 표시용으로 매핑
function mapApiToPerf(items: DashboardRankItem[]): AlgorithmPerf[] {
  return (items || [])
    .map((it) => {
      const mode = (it.processingUnit as any) === "GPU" ? ("GPU" as const) : ("CPU" as const);
      const version = String(it.version);
      // 알고리즘+버전+방식을 조합한 고유 키 생성
      const key = `${it.compressionType}-${version}-${mode}`;
      return {
        key,
        label: it.compressionType,
        version,
        mode,
        avgSpeedMBps: Number(it.avgSpeed) || 0,
        originalItem: it, // 원본 아이템 저장
      };
    })
    .sort((a, b) => b.avgSpeedMBps - a.avgSpeedMBps);
}

// 각 알고리즘+버전+방식 조합별 작업 목록 (API 연동 전까지 빈 배열 유지)
const JOB_LISTS: JobDetailRow[] = [];

function PrettyNumber({ value, unit }: { value: number | null | undefined; unit: string }) {
  if (value == null || isNaN(value)) {
    return <span>-</span>;
  }
  return <span>{value.toLocaleString(undefined, { maximumFractionDigits: 2 })}{unit}</span>;
}

// 파일 크기 포맷팅 함수 (KB 단위로 들어옴)
const formatFileSize = (kb: number) => {
  if (kb === 0) return '0.00 KB';
  const k = 1024; // 1024 단위로 계산 (1 MB = 1024 KB, 1 GB = 1024 MB)
  const sizes = ['KB', 'MB', 'GB'];
  // KB 단위로 들어오므로
  // 0 ~ 1023 KB → KB
  // 1024 ~ 1048575 KB → MB (1024로 나눔)
  // 1048576 KB 이상 → GB (1024^2로 나눔)
  if (kb < k) {
    return (Math.floor(kb * 100) / 100).toFixed(2) + ' ' + sizes[0];
  } else if (kb < k * k) {
    return (Math.floor((kb / k) * 100) / 100).toFixed(2) + ' ' + sizes[1];
  } else {
    return (Math.floor((kb / (k * k)) * 100) / 100).toFixed(2) + ' ' + sizes[2];
  }
};

const formatTime = (seconds: number): string => {
  if (!seconds && seconds !== 0) return '-';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts: string[] = [];
  if (hours > 0) {
    parts.push(`${hours}시간`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}분`);
  }
  if (secs > 0 || parts.length === 0) {
    parts.push(`${secs}초`);
  }
  
  return parts.join(' ');
};

const formatSeconds = (seconds: number): string => {
  if (!seconds && seconds !== 0) return '-';
  return `${seconds.toFixed(2)}초`;
};

const formatTimeMinutesSeconds = (seconds: number): string => {
  if (!seconds && seconds !== 0) return '-';
  const totalMinutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts: string[] = [];
  if (totalMinutes > 0) {
    parts.push(`${totalMinutes}분`);
  }
  if (secs > 0 || parts.length === 0) {
    parts.push(`${secs}초`);
  }
  
  return parts.join(' ');
};

const formatDateTime = (date: Date | string | null | undefined): string => {
  if (!date) {
    return '-';
  }
  
  let dateObj: Date;
  if (typeof date === 'string') {
    if (!date.trim()) {
      return '-';
    }
    
    let dateString = date.trim();
    const hasTimezone = dateString.includes('Z') || 
                        dateString.includes('+') || 
                        (dateString.match(/[-+]\d{2}:\d{2}$/) !== null);
    
    if (!hasTimezone && dateString.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      dateString = dateString + 'Z';
    }
    
    dateObj = new Date(dateString);
  } else {
    dateObj = date;
  }
  
  if (!dateObj || isNaN(dateObj.getTime())) {
    return '-';
  }
  
  const formatter = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  const parts = formatter.formatToParts(dateObj).reduce<Record<string, string>>((acc, p) => {
    if (p.type !== 'literal') acc[p.type] = p.value;
    return acc;
  }, {});
  
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
};

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
  const { isCollapsed } = useSidebarStore();
  const { items, pagination, loading, fetch, error } = usePerformanceRankingStore() as any;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedDetailId, setSelectedDetailId] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [jobListPage, setJobListPage] = useState(1);
  const [modeFilter, setModeFilter] = useState<"전체" | "CPU" | "GPU">("전체");
  const [detailData, setDetailData] = useState<ConvertDetailItem[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailPagination, setDetailPagination] = useState<any>(null);
  const [historyDetailData, setHistoryDetailData] = useState<ConvertHistoryDetailResult | null>(null);
  const [historyDetailLoading, setHistoryDetailLoading] = useState(false);
  const [historyDetailError, setHistoryDetailError] = useState<string | null>(null);
  const detailRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => setMounted(true), []);
  useEffect(() => { fetch(0, 50).catch(() => {}); }, [fetch]);

  // 필터링된 데이터
  const apiAlgorithms = useMemo(() => mapApiToPerf(items), [items]);
  const filteredAlgorithms = useMemo(() => {
    if (modeFilter === "전체") {
      return apiAlgorithms;
    }
    return apiAlgorithms.filter(a => a.mode === modeFilter);
  }, [modeFilter, apiAlgorithms]);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredAlgorithms.length / itemsPerPage);
  
  const maxSpeed = useMemo(() => {
    return Math.max(...filteredAlgorithms.map(a => a.avgSpeedMBps));
  }, [filteredAlgorithms]);
  const overallAvg = useMemo(() => {
    const nonZeroValues = filteredAlgorithms.filter(a => a.avgSpeedMBps > 0);
    if (nonZeroValues.length === 0) return 0;
    const sum = nonZeroValues.reduce((acc, a) => acc + a.avgSpeedMBps, 0);
    return sum / nonZeroValues.length;
  }, [filteredAlgorithms]);
  
  const currentPageData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = filteredAlgorithms.slice(start, end).map(item => ({
      ...item,
      displayValue: item.avgSpeedMBps,
      isAverage: false,
    }));
    
    // 평균 값을 그래프 맨 위에 추가 (GPU 필터일 때는 제외)
    if (filteredAlgorithms.length > 0 && overallAvg > 0 && modeFilter !== "GPU") {
      return [
        {
          key: '평균',
          label: '평균',
          version: '',
          mode: '' as const,
          avgSpeedMBps: overallAvg,
          displayValue: overallAvg,
          originalItem: null,
          isAverage: true, // 평균 바 구분용
        },
        ...pageData,
      ];
    }
    return pageData;
  }, [currentPage, filteredAlgorithms, overallAvg, modeFilter]);
  const range1 = maxSpeed * 0.5; // 낮음
  const range2 = maxSpeed * 0.8; // 보통

  const selectedItem = selectedIndex !== null ? filteredAlgorithms[selectedIndex] : null;
  
  // 선택된 항목에 대한 상세 정보 조회
  useEffect(() => {
    if (selectedItem && selectedItem.originalItem?.compressionTypeUuid) {
      setDetailLoading(true);
      setDetailError(null);
      const page = jobListPage - 1; // 0-based로 변환
      getDashboardConvertDetail(selectedItem.originalItem.compressionTypeUuid, { page, size: 5 })
        .then((res) => {
          if (res.isSuccess && res.result) {
            setDetailData(res.result.content || []);
            setDetailPagination(res.result.pagination || null);
          } else {
            setDetailError(res.message || "상세 정보 조회 실패");
          }
        })
        .catch((err) => {
          setDetailError(err.message || "상세 정보 조회 중 오류가 발생했습니다.");
        })
        .finally(() => {
          setDetailLoading(false);
        });
    } else {
      setDetailData([]);
      setDetailPagination(null);
      setDetailError(null);
    }
  }, [selectedItem, jobListPage]);

  // 선택된 알고리즘 조합과 일치하는 작업 목록 (API 데이터로 대체)
  const jobList = useMemo(() => {
    if (!selectedItem || detailData.length === 0) return [];
    return detailData.map((item, idx) => ({
      id: idx + 1,
      name: item.tiffUrl ? (item.tiffUrl.split('/').pop() || `작업 ${idx + 1}`) : `작업 ${idx + 1}`,
      mode: (item.processingUnit === "GPU" ? "GPU" : "CPU") as "GPU" | "CPU",
      algorithm: item.compressionType,
      version: String(item.version),
      size: formatFileSize(item.tiffVolume), // 압축 후 용량
      bmpVolume: item.bmpVolume, // 압축 전 용량 (KB)
      tiffVolume: item.tiffVolume, // 압축 후 용량 (KB)
      owner: item.userName,
      startedAt: "-", // API 응답에 없음
      finishedAt: "-", // API 응답에 없음
      elapsedTime: item.elapsedTime,
      inputFormat: "TIFF",
      outputFormat: "TIFF",
      avgGpuUtilPercent: 0, // API 응답에 없음
      avgSpeedMBps: item.avgSpeed ?? 0,
      maxSpeedMBps: item.avgSpeed ?? 0, // API 응답에 없음
      minSpeedKBps: 0, // API 응답에 없음
      convertHistoryUuid: item.convertHistoryUuid, // 작업 상세 조회용 UUID
    }));
  }, [selectedItem, detailData]);

  // 작업 목록 데이터 (API에서 받은 데이터 그대로 사용)
  const currentJobListData = useMemo(() => {
    return jobList;
  }, [jobList]);
  
  // 페이지네이션 정보 (API 응답에서 받은 정보 사용)
  const jobListTotalPages = detailPagination?.totalPages || 1;

  // 선택된 작업 상세 정보
  const selectedJob = selectedDetailId !== null 
    ? jobList.find(job => job.id === selectedDetailId) || null
    : null;

  // 선택된 작업의 상세 정보 조회
  useEffect(() => {
    if (selectedJob && selectedJob.convertHistoryUuid) {
      setHistoryDetailLoading(true);
      setHistoryDetailError(null);
      getDashboardConvertHistoryDetail(selectedJob.convertHistoryUuid)
        .then((res) => {
          if (res.isSuccess && res.result) {
            setHistoryDetailData(res.result);
          } else {
            setHistoryDetailError(res.message || "작업 상세 정보 조회 실패");
          }
        })
        .catch((err) => {
          setHistoryDetailError(err.message || "작업 상세 정보 조회 중 오류가 발생했습니다.");
        })
        .finally(() => {
          setHistoryDetailLoading(false);
        });
    } else {
      setHistoryDetailData(null);
      setHistoryDetailError(null);
    }
  }, [selectedJob]);

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
    if ((selectedItem || selectedJob) && detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedItem, selectedJob]);

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
    <>
      <h1 className="text-xl font-bold text-gray-900 mb-3">전체 압축 성능 순위</h1>
      <CommonContainerBox>
      <div className="flex flex-col gap-4">
      {/* 상단: 좌측 그래프, 우측 순위 표 */}
      <div className="flex gap-4 flex-wrap min-w-0 items-stretch">
        {/* 좌측 Recharts 세로 막대 차트 */}
        <div className="flex-1 min-w-[280px] border border-gray-200 rounded-lg p-4 flex flex-col">
        <div className="flex items-center justify-between mb-2">
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
            {!mounted ? null : loading ? (
              <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">불러오는 중…</div>
            ) : apiAlgorithms.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">데이터가 없습니다</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={currentPageData} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 0 }} barCategoryGap={12}>
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
                    dataKey="key" 
                    width={110} 
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                    tickFormatter={(value, index) => {
                      const item = currentPageData[index];
                      if (item) {
                        // 평균바는 version과 mode 없이 표시
                        if (item.isAverage) {
                          return item.label;
                        }
                        // 알고리즘, 버전, 방식을 한 세트로 표시
                        return `${item.label} v${item.version} ${item.mode}`;
                      }
                      return value;
                    }}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string, props: any) => {
                      // API에서 받아온 원본 avgSpeed 값 사용
                      const originalValue = props.payload?.originalItem?.avgSpeed ?? value;
                      // 소수점 2자리로 포맷팅
                      return `${Number(originalValue).toFixed(2)} MB/s`;
                    }} 
                  />
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
                  />
                  {/* 측정값 바 */}
                  <Bar 
                    dataKey="displayValue" 
                    name="평균속도(MB/s)" 
                    radius={[0, 8, 8, 0]} 
                    barSize={14}
                  >
                    {currentPageData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.isAverage ? '#ef4444' : 'url(#bulletBarGradient)'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 우측 순위 표 */}
        <div className="flex-1 min-w-[280px] border border-gray-200 rounded-lg p-4 flex flex-col">
          <CommonTableFrame
            header={(
              <thead className="bg-gray-50">
                <tr className="text-gray-700">
                  <th className="text-center font-semibold text-medium tracking-wide py-2 px-3 w-16">순위</th>
                  <th className="text-left font-semibold text-medium tracking-wide py-2 px-3">알고리즘</th>
                  <th className="text-center font-semibold text-medium tracking-wide py-2 px-3 w-20">버전</th>
                  <th className="text-center font-semibold text-medium tracking-wide py-2 px-3 w-20 whitespace-nowrap">처리 방식</th>
                  <th className="text-right font-semibold text-medium tracking-wide py-2 px-3 w-36">평균압축속도</th>
                </tr>
              </thead>
            )}
            body={(
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="py-6 text-center text-gray-500 text-sm">불러오는 중…</td></tr>
                ) : currentPageData.filter(a => a.key !== '평균').length === 0 ? (
                  <tr><td colSpan={5} className="py-6 text-center text-gray-500 text-sm">데이터가 없습니다</td></tr>
                ) : currentPageData.filter(a => a.key !== '평균').map((a, idx) => {
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
                        {a.originalItem?.avgSpeed ?? a.avgSpeedMBps} MB/s
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            )}
          />
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
      {selectedItem && (
      <div ref={detailRef} className="border border-gray-200 rounded-lg">
        <div className="p-3">
          <div className="mb-3 font-semibold text-gray-700">
            {selectedItem.label} {selectedItem.version} {selectedItem.mode} 작업 목록
          </div>
          {detailLoading ? (
            <div className="py-6 text-center text-gray-500 text-sm">불러오는 중…</div>
          ) : detailError ? (
            <div className="py-6 text-center text-red-500 text-sm">{detailError}</div>
          ) : jobList.length === 0 ? (
            <div className="py-6 text-center text-gray-500 text-sm">작업 데이터가 없습니다</div>
          ) : (
            <>
              {/* 작업 목록 표 */}
              <div className="overflow-hidden rounded-md border border-gray-200">
                <table className="w-full text-sm border-separate border-spacing-y-0">
                  <thead>
                    <tr className="text-gray-700 bg-gray-50">
                      <th className="text-center font-semibold text-medium tracking-wide py-2 px-3 w-10">No.</th>
                      <th className="text-left font-semibold text-medium tracking-wide py-2 px-3">파일명</th>
                      <th className="text-center font-semibold text-medium tracking-wide py-2 px-3 w-[90px]">알고리즘</th>
                      <th className="text-center font-semibold text-medium tracking-wide py-2 px-3 w-[30px]">버전</th>
                      <th className="text-center font-semibold text-medium tracking-wide py-2 px-3 w-21">처리 방식</th>
                      <th className="text-center font-semibold text-medium tracking-wide py-2 px-3 w-[100px]">압축 전 용량</th>
                      <th className="text-center font-semibold text-medium tracking-wide py-2 px-3 w-[100px]">압축 후 용량</th>
                      <th className="text-center font-semibold text-medium tracking-wide py-2 px-3 w-20">압축률</th>
                      <th className="text-center font-semibold text-medium tracking-wide py-2 px-3 w-[90px]">담당자</th>
                      <th className="text-right font-semibold text-medium tracking-wide py-2 px-3 w-[105px]">평균압축속도</th>
                      <th className="text-right font-semibold text-medium tracking-wide py-2 px-3 w-25">총 소요시간</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentJobListData.map((job, idx) => {
                      const isActive = selectedDetailId === job.id;
                      const globalIndex = detailPagination ? (jobListPage - 1) * (detailPagination.size || 5) + idx : idx;
                      return (
                        <tr
                          key={job.id}
                          onClick={() => setSelectedDetailId(prev => (prev === job.id ? null : job.id))}
                          className={`cursor-pointer group ${isActive ? 'ring-1 ring-inset ring-blue-300 bg-blue-50' : ''}`}
                        >
                          <td className="h-10 py-0 px-3 text-center text-gray-600 border border-gray-200 border-r-0 bg-white group-hover:bg-gray-50 w-10">{globalIndex + 1}</td>
                          <td className="h-10 py-0 px-3 text-left border-t border-b border-gray-200 bg-white group-hover:bg-gray-50">
                            <span className={`block truncate ${isCollapsed ? 'max-w-[400px]' : 'max-w-[300px]'}`} title={job.name}>
                              {job.name}
                            </span>
                          </td>
                          <td className="h-10 py-0 px-3 text-center border-t border-b border-gray-200 bg-white group-hover:bg-gray-50 w-[90px]">{job.algorithm}</td>
                          <td className="h-10 py-0 px-3 text-center border-t border-b border-gray-200 bg-white group-hover:bg-gray-50 w-[70px]">v{job.version}</td>
                          <td className="h-10 py-0 px-3 text-center border-t border-b border-gray-200 bg-white group-hover:bg-gray-50 w-20">{job.mode}</td>
                          <td className="h-10 py-0 px-3 text-center border-t border-b border-gray-200 bg-white group-hover:bg-gray-50 w-[90px]">{formatFileSize(job.bmpVolume)}</td>
                          <td className="h-10 py-0 px-3 text-center border-t border-b border-gray-200 bg-white group-hover:bg-gray-50 w-[90px]">{formatFileSize(job.tiffVolume)}</td>
                          <td className="h-10 py-0 px-3 text-center border-t border-b border-gray-200 bg-white group-hover:bg-gray-50 w-20">
                            {(() => {
                              const bmpVol = job.bmpVolume || 0;
                              const tiffVol = job.tiffVolume || 0;
                              if (bmpVol === 0) return '-';
                              const compressionRatio = ((bmpVol - tiffVol) / bmpVol) * 100;
                              return (
                                <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] bg-green-50 text-green-700 border-green-200">
                                  {compressionRatio.toFixed(2)}%
                                </span>
                              );
                            })()}
                          </td>
                          <td className="h-10 py-0 px-3 text-center border-t border-b border-gray-200 bg-white group-hover:bg-gray-50 w-[90px]">{job.owner}</td>
                          <td className="h-10 py-0 px-3 text-right border-t border-b border-gray-200 bg-white group-hover:bg-gray-50 w-[100px]">
                            <PrettyNumber value={job.avgSpeedMBps} unit="MB/s" />
                          </td>
                          <td className="h-10 py-0 px-3 text-right border border-gray-200 border-l-0 bg-white group-hover:bg-gray-50 w-20">{formatTimeMinutesSeconds(job.elapsedTime)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* 작업 목록 페이지네이션 */}
              {detailPagination && detailPagination.totalPages > 1 && (
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
            </>
          )}
        </div>
      </div>
      )}

      {/* 하단 상세 정보 (작업 선택 시 표시) */}
      {selectedJob && (
      <div ref={detailRef} className="border border-gray-200 rounded-lg">
        <div className="p-3">
          {/* 상세 정보 표 */}
          <div className="mb-3 font-semibold text-gray-700">작업 상세 정보</div>
          {historyDetailLoading ? (
            <div className="py-6 text-center text-gray-500 text-sm">불러오는 중…</div>
          ) : historyDetailError ? (
            <div className="py-6 text-center text-red-500 text-sm">{historyDetailError}</div>
          ) : historyDetailData ? (
            <>
              <table className="w-full text-sm border-separate border-spacing-y-0 mb-4">
                <thead>
                  <tr className="text-gray-700 bg-gray-50">
                    <th className="text-center font-semibold text-medium tracking-wide py-2 px-3 w-10">No.</th>
                    <th className="text-left font-semibold text-medium tracking-wide py-2 px-3">파일명</th>
                    <th className="text-center font-semibold text-medium tracking-wide py-2 px-3 w-[90px]">알고리즘</th>
                    <th className="text-center font-semibold text-medium tracking-wide py-2 px-3 w-[30px]">버전</th>
                    <th className="text-center font-semibold text-medium tracking-wide py-2 px-3 w-21">처리 방식</th>
                    <th className="text-center font-semibold text-medium tracking-wide py-2 px-3 w-[100px]">압축 전 용량</th>
                    <th className="text-center font-semibold text-medium tracking-wide py-2 px-3 w-[100px]">압축 후 용량</th>
                    <th className="text-center font-semibold text-medium tracking-wide py-2 px-3 w-20">압축률</th>
                    <th className="text-center font-semibold text-medium tracking-wide py-2 px-3 w-[90px]">담당자</th>
                    <th className="text-right font-semibold text-medium tracking-wide py-2 px-3 w-[105px]">평균압축속도</th>
                    <th className="text-right font-semibold text-medium tracking-wide py-2 px-3 w-25">총 소요시간</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="group">
                    <td className="h-10 py-0 px-3 text-center text-gray-600 border border-gray-200 border-r-0 bg-white group-hover:bg-gray-50 w-10">{selectedJob.id}</td>
                    <td className="h-10 py-0 px-3 text-left border-t border-b border-gray-200 bg-white group-hover:bg-gray-50">
                      <span className={`block truncate ${isCollapsed ? 'max-w-[400px]' : 'max-w-[300px]'}`} title={selectedJob.name}>
                        {selectedJob.name}
                      </span>
                    </td>
                    <td className="h-10 py-0 px-3 text-center border-t border-b border-gray-200 bg-white group-hover:bg-gray-50 w-[90px]">{selectedJob.algorithm}</td>
                    <td className="h-10 py-0 px-3 text-center border-t border-b border-gray-200 bg-white group-hover:bg-gray-50 w-[70px]">v{selectedJob.version}</td>
                    <td className="h-10 py-0 px-3 text-center border-t border-b border-gray-200 bg-white group-hover:bg-gray-50 w-20">{selectedJob.mode}</td>
                    <td className="h-10 py-0 px-3 text-center border-t border-b border-gray-200 bg-white group-hover:bg-gray-50 w-[90px]">{formatFileSize(selectedJob.bmpVolume)}</td>
                    <td className="h-10 py-0 px-3 text-center border-t border-b border-gray-200 bg-white group-hover:bg-gray-50 w-[90px]">{formatFileSize(selectedJob.tiffVolume)}</td>
                    <td className="h-10 py-0 px-3 text-center border-t border-b border-gray-200 bg-white group-hover:bg-gray-50 w-20">
                      {(() => {
                        const bmpVol = selectedJob.bmpVolume || 0;
                        const tiffVol = selectedJob.tiffVolume || 0;
                        if (bmpVol === 0) return '-';
                        const compressionRatio = ((bmpVol - tiffVol) / bmpVol) * 100;
                        return (
                          <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] bg-green-50 text-green-700 border-green-200">
                            {compressionRatio.toFixed(2)}%
                          </span>
                        );
                      })()}
                    </td>
                    <td className="h-10 py-0 px-3 text-center border-t border-b border-gray-200 bg-white group-hover:bg-gray-50 w-[90px]">{selectedJob.owner}</td>
                    <td className="h-10 py-0 px-3 text-right border-t border-b border-gray-200 bg-white group-hover:bg-gray-50 w-[100px]">
                      <PrettyNumber value={selectedJob.avgSpeedMBps} unit="MB/s" />
                    </td>
                    <td className="h-10 py-0 px-3 text-right border border-gray-200 border-l-0 bg-white group-hover:bg-gray-50 w-20">{formatTimeMinutesSeconds(selectedJob.elapsedTime)}</td>
                  </tr>
                </tbody>
              </table>

              {/* 상세 카드 */}
              <div className="flex gap-4 mt-4 items-center">
                {/* 좌: 간단 KPI */}
                <div className="flex-1">
                  <div className="flex items-center justify-center gap-10">
                    <div className="font-semibold">압축 성능</div>
                    {/* 평균 GPU 이용률: Recharts 원형 게이지 */}
                    <div className="w-[140px] flex flex-col items-center">
                      <div className="text-center text-gray-500">평균 GPU 이용률</div>
                      <RadialGauge percent={historyDetailData.avgGpuUtilization} size={120} />
                    </div>
                    <div className="shrink-0">
                      <div className="grid grid-cols-[160px_1fr] gap-y-2 gap-x-3">
                        <div className="text-gray-500">평균속도</div>
                        <div><PrettyNumber value={historyDetailData.avgSpeed} unit="MB/s" /></div>
                        <div className="text-gray-500">원본확장자</div>
                        <div>{historyDetailData.sourceExtension}</div>
                        <div className="text-gray-500">압축확장자</div>
                        <div>{historyDetailData.compressedExtension}</div>
                      </div>
                    </div>
                    {/* 우: 메타 정보 */}
                    <div className="shrink-0">
                      <div className="grid grid-cols-[160px_1fr] gap-y-2 gap-x-3">
                      <div className="text-gray-500">시작일시</div>
                      <div className="whitespace-nowrap">{formatDateTime(historyDetailData.requestAt)}</div>
                      <div className="text-gray-500">완료일시</div>
                      <div className="whitespace-nowrap">{formatDateTime(historyDetailData.completedAt)}</div>
                      <div className="text-gray-500">압축 소요시간</div>
                      <div>{formatSeconds(historyDetailData.compressionTime)}</div>
                      <div className="text-gray-500">총 소요시간</div>
                      <div>{formatTimeMinutesSeconds(historyDetailData.elapsedTime)}</div>
                    </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="py-6 text-center text-gray-500 text-sm">상세 정보를 불러올 수 없습니다</div>
          )}
        </div>
      </div>
      )}
      </div>
    </CommonContainerBox>
    </>
  );
}



