'use client';

import React, { useEffect, useState } from 'react';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import CommonTableFrame from '@/components/ui/CommonTableFrame';
import CommonPagination from '@/components/ui/CommonPagination';
import { getDashboardConvertDetail, getDashboardConvertHistoryDetail } from '@/service/dashboard';
import { ConvertDetailItem, ConvertHistoryDetailResult, PaginationInfo } from '@/types/dashboard';
import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatTime = (seconds: number): string => {
  if (!seconds && seconds !== 0) return '-';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts: string[] = [];
  if (hours > 0) {
    parts.push(`${hours}시간`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}분`);
  }
  if (secs > 0 || parts.length === 0) {
    parts.push(`${secs}초`);
  }
  
  return parts.join(' ');
};

const formatSeconds = (seconds: number): string => {
  if (!seconds && seconds !== 0) return '-';
  return `${seconds.toFixed(2)}초`;
};

const formatTimeMinutesSeconds = (seconds: number): string => {
  if (!seconds && seconds !== 0) return '-';
  const totalMinutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts: string[] = [];
  if (totalMinutes > 0) {
    parts.push(`${totalMinutes}분`);
  }
  if (secs > 0 || parts.length === 0) {
    parts.push(`${secs}초`);
  }
  
  return parts.join(' ');
};

const formatDateTime = (date: Date | string | null | undefined): string => {
  if (!date) {
    return '-';
  }
  
  let dateObj: Date;
  if (typeof date === 'string') {
    if (!date.trim()) {
      return '-';
    }
    
    let dateString = date.trim();
    const hasTimezone = dateString.includes('Z') || 
                        dateString.includes('+') || 
                        (dateString.match(/[-+]\d{2}:\d{2}$/) !== null);
    
    if (!hasTimezone && dateString.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      dateString = dateString + 'Z';
    }
    
    dateObj = new Date(dateString);
  } else {
    dateObj = date;
  }
  
  if (!dateObj || isNaN(dateObj.getTime())) {
    return '-';
  }
  
  const formatter = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  const parts = formatter.formatToParts(dateObj).reduce<Record<string, string>>((acc, p) => {
    if (p.type !== 'literal') acc[p.type] = p.value;
    return acc;
  }, {});
  
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
};

function PrettyNumber({ value, unit }: { value: number | null | undefined; unit: string }) {
  if (value === null || value === undefined || isNaN(value)) {
    return <span>-{unit}</span>;
  }
  return <span>{value.toLocaleString(undefined, { maximumFractionDigits: 1 })}{unit}</span>;
}

function RadialGauge({ percent, size = 120, color = "#5A73FF" }: { percent: number | null | undefined; size?: number; color?: string }) {
  if (percent === null || percent === undefined || isNaN(percent)) {
    return (
      <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#9CA3AF" }}>-</span>
      </div>
    );
  }
  const clamped = Math.max(0, Math.min(100, percent));
  const inner = Math.max(10, Math.floor(size / 2) - 28);
  const outer = Math.max(inner + 10, Math.floor(size / 2) - 10);
  const startAngle = 90;
  const endAngle = -270;

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <RadialBarChart width={size} height={size} cx="50%" cy="50%" innerRadius={inner} outerRadius={outer} startAngle={startAngle} endAngle={endAngle} data={[{ name: "bg", value: 100 }]}
        style={{ position: "absolute", inset: 0 }}>
        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
        <RadialBar dataKey="value" cornerRadius={10} fill="#E5E7EB" background={false} />
      </RadialBarChart>
      <RadialBarChart width={size} height={size} cx="50%" cy="50%" innerRadius={inner} outerRadius={outer} startAngle={startAngle} endAngle={endAngle} data={[{ name: "v", value: clamped }]}
        style={{ position: "absolute", inset: 0 }}>
        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
        <RadialBar dataKey="value" cornerRadius={10} fill={color} />
      </RadialBarChart>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: Math.round(size * 0.2), color: "#111827" }}>
        {clamped}%
      </div>
    </div>
  );
}

export default function Compressionlist() {
  const [data, setData] = useState<ConvertDetailItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [detailData, setDetailData] = useState<Record<string, ConvertHistoryDetailResult>>({});
  const [loadingDetails, setLoadingDetails] = useState<Set<string>>(new Set());

  // 데이터 로드 함수
  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getDashboardConvertDetail(undefined, { page, size });
      if (response.isSuccess && response.result) {
        setData(response.result.content || []);
        setPagination(response.result.pagination || null);
      } else {
        setError(response.message || '데이터 조회 실패');
      }
    } catch (err: any) {
      setError(err.message || '데이터 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [page, size]);

  // 데이터 로드
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 대시보드 새로고침 이벤트 구독
  useEffect(() => {
    const handleRefresh = () => {
      console.log('[Compressionlist] 대시보드 새로고침 이벤트 수신');
      fetchData();
    };

    window.addEventListener('refreshDashboard', handleRefresh);
    return () => {
      window.removeEventListener('refreshDashboard', handleRefresh);
    };
  }, [fetchData]);

  // 행 클릭 핸들러 - 상세 정보 펼치기/접기
  const handleRowClick = async (item: ConvertDetailItem) => {
    const isExpanded = expandedItems.has(item.convertHistoryUuid);
    
    if (isExpanded) {
      setExpandedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.convertHistoryUuid);
        return newSet;
      });
    } else {
      setExpandedItems(prev => new Set(prev).add(item.convertHistoryUuid));
      
      if (!detailData[item.convertHistoryUuid]) {
        setLoadingDetails(prev => new Set(prev).add(item.convertHistoryUuid));
        try {
          const response = await getDashboardConvertHistoryDetail(item.convertHistoryUuid);
          if (response.isSuccess && response.result) {
            setDetailData(prev => ({
              ...prev,
              [item.convertHistoryUuid]: response.result,
            }));
          }
        } catch (error) {
          console.error('상세 조회 실패:', error);
        } finally {
          setLoadingDetails(prev => {
            const newSet = new Set(prev);
            newSet.delete(item.convertHistoryUuid);
            return newSet;
          });
        }
      }
    }
  };

  // 파일명 추출
  const getFileName = (url: string | null): string => {
    if (!url) return '-';
    return url.split('/').pop() || '-';
  };

  return (
    <div className="mt-8">
      <h1 className="text-xl font-bold text-gray-900 mb-3">전체 압축 목록</h1>

      <CommonContainerBox>
        {loading && (
          <div className="py-12 text-center text-gray-500 text-sm">
            로딩 중...
          </div>
        )}
        {error && (
          <div className="py-12 text-center text-red-500 text-sm">
            {error}
          </div>
        )}
        {!loading && !error && (
          <>
            <CommonTableFrame
              header={
                <thead className="bg-gray-50">
                  <tr className="text-gray-700">
                    <th className="text-center font-semibold text-medium tracking-wide py-2 px-3">No.</th>
                    <th className="text-left font-semibold text-medium tracking-wide py-2 px-3">파일명</th>
                    <th className="text-left font-semibold text-medium tracking-wide py-2 px-3">알고리즘</th>
                    <th className="text-center font-semibold text-medium tracking-wide py-2 px-3">버전</th>
                    <th className="text-center font-semibold text-medium tracking-wide py-2 px-3 whitespace-nowrap">처리방식</th>
                    <th className="text-center font-semibold text-medium tracking-wide py-2 px-3">파일용량</th>
                    <th className="text-center font-semibold text-medium tracking-wide py-2 px-3">담당자</th>
                    <th className="text-center font-semibold text-medium tracking-wide py-2 px-3">평균속도</th>
                    <th className="text-center font-semibold text-medium tracking-wide py-2 px-3">총 소요시간</th>
                  </tr>
                </thead>
              }
              body={
                <tbody>
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-gray-500 text-sm">
                        압축 내역이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    data.map((item, index) => {
                      const isExpanded = expandedItems.has(item.convertHistoryUuid);
                      const detail = detailData[item.convertHistoryUuid];
                      const isLoadingDetail = loadingDetails.has(item.convertHistoryUuid);
                      // 최신순 정렬이므로 역순으로 번호 계산
                      const rowNumber = pagination?.totalElements 
                        ? pagination.totalElements - (page * size + index)
                        : page * size + index + 1;
                      
                      return (
                        <React.Fragment key={item.convertHistoryUuid}>
                          <tr
                            className="border-b border-gray-100 text-sm text-gray-900 hover:bg-gray-50 cursor-pointer"
                            onClick={() => handleRowClick(item)}
                          >
                            <td className="py-3 px-3 text-center">
                              {rowNumber}
                            </td>
                            <td className="py-3 px-3 truncate max-w-xs" title={getFileName(item.tiffUrl)}>
                              {getFileName(item.tiffUrl)}
                            </td>
                            <td className="py-3 px-3 truncate max-w-xs" title={item.compressionType}>
                              {item.compressionType}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 border border-gray-200 px-2 py-0.5 text-[11px]">
                                v{item.version}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className={`${item.processingUnit === 'GPU' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'} inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]`}>
                                {item.processingUnit}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">{formatFileSize(item.tiffVolume)}</td>
                            <td className="py-3 px-3 text-center">{item.userName}</td>
                            <td className="py-3 px-3 text-center">
                              <PrettyNumber value={item.avgSpeed} unit=" MB/s" />
                            </td>
                            <td className="py-3 px-3 text-center">
                              {formatTime(item.elapsedTime)}
                            </td>
                          </tr>
                          {/* 상세 정보 행 */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={10} className="p-0">
                                <div className="border border-gray-200 rounded-lg m-3">
                                  <div className="p-3">
                                    {isLoadingDetail ? (
                                      <div className="py-6 text-center text-gray-500 text-sm">불러오는 중…</div>
                                    ) : detail ? (
                                      <>
                                        <div className="flex gap-7 mt-4 items-center justify-center">
                                          <div className="w-[60px] font-semibold text-gray-900">압축 성능</div>

                                          <div className="w-40 flex flex-col items-center">
                                            <div className="text-center text-gray-500 mb-1">평균 GPU 이용률</div>
                                            <RadialGauge percent={detail.avgGpuUtilization} size={120} />
                                          </div>

                                          <div className="flex-1 min-w-[120px] max-w-[220px]">
                                            <div className="grid grid-cols-[120px_1fr] gap-y-2 gap-x-2">
                                              <div className="text-gray-500">평균속도</div>
                                              <div><PrettyNumber value={detail.avgSpeed} unit="MB/s" /></div>
                                              <div className="text-gray-500">원본확장자</div>
                                              <div>{detail.sourceExtension}</div>
                                              <div className="text-gray-500">압축확장자</div>
                                              <div>{detail.compressedExtension}</div>
                                            </div>
                                          </div>

                                          <div className="flex-1 min-w-40 max-w-[290px] grid grid-cols-[120px_1fr] gap-y-2 gap-x-2">
                                            <div className="text-gray-500">시작일시</div>
                                            <div className="whitespace-nowrap">{formatDateTime(detail.requestAt)}</div>
                                            <div className="text-gray-500">완료일시</div>
                                            <div className="whitespace-nowrap">{formatDateTime(detail.completedAt)}</div>
                                            <div className="text-gray-500">압축 소요시간</div>
                                            <div>
                                              {typeof detail.compressionTime === 'number' && detail.compressionTime >= 0
                                                ? formatSeconds(detail.compressionTime)
                                                : '-'}
                                            </div>
                                            <div className="text-gray-500">총 소요시간</div>
                                            <div>
                                              {typeof detail.elapsedTime === 'number' && detail.elapsedTime >= 0
                                                ? formatTimeMinutesSeconds(detail.elapsedTime)
                                                : '-'}
                                            </div>
                                          </div>
                                        </div>
                                      </>
                                    ) : (
                                      <div className="py-6 text-center text-gray-500 text-sm">상세 정보를 불러올 수 없습니다</div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              }
            />
            {/* 페이지네이션 */}
            {pagination && pagination.totalPages > 1 && (
              <CommonPagination
                currentPage={page + 1}
                totalPages={pagination.totalPages}
                onChange={(newPage) => setPage(newPage - 1)}
              />
            )}
          </>
        )}
      </CommonContainerBox>
    </div>
  );
}

