"use client";

import React, { useEffect, useState } from "react";
import CommonContainerBox from "@/components/ui/CommonContainerBox";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList } from "recharts";

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
  return (
    <CommonContainerBox>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontWeight: 800, fontSize: 20 }}>일일 패널 생산량</div>
        <div style={{ color: "#374151", fontWeight: 600, fontSize: 14 }}>(25/10/13 ~ 25/10/19)</div>
      </div>
      <div style={{ width: "100%", height: 320, minWidth: 0, minHeight: 0 }}>
        {mounted && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={DATA} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
              <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fill: "#9ca3af", fontSize: 12 }} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} />
              <Tooltip formatter={(v: number) => v.toLocaleString()} />
              <Bar dataKey="value" fill="#CAD4E5" radius={[4, 4, 0, 0]}>
                <LabelList
                  dataKey="value"
                  position="top"
                  formatter={(label) => (typeof label === "number" ? label.toLocaleString() : String(label))}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </CommonContainerBox>
  );
}

