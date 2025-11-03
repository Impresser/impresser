"use client";

import React, { useEffect, useMemo, useState } from "react";
import ContainerBox from "@/components/ui/ContainerBox";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

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

const ALGORITHMS: AlgorithmPerf[] = [
  { key: "LZW", label: "LZW", avgSpeedMBps: 20, version: "0.114", mode: "GPU" },
  { key: "PackBits", label: "PackBits", avgSpeedMBps: 12.3, version: "0.2.1", mode: "GPU" },
  { key: "Deflate", label: "Deflate", avgSpeedMBps: 9.2, version: "0.4.1", mode: "GPU" }
];

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

export default function EquipmentUsage() {
  const [selected, setSelected] = useState<AlgorithmKey | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const maxSpeed = useMemo(() => {
    return Math.max(...ALGORITHMS.map(a => a.avgSpeedMBps));
  }, []);

  const selectedDetail = selected ? DETAILS[selected] : null;

  return (
    <ContainerBox>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* 상단: 좌측 그래프, 우측 순위 표 */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", minWidth: 0 }}>
        {/* 좌측 Recharts 세로 막대 차트 */}
        <div style={{ flex: "1 1 0", minWidth: 280, border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>전체 압축 성능 순위</div>
          <div style={{ width: "100%", height: 260, minWidth: 0, minHeight: 0 }}>
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ALGORITHMS} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }} barCategoryGap={24}>
                  <CartesianGrid stroke="#f3f4f6" />
                  <XAxis type="number" domain={[0, maxSpeed]} hide />
                  <YAxis type="category" dataKey="label" width={80} tick={{ fill: "#6b7280", fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => `${v.toLocaleString(undefined, { maximumFractionDigits: 1 })} MB/s`} />
                  <Bar dataKey="avgSpeedMBps" name="평균속도(MB/s)" fill="#CAD4E5" radius={[0, 4, 4, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 우측 순위 표 */}
        <div style={{ flex: "1 1 360px", minWidth: 0, maxWidth: 520, border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
            <thead>
              <tr style={{ background: "#f9fafb", color: "#6b7280" }}>
                <th style={{ textAlign: "left", padding: 8, fontWeight: 500 }}>순위</th>
                <th style={{ textAlign: "left", padding: 8, fontWeight: 500 }}>알고리즘</th>
                <th style={{ textAlign: "left", padding: 8, fontWeight: 500 }}>버전</th>
                <th style={{ textAlign: "left", padding: 8, fontWeight: 500 }}>방식</th>
                <th style={{ textAlign: "right", padding: 8, fontWeight: 500 }}>평균압축속도</th>
              </tr>
            </thead>
            <tbody>
              {ALGORITHMS.map((a, idx) => {
                const isActive = a.key === selected;
                return (
                  <tr
                    key={a.key}
                    onClick={() => setSelected(prev => (prev === a.key ? null : a.key))}
                    style={{
                      cursor: "pointer",
                      background: isActive ? "#e5e7eb" : "transparent"
                    }}
                  >
                    <td style={{ padding: 8 }}>{idx + 1}위</td>
                    <td style={{ padding: 8 }}>{a.label}</td>
                    <td style={{ padding: 8 }}>{a.version}</td>
                    <td style={{ padding: 8 }}>{a.mode}</td>
                    <td style={{ padding: 8, textAlign: "right" }}>
                      <PrettyNumber value={a.avgSpeedMBps} unit="MB/s" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 하단 상세 정보 (선택 시 표시) */}
      {selectedDetail && (
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8 }}>
        <div style={{ padding: 12 }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
            <thead>
              <tr style={{ background: "#f9fafb", color: "#6b7280", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ textAlign: "left", padding: 8, fontWeight: 600, width: 60 }}>순위</th>
                <th style={{ textAlign: "left", padding: 8, fontWeight: 600 }}>이름</th>
                <th style={{ textAlign: "left", padding: 8, fontWeight: 600, width: 80 }}>방식</th>
                <th style={{ textAlign: "left", padding: 8, fontWeight: 600, width: 110 }}>알고리즘</th>
                <th style={{ textAlign: "left", padding: 8, fontWeight: 600, width: 90 }}>버전</th>
                <th style={{ textAlign: "left", padding: 8, fontWeight: 600, width: 90 }}>용량</th>
                <th style={{ textAlign: "left", padding: 8, fontWeight: 600, width: 90 }}>담당자</th>
                <th style={{ textAlign: "right", padding: 8, fontWeight: 600, width: 80 }}>소요시간</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: 8, width: 60 }}>{selectedDetail.id}</td>
                <td style={{ padding: 8 }}>{selectedDetail.name}</td>
                <td style={{ padding: 8, width: 80 }}>{selectedDetail.mode}</td>
                <td style={{ padding: 8, width: 110 }}>{selectedDetail.algorithm}</td>
                <td style={{ padding: 8, width: 90 }}>{selectedDetail.version}</td>
                <td style={{ padding: 8, width: 90 }}>{selectedDetail.size}</td>
                <td style={{ padding: 8, width: 90 }}>{selectedDetail.owner}</td>
                <td style={{ padding: 8, width: 80, textAlign: "right" }}>{selectedDetail.elapsed}</td>
              </tr>
            </tbody>
          </table>

          {/* 상세 카드 */}
          <div style={{ display: "flex", gap: 24, marginTop: 16 }}>
            {/* 좌: 간단 KPI */}
            <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>압축 성능</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
                {/* 원형 게이지 대체: 텍스트 + 바 */}
                <div style={{ width: 120 }}>
                  <div style={{ fontSize: 28, fontWeight: 700, textAlign: "center" }}>{selectedDetail.avgGpuUtilPercent}%</div>
                  <div style={{ textAlign: "center", color: "#6b7280" }}>평균 GPU 이용률</div>
                </div>
                <div style={{ flex: "0 0 auto" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", rowGap: 8, columnGap: 12 }}>
                    <div style={{ color: "#6b7280" }}>평균속도</div>
                    <div><PrettyNumber value={selectedDetail.avgSpeedMBps} unit="MB/s" /></div>
                    <div style={{ color: "#6b7280" }}>최고속도</div>
                    <div><PrettyNumber value={selectedDetail.maxSpeedMBps} unit="MB/s" /></div>
                    <div style={{ color: "#6b7280" }}>최저속도</div>
                    <div>{selectedDetail.minSpeedKBps.toLocaleString()}KB/s</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 우: 메타 정보 */}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>메타 정보</div>
              <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", rowGap: 8, columnGap: 12 }}>
                <div style={{ color: "#6b7280" }}>시작일시</div>
                <div>{selectedDetail.startedAt}</div>
                <div style={{ color: "#6b7280" }}>완료일시</div>
                <div>{selectedDetail.finishedAt}</div>
                <div style={{ color: "#6b7280" }}>원본확장자</div>
                <div>{selectedDetail.inputFormat}</div>
                <div style={{ color: "#6b7280" }}>압축확장자</div>
                <div>{selectedDetail.outputFormat}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}
      </div>
    </ContainerBox>
  );
}


