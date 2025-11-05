"use client";

import React, { useEffect, useState } from "react";
import CommonContainerBox from "@/components/ui/CommonContainerBox";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { getEquipmentUsage } from "@/service/dashboard";
import { GetEquipmentUsageResult } from "@/types/dashboard";

type UsageRow = { day: string; week2: number; week3: number };

// 날짜 범위를 "10월 n주차" 형식으로 변환하는 함수
const formatWeekLabel = (dateRange: string): string => {
  // "2025-10-26 ~ 2025-11-01" 형식에서 첫 번째 날짜 추출
  const match = dateRange.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return dateRange; // 형식이 맞지 않으면 원본 반환

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  // 주차 계산: (일자 - 1) / 7 + 1
  const weekNumber = Math.ceil(day / 7);

  return `${month}월 ${weekNumber}주차`;
};

export default function EquipmentUsage() {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<UsageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekLabels, setWeekLabels] = useState<{ previous: string; current: string }>({ previous: "", current: "" });
  const [originalWeekLabels, setOriginalWeekLabels] = useState<{ previous: string; current: string }>({ previous: "", current: "" });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const fetchUsageData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getEquipmentUsage();
        
        if (response.isSuccess && response.result) {
          const result: GetEquipmentUsageResult = response.result;
          
          // 원본 날짜 범위 저장
          setOriginalWeekLabels({
            previous: result.previousWeek.label,
            current: result.currentWeek.label,
          });
          
          // 주차 라벨 저장 (날짜 범위를 "월 n주차" 형식으로 변환)
          setWeekLabels({
            previous: formatWeekLabel(result.previousWeek.label),
            current: formatWeekLabel(result.currentWeek.label),
          });

          // API 데이터를 차트 형식으로 변환
          // previousWeek과 currentWeek의 days 배열을 합쳐서 처리
          const maxDays = Math.max(
            result.previousWeek.days.length,
            result.currentWeek.days.length
          );

          const chartData: UsageRow[] = [];
          for (let i = 0; i < maxDays; i++) {
            const prevDay = result.previousWeek.days[i];
            const currDay = result.currentWeek.days[i];
            
            const dayOfWeek = currDay?.dayOfWeek || prevDay?.dayOfWeek || "";
            
            chartData.push({
              day: dayOfWeek,
              week2: prevDay?.usageHours || 0,
              week3: currDay?.usageHours || 0,
            });
          }

          setData(chartData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "데이터를 불러오는 중 오류가 발생했습니다.");
        console.error("설비 이용 시간 조회 실패:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsageData();
  }, [mounted]);
  return (
    <CommonContainerBox>
      <div className="flex justify-between items-start mb-2">
        <div className="font-bold text-xl">일일 평균 설비 이용 시간</div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="text-gray-500 text-xs">
            {originalWeekLabels.previous && originalWeekLabels.current 
              ? `${originalWeekLabels.previous} | ${originalWeekLabels.current} 비교`
              : "주차 비교"}
          </div>
          <div className="flex flex-row gap-3 items-center">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              <span className="text-blue-500 text-sm">{weekLabels.previous || "이전 주"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              <span className="text-red-500 text-sm">{weekLabels.current || "이번 주"}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full h-80 min-w-0 min-h-0">
        {loading && (
          <div className="flex justify-center items-center h-full">
            <div className="text-gray-500 text-sm">데이터를 불러오는 중...</div>
          </div>
        )}
        {error && (
          <div className="flex justify-center items-center h-full">
            <div className="text-red-500 text-sm">{error}</div>
          </div>
        )}
        {!loading && !error && mounted && data.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
              <defs>
                <linearGradient id="usageBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity={1} />
                </linearGradient>
                <linearGradient id="usageRed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#eef1f5" strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fill: "#6b7280", fontSize: 12 }} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} domain={[0, 'dataMax + 4']} />
              <Tooltip contentStyle={{ borderRadius: 8, borderColor: '#e5e7eb' }} cursor={{ stroke: '#cfd4dc', strokeDasharray: '3 3' }} />
              <Area type="monotone" dataKey="week2" name={weekLabels.previous || "이전 주"} stroke="#2563eb" strokeWidth={2.5} fill="url(#usageBlue)" dot={{ r: 2 }} activeDot={{ r: 4 }} />
              <Area type="monotone" dataKey="week3" name={weekLabels.current || "이번 주"} stroke="#ef4444" strokeWidth={2.5} fill="url(#usageRed)" dot={{ r: 2 }} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </CommonContainerBox>
  );
}



