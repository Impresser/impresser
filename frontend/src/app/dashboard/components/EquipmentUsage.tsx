"use client";

import React, { useEffect, useState } from "react";
import CommonContainerBox from "@/components/ui/CommonContainerBox";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 20 }}>일일 평균 설비 이용 시간</div>
        <div style={{ color: "#6b7280", fontSize: 12 }}>10월 2주차 3주차 비교</div>
      </div>
      <div style={{ width: "100%", height: 320, minWidth: 0, minHeight: 0 }}>
        {mounted && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={DATA} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
              <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fill: "#6b7280", fontSize: 12 }} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} />
              <Tooltip />
              <Legend verticalAlign="top" height={24} />
              <Line type="monotone" dataKey="week2" name="10월 2주차" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="week3" name="10월 3주차" stroke="#ef4444" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </CommonContainerBox>
  );
}

