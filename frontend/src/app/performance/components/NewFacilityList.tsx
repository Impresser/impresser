'use client';

import React, { useState, useEffect, useCallback } from 'react';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import CommonTableFrame from '@/components/ui/CommonTableFrame';
import { getInkjetPrinters, type InkjetPrinter } from '@/service/inkjet';

export default function NewFacilityList() {
  const [allFacilities, setAllFacilities] = useState<InkjetPrinter[]>([]);
  const [isLoadingFacilityTable, setIsLoadingFacilityTable] = useState(false);
  const [facilityTableError, setFacilityTableError] = useState<string | null>(null);
  const [facilityTablePage, setFacilityTablePage] = useState(0);
  const itemsPerPage = 10;

  const fetchAllFacilities = useCallback(async () => {
    try {
      setIsLoadingFacilityTable(true);
      setFacilityTableError(null);

      const aggregatedFacilities: InkjetPrinter[] = [];
      let page = 0;
      const size = 100;

      while (true) {
        const response = await getInkjetPrinters({ page, size });

        if (!response.isSuccess || !response.result) {
          throw new Error(response.message || '설비 목록 조회에 실패했습니다.');
        }

        const { content, pagination } = response.result;
        aggregatedFacilities.push(...content);

        if (pagination?.last || !pagination?.hasNext) {
          break;
        }

        page += 1;
      }

      // 고장 설비를 맨 아래로 정렬
      const sortedFacilities = aggregatedFacilities.sort((a, b) => {
        const aIsBroken = a.printerStatus === 'BROKEN';
        const bIsBroken = b.printerStatus === 'BROKEN';

        if (aIsBroken && !bIsBroken) return 1;
        if (!aIsBroken && bIsBroken) return -1;
        return 0;
      });

      setAllFacilities(sortedFacilities);
    } catch (err) {
      console.error('설비 목록 테이블 조회 실패:', err);
      setFacilityTableError(err instanceof Error ? err.message : '설비 목록 조회 중 오류가 발생했습니다.');
      setAllFacilities([]);
    } finally {
      setIsLoadingFacilityTable(false);
    }
  }, []);

  useEffect(() => {
    fetchAllFacilities();
  }, [fetchAllFacilities]);

  const handleFacilityTablePageChange = (newPage: number) => {
    setFacilityTablePage(newPage);
  };

  // 프론트엔드 페이지네이션
  const totalPages = Math.ceil(allFacilities.length / itemsPerPage);
  const startIndex = facilityTablePage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const facilityTableData = allFacilities.slice(startIndex, endIndex);

  return (
    <CommonContainerBox className="h-full flex flex-col px-4 py-4">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-gray-900">전체 설비</h3>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {isLoadingFacilityTable ? (
          <div className="flex h-32 items-center justify-center text-sm text-gray-500">
            설비 목록을 불러오는 중입니다...
          </div>
        ) : facilityTableError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {facilityTableError}
          </div>
        ) : facilityTableData.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-gray-500">
            등록된 설비가 없습니다.
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0">
              <CommonTableFrame
                header={
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700">설비명</th>
                      <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700">모델명</th>
                      <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700">작업 상태</th>
                    </tr>
                  </thead>
                }
                body={
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {facilityTableData.map((facility) => {
                      const getStatusDotColor = () => {
                        if (facility.printerStatus === 'OPERATIONAL') {
                          return 'bg-emerald-500';
                        } else if (facility.printerStatus === 'UNDER_REPAIR') {
                          return 'bg-amber-500';
                        } else if (facility.printerStatus === 'BROKEN') {
                          return 'bg-red-500';
                        }
                        return '';
                      };

                      const isBroken = facility.printerStatus === 'BROKEN';
                      const processLabel = facility.processStatus === 'RUNNING' ? '진행' : '대기';
                      const processColor =
                        facility.processStatus === 'RUNNING'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-gray-50 text-gray-700 border-gray-200';
                      const dotColor = getStatusDotColor();

                      return (
                        <tr
                          key={facility.inkjetUuid}
                          className={isBroken ? 'bg-gray-100 hover:bg-gray-200' : 'hover:bg-gray-50'}
                        >
                          <td
                            className={`relative px-2 py-2 text-xs font-medium truncate max-w-[100px] ${
                              isBroken ? 'text-gray-500' : 'text-gray-900'
                            }`}
                            title={facility.printerName}
                          >
                            {dotColor && (
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 inline-flex h-2.5 w-2.5 items-center justify-center">
                                <span className={`block h-full w-full rounded-full ${dotColor}`} />
                              </span>
                            )}
                            <span className={dotColor ? 'pl-4' : ''}>{facility.printerName}</span>
                          </td>
                          <td
                            className={`px-2 py-2 text-xs truncate max-w-[100px] ${
                              isBroken ? 'text-gray-400' : 'text-gray-700'
                            }`}
                            title={facility.modelName}
                          >
                            {facility.modelName}
                          </td>
                          <td className="px-2 py-2 text-center">
                            {!isBroken && (
                              <span
                                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${processColor}`}
                              >
                                {processLabel}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                }
              />
            </div>

            {allFacilities.length > 0 && totalPages > 1 && (
              <div className="mt-3 flex items-center justify-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleFacilityTablePageChange(facilityTablePage - 1)}
                  disabled={facilityTablePage === 0 || isLoadingFacilityTable}
                  className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  이전
                </button>
                <span className="px-2 py-1 text-xs text-gray-700">
                  {facilityTablePage + 1} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => handleFacilityTablePageChange(facilityTablePage + 1)}
                  disabled={facilityTablePage >= totalPages - 1 || isLoadingFacilityTable}
                  className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </CommonContainerBox>
  );
}

