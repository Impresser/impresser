'use client';

import React, { useEffect, useState } from 'react';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import CommonTableFrame from '@/components/ui/CommonTableFrame';
import { HistoryItem } from '@/components/ui/CommonTable';
import Button from '@/components/ui/CommonButton';
import { useImageCompressorStore } from '@/store/imageCompressorStore';
import { ConvertHistoryItem, ConvertHistoryDetailItem } from '@/types/imageCompressor';
import { getConvertHistoryDetail } from '@/service/imageCompressor';
import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';

interface CompressionHistoryProps {
  onDownload?: (item: HistoryItem) => void;
}

// API 응답을 HistoryItem으로 변환
const convertToHistoryItem = (item: ConvertHistoryItem): HistoryItem => {
  return {
    id: item.convertHistoryUuid,
    fileName: item.tiffName,
    processingMethod: item.processingUnit.toUpperCase(),
    algorithm: item.compressionType,
    version: item.version.toString(),
    fileSize: item.tiffVolume,
    status: '완료' as const,
    assignedUser: item.userName,
    completedTime: new Date(item.completedAt),
    duration: item.elapsedTime,
    tiffUrl: item.tiffUrl, // 다운로드 URL 저장
  };
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

const formatDateTime = (date: Date | string | null | undefined): string => {
  // null이나 undefined인 경우
  if (!date) {
    return '-';
  }
  
  // 문자열인 경우 Date 객체로 변환
  let dateObj: Date;
  if (typeof date === 'string') {
    // 빈 문자열인 경우
    if (!date.trim()) {
      return '-';
    }
    
    // ISO 8601 형식 처리
    let dateString = date.trim();
    
    // 타임존 정보가 없으면 UTC로 간주
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
  
  // Date 객체가 유효한지 확인
  if (!dateObj || isNaN(dateObj.getTime())) {
    return '-'; // 유효하지 않은 날짜는 '-' 반환
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

// 숫자 포맷팅 컴포넌트
function PrettyNumber({ value, unit }: { value: number | null | undefined; unit: string }) {
  if (value === null || value === undefined || isNaN(value)) {
    return <span>-{unit}</span>;
  }
  return <span>{value.toLocaleString(undefined, { maximumFractionDigits: 1 })}{unit}</span>;
}

// 원형 게이지 컴포넌트
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
  const startAngle = 90; // 12시
  const endAngle = -270; // 시계방향 360도

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      {/* 배경 링 */}
      <RadialBarChart width={size} height={size} cx="50%" cy="50%" innerRadius={inner} outerRadius={outer} startAngle={startAngle} endAngle={endAngle} data={[{ name: "bg", value: 100 }]}
        style={{ position: "absolute", inset: 0 }}>
        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
        <RadialBar dataKey="value" cornerRadius={10} fill="#E5E7EB" background={false} />
      </RadialBarChart>
      {/* 실제 값 */}
      <RadialBarChart width={size} height={size} cx="50%" cy="50%" innerRadius={inner} outerRadius={outer} startAngle={startAngle} endAngle={endAngle} data={[{ name: "v", value: clamped }]}
        style={{ position: "absolute", inset: 0 }}>
        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
        <RadialBar dataKey="value" cornerRadius={10} fill={color} />
      </RadialBarChart>
      {/* 중앙 텍스트 */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: Math.round(size * 0.2), color: "#111827" }}>
        {clamped}%
      </div>
    </div>
  );
}

export default function CompressionHistory({
  onDownload,
}: CompressionHistoryProps) {
  const { histories, loading, error, fetchHistories, pagination } = useImageCompressorStore();
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [detailData, setDetailData] = useState<Record<string, ConvertHistoryDetailItem>>({});
  const [loadingDetails, setLoadingDetails] = useState<Set<string>>(new Set());

  // 컴포넌트 마운트 시 및 페이지 변경 시 데이터 로드
  useEffect(() => {
    fetchHistories({ page, size });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size]);

  // API 응답을 HistoryItem으로 변환
  const historyItems: HistoryItem[] = histories.map(convertToHistoryItem);

  // 다운로드 핸들러
  const handleDownload = (item: HistoryItem) => {
    // tiffUrl이 있는 경우 다운로드 처리
    if (item.tiffUrl) {
      // URL에서 파일 다운로드
      const link = document.createElement('a');
      link.href = item.tiffUrl;
      link.download = item.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // 기본 다운로드 핸들러 호출
      if (onDownload) {
        onDownload(item);
      } else {
        console.log('다운로드:', item.fileName);
      }
    }
  };

  // 행 클릭 핸들러 - 상세 정보 펼치기/접기
  const handleRowClick = async (item: HistoryItem) => {
    const isExpanded = expandedItems.has(item.id);
    
    if (isExpanded) {
      // 접기
      setExpandedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    } else {
      // 펼치기
      setExpandedItems(prev => new Set(prev).add(item.id));
      
      // 상세 정보가 없으면 API 호출
      if (!detailData[item.id]) {
        setLoadingDetails(prev => new Set(prev).add(item.id));
        try {
          const response = await getConvertHistoryDetail(item.id);
          if (response.isSuccess && response.result) {
            setDetailData(prev => ({
              ...prev,
              [item.id]: response.result,
            }));
          }
        } catch (error) {
          console.error('상세 조회 실패:', error);
        } finally {
          setLoadingDetails(prev => {
            const newSet = new Set(prev);
            newSet.delete(item.id);
            return newSet;
          });
        }
      }
    }
  };

  return (
    <div className="mt-8">
      <h1 className="text-lg font-bold text-gray-900 mb-6">압축내역</h1>

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
                    <th className="text-left font-semibold text-xs tracking-wide py-2 px-3">파일명</th>
                    <th className="text-left font-semibold text-xs tracking-wide py-2 px-3">알고리즘</th>
                    <th className="text-center font-semibold text-xs tracking-wide py-2 px-3">버전</th>
                    <th className="text-center font-semibold text-xs tracking-wide py-2 px-3 whitespace-nowrap">처리방식</th>
                    <th className="text-center font-semibold text-xs tracking-wide py-2 px-3">파일용량</th>
                    <th className="text-center font-semibold text-xs tracking-wide py-2 px-3">상태</th>
                    <th className="text-center font-semibold text-xs tracking-wide py-2 px-3">담당자</th>
                    <th className="text-center font-semibold text-xs tracking-wide py-2 px-3">완료일시</th>
                    <th className="text-center font-semibold text-xs tracking-wide py-2 px-3">소요시간</th>
                    <th className="text-center font-semibold text-xs tracking-wide py-2 px-3">작업</th>
                  </tr>
                </thead>
              }
              body={
                <tbody>
                  {historyItems.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-gray-500 text-sm">
                        완료된 압축 내역이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    historyItems.map((item) => {
                      const isExpanded = expandedItems.has(item.id);
                      const detail = detailData[item.id];
                      const isLoadingDetail = loadingDetails.has(item.id);
                      
                      return (
                        <React.Fragment key={item.id}>
                          <tr
                            className="border-b border-gray-100 text-sm text-gray-900 hover:bg-gray-50 cursor-pointer"
                            onClick={() => handleRowClick(item)}
                          >
                            <td className="py-3 px-3 truncate max-w-xs" title={item.fileName}>
                              {item.fileName}
                            </td>
                            <td className="py-3 px-3 truncate max-w-xs" title={item.algorithm}>
                              {item.algorithm}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 border border-gray-200 px-2 py-0.5 text-[11px]">
                                v{item.version}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className={`${item.processingMethod === 'GPU' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'} inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]`}>
                                {item.processingMethod}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">{formatFileSize(item.fileSize)}</td>
                            <td className="py-3 px-3 text-center">
                              <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] bg-gray-100 text-gray-700 border-gray-200">
                                {item.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">{item.assignedUser}</td>
                            <td className="py-3 px-3 text-center">
                              {formatDateTime(item.completedTime)}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {formatTime(item.duration)}
                            </td>
                            <td 
                              className="py-3 px-3 text-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <a
                                href={item.tiffUrl || '#'}
                                download={item.tiffUrl ? item.fileName : undefined}
                                onClick={(e) => {
                                  if (!item.tiffUrl) {
                                    e.preventDefault();
                                    handleDownload(item);
                                  }
                                }}
                                className="text-blue-600 hover:underline text-sm"
                              >
                                다운로드
                              </a>
                            </td>
                          </tr>
                          {/* 상세 정보 행 */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={10} className="p-0">
                                <div className="border border-gray-200 rounded-lg m-3">
                                  <div className="p-3">
                                    {/* 상세 정보 표 */}
                                    {isLoadingDetail ? (
                                      <div className="py-6 text-center text-gray-500 text-sm">불러오는 중…</div>
                                    ) : detail ? (
                                      <>
                                        {/* 상세 카드 - 5열 구성: [타이틀] [게이지] [속도] [시간] [확장자] */}
                                        <div className="flex gap-5 mt-4 items-center justify-center">
                                          {/* 맨맨 왼쪽: 타이틀 */}
                                          <div className="w-[60px] font-semibold text-gray-900">압축 성능</div>

                                          {/* 맨 왼쪽: 평균 GPU 이용률 그래프 */}
                                          <div className="w-40 flex flex-col items-center">
                                            <div className="text-center text-gray-500 mb-1">평균 GPU 이용률</div>
                                            <RadialGauge percent={detail.avgGpuUtilization} size={120} />
                                          </div>

                                          {/* 왼쪽: 속도들 */}
                                          <div className="flex-1 min-w-[120px] max-w-[220px]">
                                            <div className="grid grid-cols-[120px_1fr] gap-y-2 gap-x-2">
                                              <div className="text-gray-500">평균속도</div>
                                              <div><PrettyNumber value={detail.avgSpeed} unit="MB/s" /></div>
                                              <div className="text-gray-500">최고속도</div>
                                              <div><PrettyNumber value={detail.maxSpeed} unit="MB/s" /></div>
                                              <div className="text-gray-500">최저속도</div>
                                              <div><PrettyNumber value={detail.minSpeed} unit="MB/s" /></div>
                                            </div>
                                          </div>

                                          {/* 중앙쪽: 시작/완료/시간들 */}
                                          <div className="flex-1 min-w-40 max-w-[290px] grid grid-cols-[120px_1fr] gap-y-2 gap-x-2">
                                            <div className="text-gray-500">시작일시</div>
                                            <div className="whitespace-nowrap">{formatDateTime(detail.requestedAt)}</div>
                                            <div className="text-gray-500">완료일시</div>
                                            <div className="whitespace-nowrap">{formatDateTime(detail.completedAt)}</div>
                                            <div className="text-gray-500">압축 소요 시간</div>
                                            <div>
                                              {typeof detail.compressionTime === 'number' && detail.compressionTime >= 0
                                                ? formatTime(Math.floor(detail.compressionTime))
                                                : '-'}
                                            </div>
                                            <div className="text-gray-500">총 소요시간</div>
                                            <div>
                                              {typeof detail.elapsedTime === 'number' && detail.elapsedTime >= 0
                                                ? formatTime(Math.floor(detail.elapsedTime))
                                                : '-'}
                                            </div>
                                          </div>

                                          {/* 오른쪽: 확장자 */}
                                          <div className="w-[140px] grid grid-cols-[120px_1fr] gap-y-2 gap-x-2">
                                            <div className="text-gray-500">원본확장자</div>
                                            <div>{detail.sourceExtension}</div>
                                            <div className="text-gray-500">압축확장자</div>
                                            <div>{detail.compressedExtension}</div>
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
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  전체 {pagination.totalElements}개 중 {page * size + 1}-
                  {Math.min((page + 1) * size, pagination.totalElements)}개 표시
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={pagination.first}
                    variant="gray"
                    className="px-3 py-1 text-xs"
                  >
                    이전
                  </Button>
                  <span className="px-3 py-1 text-sm text-gray-700">
                    {page + 1} / {pagination.totalPages}
                  </span>
                  <Button
                    onClick={() => setPage(p => p + 1)}
                    disabled={pagination.last}
                    variant="gray"
                    className="px-3 py-1 text-xs"
                  >
                    다음
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CommonContainerBox>
    </div>
  );
}


