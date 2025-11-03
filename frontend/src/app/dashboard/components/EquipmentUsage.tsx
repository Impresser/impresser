"use client";

import React, { useEffect, useState } from "react";
import CommonContainerBox from "@/components/ui/CommonContainerBox";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

type UsageRow = { day: string; week2: number; week3: number };

const DATA: UsageRow[] = [
  { day: "월", week2: 8, week3: 4 },
  { day: "화", week2: 10, week3: 8 },
  { day: "수", week2: 15, week3: 6 },
  { day: "목", week2: 9, week3: 14 },
  { day: "금", week2: 18, week3: 24 },
  { day: "토", week2: 16, week3: 12 },
  { day: "일", week2: 17, week3: 20 }
];

export default function EquipmentUsage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <CommonContainerBox>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 20 }}>일일 평균 설비 이용 시간</div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <div style={{ color: "#6b7280", fontSize: 12 }}>10월 2주차 3주차 비교</div>
          <div style={{ display: "flex", flexDirection: "row", gap: 12, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b82f6", display: "inline-block" }} />
              <span style={{ color: "#3b82f6", fontSize: 14 }}>10월 2주차</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
              <span style={{ color: "#ef4444", fontSize: 14 }}>10월 3주차</span>
            </div>
          </div>
        </div>
      </div>
      <div style={{ width: "100%", height: 320, minWidth: 0, minHeight: 0 }}>
        {mounted && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={DATA} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
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
              <Area type="monotone" dataKey="week2" name="10월 2주차" stroke="#2563eb" strokeWidth={2.5} fill="url(#usageBlue)" dot={{ r: 2 }} activeDot={{ r: 4 }} />
              <Area type="monotone" dataKey="week3" name="10월 3주차" stroke="#ef4444" strokeWidth={2.5} fill="url(#usageRed)" dot={{ r: 2 }} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </CommonContainerBox>
  );
}

