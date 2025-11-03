"use client";

import React, { useEffect, useState } from "react";
import CommonContainerBox from "@/components/ui/CommonContainerBox";
import { ResponsiveContainer, ComposedChart, Bar, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";

type DataPoint = { day: string; value: number };

// 하드코딩: 25/10/13 ~ 25/10/19 일일 패널 생산량
const DATA: DataPoint[] = [
  { day: "13", value: 500 },
  { day: "14", value: 750 },
  { day: "15", value: 1200 },
  { day: "16", value: 870 },
  { day: "17", value: 600 },
  { day: "18", value: 8 },
  { day: "19", value: 1300 }
];

export default function PanelOutput() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const avg = DATA.reduce((s, d) => s + d.value, 0) / DATA.length;
  return (
    <CommonContainerBox>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 20 }}>일일 패널 생산량</div>
        <div style={{ color: "#374151", fontWeight: 600, fontSize: 14 }}>(25/10/13 ~ 25/10/19)</div>
      </div>
      <div style={{ width: "100%", height: 320, minWidth: 0, minHeight: 0 }}>
        {mounted && (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={DATA} margin={{ top: 8, right: 26, bottom: 1, left: 0 }}>
              <defs>
                <linearGradient id="panelStem" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818CF8" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#A78BFA" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#eef1f5" strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fill: "#6b7280", fontSize: 12 }} height={18} tickMargin={4} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} domain={[0, 'dataMax + 150']} />
              <Tooltip formatter={(v: number) => v.toLocaleString()} cursor={{ stroke: '#cfd4dc', strokeDasharray: '3 3' }} />
              <ReferenceLine y={avg} stroke="#ef4444" strokeDasharray="4 4" label={{ value: ` ${Math.round(avg)}`, position: 'right', fill: '#ef4444', fontSize: 12 }} />
              {/* 얇은 스템 */}
              <Bar dataKey="value" barSize={6} radius={[3, 3, 0, 0]} fill="url(#panelStem)" />
              {/* 동그란 헤드 */}
              <Scatter dataKey="value" fill="#6366F1" shape="circle" />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </CommonContainerBox>
  );
}

