'use client';

import React from 'react';
import type { Facility } from './FacilityStatistics';

interface FacilityListProps {
  facilities: Facility[];
  onFacilityClick?: (facility: Facility) => void;
}

export default function FacilityList({ facilities, onFacilityClick }: FacilityListProps) {

  const getStatusColor = (status: Facility['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-gray-400';
      case 'maintenance':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = (status: Facility['status']) => {
    switch (status) {
      case 'active':
        return '가동중';
      case 'inactive':
        return '정지';
      case 'maintenance':
        return '점검중';
      default:
        return '알 수 없음';
    }
  };

  return (
    <div className="bg-white shadow-lg h-full flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center h-16 px-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800">설비 목록</h2>
      </div>

      {/* 설비 목록 */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {facilities.map((facility) => (
            <div
              key={facility.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onFacilityClick?.(facility)}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{facility.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{facility.type}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(facility.status)}`}></div>
                  <span className="text-xs text-gray-600">{getStatusText(facility.status)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
