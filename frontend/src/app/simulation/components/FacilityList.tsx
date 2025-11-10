'use client';

import React from 'react';
import ContainerBox from '@/components/ui/CommonContainerBox';
import type { Facility } from '../types';
import CommonPagination from '@/components/ui/CommonPagination';
import FacilityStatisticsSummary from './FacilityStatisticsSummary';

interface FacilityListProps {
  facilities: Facility[];
  onFacilityClick?: (facility: Facility) => void;
  onFacilityHover?: (facilityId: string | null) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalCount: number;
  totalOperational: number;
  totalRunning: number;
  availabilityRate: string;
}

export default function FacilityList({
  facilities,
  onFacilityClick,
  onFacilityHover,
  currentPage,
  totalPages,
  onPageChange,
  totalCount,
  totalOperational,
  totalRunning,
  availabilityRate,
}: FacilityListProps) {
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

  const getStatusBadgeClasses = (status: Facility['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProcessBadgeClasses = (status?: Facility['processStatus']) => {
    switch (status) {
      case 'RUNNING':
        return 'bg-blue-100 text-blue-800';
      case 'WAITING':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <ContainerBox className="h-full flex flex-col p-0 relative">
      {/* 설비 목록 */}
      <div
        className="flex-1 overflow-y-auto"
        onMouseLeave={() => onFacilityHover?.(null)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            onFacilityHover?.(null);
          }
        }}
      >
        {facilities.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-500">설비가 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="px-4 pt-4 pb-2">
              <FacilityStatisticsSummary
                total={totalCount}
                operational={totalOperational}
                running={totalRunning}
                availabilityRate={availabilityRate}
              />
            </div>
            <div className="py-3 space-y-3">
          {facilities.map((facility) => (
            <div
              key={facility.id}
                  className={`border border-gray-200 rounded-lg px-4 py-3 hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-center ${
                    facility.status === 'inactive' ? 'bg-gray-100' : 'bg-white'
                  }`}
                  onClick={() => onFacilityClick?.(facility)}
                  onMouseEnter={() => onFacilityHover?.(facility.id)}
                  onMouseLeave={() => onFacilityHover?.(null)}
                  onFocus={() => onFacilityHover?.(facility.id)}
                  onBlur={() => onFacilityHover?.(null)}
                  tabIndex={0}
            >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-nowrap overflow-hidden">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          facility.status === 'inactive' ? 'bg-red-500' : getStatusColor(facility.status)
                        }`}
                      />
                      <span className="text-sm font-semibold text-gray-900 truncate">{facility.name}</span>
                      {facility.modelName && (
                        <span className="text-xs text-gray-500 truncate">{facility.modelName}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {facility.status === 'active' ? (
                        <span
                          className={`inline-block px-2 py-1 rounded text-[11px] font-medium ${getProcessBadgeClasses(facility.processStatus)}`}
                        >
                          {facility.processStatus === 'RUNNING'
                            ? '진행'
                            : facility.processStatus === 'WAITING'
                              ? '대기'
                              : '대기'}
                        </span>
                      ) : (
                        <span
                          className={`inline-block px-2 py-1 rounded text-[11px] font-medium ${getStatusBadgeClasses(facility.status)}`}
                        >
                          {facility.status === 'inactive' ? '고장' : '점검'}
                        </span>
                      )}
                    </div>
                </div>
                  {!facility.modelName && (
                    <p className="text-xs text-gray-500">{facility.type}</p>
                  )}
                </div>
              ))}
            </div>
            <CommonPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onChange={onPageChange}
              className="pb-4"
            />
          </>
        )}
      </div>
    </ContainerBox>
  );
}

