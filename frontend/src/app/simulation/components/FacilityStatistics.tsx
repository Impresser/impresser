'use client';

import React from 'react';

export interface Facility {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'maintenance';
  modelName?: string;
  processStatus?: 'WAITING' | 'RUNNING';
  cpu?: string;
  gpu?: string;
  ram?: string;
  vram?: string;
  installDate?: Date | string;
}

interface FacilityStatisticsProps {
  facilities: Facility[];
}

export default function FacilityStatistics({ facilities }: FacilityStatisticsProps) {
  // 통계 계산
  const totalFacilities = facilities.length;
  // 가동중은 processStatus가 RUNNING인 설비만 카운트 (printerStatus와 무관)
  const runningFacilities = facilities.filter(f => f.processStatus === 'RUNNING').length;
  const operationRate = totalFacilities > 0 ? ((runningFacilities / totalFacilities) * 100).toFixed(1) : '0.0';

  return (
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">전체 설비 수:</span>
        <span className="text-sm font-semibold text-gray-900">{totalFacilities}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">가동중:</span>
        <span className="text-sm font-semibold text-green-600">{runningFacilities}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">가동률:</span>
        <span className="text-sm font-semibold text-blue-600">{operationRate}%</span>
      </div>
    </div>
  );
}
