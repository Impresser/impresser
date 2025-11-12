"use client";

import React from "react";

interface FacilityStatisticsSummaryProps {
  total: number;
  operational: number;
  running: number;
  availabilityRate: string;
}

export default function FacilityStatisticsSummary({
  total,
  operational,
  running,
  availabilityRate,
}: FacilityStatisticsSummaryProps) {
  return (
    <div className="flex items-center gap-6 text-sm text-gray-900">
      <Statistic label="전체" value={`${total}대`} />
      <Statistic label="작동가능" value={`${operational}대`} />
      <Statistic label="작업중" value={`${running}대`} />
      <Statistic label="가동률" value={availabilityRate} />
    </div>
  );
}

function Statistic({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  );
}

