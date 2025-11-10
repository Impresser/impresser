'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import CommonPagination from '@/components/ui/CommonPagination';
import { getBmpList, getBmpDetail } from '@/service/imageGenerator';
import { BmpListItem, BmpDetailResult } from '@/types/imageGenerator';
import CommonTableFrame from '@/components/ui/CommonTableFrame';

// CSV 내보내기 함수
const exportToCSV = (data: BmpDetailResult) => {
  const csvRows = [
    'image_width,image_height,,rg_gap_w,,gb_gap_w',
    `${data.bmpWidth},${data.bmpHeight},,${data.rgGap},,${data.gbGap}`,
    ',,,,,,,',
    'r_size_x,r_size_y,,r_count_x,r_count_y,,r_gap_x,r_gap_y',
    `${data.redSizeX},${data.redSizeY},,${data.redCountX},${data.redCountY},,${data.redGapX},${data.redGapY}`,
    'g_size_x,g_size_y,,g_count_x,g_count_y,,g_gap_x,g_gap_y',
    `${data.greenSizeX},${data.greenSizeY},,${data.greenCountX},${data.greenCountY},,${data.greenGapX},${data.greenGapY}`,
    'b_size_x,b_size_y,,b_count_x,b_count_y,,b_gap_x,b_gap_y',
    `${data.blueSizeX},${data.blueSizeY},,${data.blueCountX},${data.blueCountY},,${data.blueGapX},${data.blueGapY}`,
    '',
  ];

  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `pattern-${data.generationUuid}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 취소 아이콘
const CancelIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M18 6L6 18M6 6L18 18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// CSV 아이콘
const CsvIcon = () => (
  <Image
    src="/csvlogo.png"
    alt="CSV"
    width={36}
    height={36}
    className="inline-block"
  />
);

export default function PatternTable() {
  const [bmpList, setBmpList] = useState<BmpListItem[]>([]);
  const [page, setPage] = useState(0); // API는 0부터 시작
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedUuid, setExpandedUuid] = useState<string | null>(null);
  const [detailDataMap, setDetailDataMap] = useState<Record<string, BmpDetailResult>>({});
  const [loadingUuids, setLoadingUuids] = useState<Set<string>>(new Set());

  // API에서 목록 조회
  const fetchBmpList = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getBmpList({ page, size: pageSize });
      if (response.isSuccess && response.result) {
        // 생성일시 기준 내림차순 정렬 (최신이 위로)
        const sortedList = [...response.result.content].sort((a, b) => {
          const dateA = new Date(a.requestedAt).getTime();
          const dateB = new Date(b.requestedAt).getTime();
          return dateB - dateA; // 내림차순
        });
        setBmpList(sortedList);
        setTotalPages(response.result.pagination.totalPages);
        setTotalElements(response.result.pagination.totalElements);
      }
    } catch (error) {
      console.error('목록 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchBmpList();
  }, [fetchBmpList]);

  // 페이지 변경 시 스크롤 초기화 (새 항목이 위에 보이도록)
  useEffect(() => {
    if (page === 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [page]);

  // 외부에서 새로고침할 수 있도록 이벤트 리스너 등록
  useEffect(() => {
    const handleRefresh = (event?: CustomEvent) => {
      // 새로 생성된 경우 첫 페이지로 이동하고 목록 새로고침
      if (event?.detail?.resetPage) {
        if (page !== 0) {
          setPage(0);
        } else {
          // 이미 첫 페이지에 있으면 바로 새로고침
          fetchBmpList();
        }
      } else {
        fetchBmpList();
      }
    };
    
    window.addEventListener('refreshBmpList', handleRefresh as EventListener);
    
    return () => {
      window.removeEventListener('refreshBmpList', handleRefresh as EventListener);
    };
  }, [page, fetchBmpList]);

  const formatKST = useMemo(() => {
    const toStr = (iso: string) => {
      // API에서 받은 시간 문자열 처리
      // ISO 8601 형식이면 그대로 사용, 타임존 정보가 없으면 UTC로 간주
      let dateString = iso.trim();
      
      // 이미 타임존 정보가 있는지 확인 (Z, +, -)
      const hasTimezone = dateString.includes('Z') || 
                          dateString.includes('+') || 
                          (dateString.match(/[-+]\d{2}:\d{2}$/) !== null);
      
      // 타임존 정보가 없으면 UTC로 간주 (Z 추가)
      if (!hasTimezone && dateString.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
        dateString = dateString + 'Z';
      }
      
      const d = new Date(dateString);
      
      // 유효한 날짜인지 확인
      if (isNaN(d.getTime())) {
        console.warn('Invalid date string:', iso);
        return iso; // 변환 실패 시 원본 반환
      }
      
      // UTC 시간을 한국 시간(Asia/Seoul)으로 변환
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
      
      const parts = formatter.formatToParts(d).reduce<Record<string, string>>((acc, p) => {
        if (p.type !== 'literal') acc[p.type] = p.value;
        return acc;
      }, {});
      
      return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
    };
    return toStr;
  }, []);

  const handlePageChange = (p: number) => {
    setPage(p - 1); // API는 0부터 시작, UI는 1부터 시작
  };

  const handleRowClick = async (item: BmpListItem) => {
    const uuid = item.generationUuid;
    
    // 이미 펼쳐져 있으면 접기
    if (expandedUuid === uuid) {
      setExpandedUuid(null);
      return;
    }
    
    // 펼치기
    setExpandedUuid(uuid);
    
    // 이미 로드된 데이터가 있으면 다시 조회하지 않음
    if (detailDataMap[uuid]) {
      return;
    }
    
    // 상세 정보 조회
    try {
      setLoadingUuids(prev => new Set(prev).add(uuid));
      const response = await getBmpDetail(uuid);
      if (response.isSuccess && response.result) {
        setDetailDataMap(prev => ({ ...prev, [uuid]: response.result! }));
      }
    } catch (error) {
      console.error('상세 조회 실패:', error);
    } finally {
      setLoadingUuids(prev => {
        const next = new Set(prev);
        next.delete(uuid);
        return next;
      });
    }
  };

  const getJobNumber = (idx: number) => {
    return totalElements - (page * pageSize + idx);
  };

  const getStatus = (item: BmpListItem) => {
    return item.isGenerated ? '완료' : '진행';
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-3">목록</h2>

      <CommonContainerBox className="p-6">
        {/* 데스크톱: 표 */}
        <div className="hidden md:block">
          <CommonTableFrame
            header={(
              <thead className="bg-gray-50">
                <tr className="text-gray-700">
                  <th className="text-center font-semibold text-xs tracking-wide py-2 px-3">No.</th>
                  <th className="text-center font-semibold text-xs tracking-wide py-2 px-3">생성일시</th>
                  <th className="text-center font-semibold text-xs tracking-wide py-2 px-3">이미지 크기</th>
                  <th className="text-center font-semibold text-xs tracking-wide py-2 px-3">상태</th>
                  <th className="text-center font-semibold text-xs tracking-wide py-2 px-3">담당자</th>
                  <th className="text-center font-semibold text-xs tracking-wide py-2 px-3">시작시각</th>
                  <th className="text-center font-semibold text-xs tracking-wide py-2 px-3">완료시간</th>
                  <th className="text-center font-semibold text-xs tracking-wide py-2 px-3 w-[140px]">진행률</th>
                  <th className="text-center font-semibold text-xs tracking-wide py-2 px-3">작업</th>
                </tr>
              </thead>
            )}
            body={(
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="py-8 px-3 text-center text-gray-500 text-sm">
                      로딩 중...
                    </td>
                  </tr>
                ) : bmpList.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 px-3 text-center text-gray-500 text-sm">
                      생성된 작업이 없습니다.
                    </td>
                  </tr>
                ) : (
                  bmpList.map((item, idx) => {
                    const status = getStatus(item);
                    const progress = item.isGenerated ? 100 : 0;
                    const isExpanded = expandedUuid === item.generationUuid;
                    const detailData = detailDataMap[item.generationUuid];
                    const isLoadingDetail = loadingUuids.has(item.generationUuid);
                    return (
                      <React.Fragment key={item.generationUuid}>
                        <tr 
                          className={`cursor-pointer odd:bg-white even:bg-gray-50 hover:bg-gray-100 ${isExpanded ? 'bg-blue-50' : ''}`}
                          onClick={() => handleRowClick(item)}
                        >
                          <td className="py-2 px-3 text-center text-gray-600">{getJobNumber(idx)}</td>
                          <td className="py-2 px-3 text-center text-gray-800">{formatKST(item.requestedAt)}</td>
                          <td className="py-2 px-3 text-center text-gray-800">{item.bmpWidth}×{item.bmpHeight}</td>
                          <td className="py-2 px-3 text-center">
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${
                              status === '진행' 
                                ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                : 'bg-gray-100 text-gray-700 border-gray-200'
                            }`}>
                              {status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center text-gray-800">{item.userName}</td>
                          <td className="py-2 px-3 text-center text-gray-800">{formatKST(item.requestedAt).split(' ')[1]}</td>
                          <td className="py-2 px-3 text-center text-gray-800">
                            {item.completedAt ? formatKST(item.completedAt).split(' ')[1] : '-'}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <div className="relative w-full h-4 rounded bg-gray-200 overflow-hidden">
                              <div className={`h-full bg-[#2E7BEF]`} style={{ width: `${progress}%` }} />
                              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white">
                                {`${progress}%`}
                              </span>
                            </div>
                          </td>
                          <td 
                            className="py-2 px-3 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {status === '진행' ? (
                              <a href="#" className="text-gray-600 hover:underline text-sm flex items-center justify-center gap-1">
                                <CancelIcon />
                                취소
                              </a>
                            ) : (
                              <a 
                                href={item.bmpUrl} 
                                download
                                className="text-blue-600 hover:underline text-sm"
                                onClick={(e) => e.stopPropagation()}
                              >
                                다운로드
                              </a>
                            )}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={9} className="p-0 bg-gray-50">
                              <div className="p-6 space-y-4">
                                {isLoadingDetail ? (
                                  <div className="text-center py-8 text-gray-500">로딩 중...</div>
                                ) : detailData ? (
                                  <>
                                    
                                    <CommonContainerBox className="p-4">
                                      <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-lg font-semibold text-gray-800">패턴 파라미터</h3>
                                        <button
                                          onClick={() => exportToCSV(detailData)}
                                          className="text-blue-600 hover:underline text-sm cursor-pointer flex items-center"
                                        >
                                          <CsvIcon />
                                          내보내기
                                        </button>
                                      </div>
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-sm border-collapse">
                                          <thead>
                                            <tr className="border-b border-gray-200">
                                              <th className="text-left py-2 px-0 font-semibold text-gray-700"></th>
                                              <th className="text-center py-2 px-3 font-semibold text-gray-700">이미지 크기</th>
                                              <th className="text-center py-2 px-3 font-semibold text-gray-700">R-G 간격</th>
                                              <th className="text-center py-2 px-3 font-semibold text-gray-700">G-B 간격</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            <tr className="border-b border-gray-100">
                                              <td className="py-2 px-0 font-semibold text-gray-700"></td>
                                              <td className="py-2 px-3 text-center text-gray-700">
                                                W: {detailData.bmpWidth} × H: {detailData.bmpHeight}
                                              </td>
                                              <td className="py-2 px-3 text-center text-gray-600">
                                                W: {detailData.rgGap}
                                              </td>
                                              <td className="py-2 px-3 text-center text-gray-600">
                                                W: {detailData.gbGap}
                                              </td>
                                            </tr>
                                            <tr className="border-b border-gray-200">
                                              <th className="text-left py-2 px-0 font-semibold text-gray-700">채널</th>
                                              <th className="text-center py-2 px-0 font-semibold text-gray-700">크기</th>
                                              <th className="text-center py-2 px-0 font-semibold text-gray-700">개수</th>
                                              <th className="text-center py-2 px-0 font-semibold text-gray-700">간격</th>
                                            </tr>
                                            <tr className="border-b border-gray-100">
                                              <td className="py-2 px-0 font-semibold text-gray-700">R</td>
                                              <td className="py-2 px-0 text-center text-gray-600">
                                                X: {detailData.redSizeX} × Y: {detailData.redSizeY}
                                              </td>
                                              <td className="py-2 px-0 text-center text-gray-600">
                                                X: {detailData.redCountX} × Y: {detailData.redCountY}
                                              </td>
                                              <td className="py-2 px-0 text-center text-gray-600">
                                                X: {detailData.redGapX} × Y: {detailData.redGapY}
                                              </td>
                                            </tr>
                                            <tr className="border-b border-gray-100">
                                              <td className="py-2 px-0 font-semibold text-gray-700">G</td>
                                              <td className="py-2 px-0 text-center text-gray-600">
                                                X: {detailData.greenSizeX} × Y: {detailData.greenSizeY}
                                              </td>
                                              <td className="py-2 px-0 text-center text-gray-600">
                                                X: {detailData.greenCountX} × Y: {detailData.greenCountY}
                                              </td>
                                              <td className="py-2 px-0 text-center text-gray-600">
                                                X: {detailData.greenGapX} × Y: {detailData.greenGapY}
                                              </td>
                                            </tr>
                                            <tr className="border-b border-gray-100">
                                              <td className="py-2 px-0 font-semibold text-gray-700">B</td>
                                              <td className="py-2 px-0 text-center text-gray-600">
                                                X: {detailData.blueSizeX} × Y: {detailData.blueSizeY}
                                              </td>
                                              <td className="py-2 px-0 text-center text-gray-600">
                                                X: {detailData.blueCountX} × Y: {detailData.blueCountY}
                                              </td>
                                              <td className="py-2 px-0 text-center text-gray-600">
                                                X: {detailData.blueGapX} × Y: {detailData.blueGapY}
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </div>
                                    </CommonContainerBox>
                                  </>
                                ) : (
                                  <div className="text-center py-8 text-gray-500">상세 정보를 불러올 수 없습니다.</div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            )}
          />
        </div>

        {/* 모바일: 카드 리스트 */}
        <div className="md:hidden space-y-3">
          {isLoading ? (
            <div className="text-center text-gray-500 text-sm py-8">로딩 중...</div>
          ) : bmpList.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-8">생성된 작업이 없습니다.</div>
          ) : (
            bmpList.map((item, i) => {
              const status = getStatus(item);
              const progress = item.isGenerated ? 100 : 0;
              const isExpanded = expandedUuid === item.generationUuid;
              const detailData = detailDataMap[item.generationUuid];
              const isLoadingDetail = loadingUuids.has(item.generationUuid);
              return (
                <div key={item.generationUuid}>
                  <div 
                    className={`border rounded-lg p-3 text-sm bg-white cursor-pointer ${isExpanded ? 'bg-blue-50' : ''}`}
                    onClick={() => handleRowClick(item)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">#{getJobNumber(i)}</span>
                      <span className={`text-xs ${status === '진행' ? 'text-blue-600' : 'text-gray-600'}`}>{status}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-gray-700">
                      <div>
                        <span className="text-gray-500">생성일시</span>
                        <div>{formatKST(item.requestedAt)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">이미지 크기</span>
                        <div>{item.bmpWidth}×{item.bmpHeight}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">담당자</span>
                        <div>{item.userName}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">완료일시</span>
                        <div>{item.completedAt ? formatKST(item.completedAt) : '-'}</div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className={`h-2 rounded-full ${status === '진행' ? 'bg-blue-400' : 'bg-blue-600'}`} style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                    <div 
                      className="mt-3 flex justify-end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {status === '진행' ? (
                        <a href="#" className="text-gray-600 hover:underline text-sm">취소</a>
                      ) : (
                        <a 
                          href={item.bmpUrl} 
                          download
                          className="text-blue-600 hover:underline text-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          다운로드
                        </a>
                      )}
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="mt-2 border rounded-lg p-4 bg-gray-50 text-sm">
                      {isLoadingDetail ? (
                        <div className="text-center py-8 text-gray-500">로딩 중...</div>
                      ) : detailData ? (
                        <>
                          <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-800">작업 상세 정보</h3>
                            <div className="flex gap-3">
                              {detailData.isGenerated && detailData.bmpUrl && (
                                <a
                                  href={detailData.bmpUrl}
                                  download
                                  className="text-blue-600 hover:underline text-sm"
                                >
                                  다운로드
                                </a>
                              )}
                              <button
                                onClick={() => exportToCSV(detailData)}
                                className="text-blue-600 hover:underline text-sm cursor-pointer flex items-center gap-1.5"
                              >
                                <CsvIcon />
                                내보내기
                              </button>
                            </div>
                          </div>
                          <CommonContainerBox className="p-4 mb-3">
                            <div className="space-y-3 text-sm">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <span className="text-gray-500">상태</span>
                                  <div className="font-medium text-gray-800">
                                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${
                                      detailData.isGenerated 
                                        ? 'bg-gray-100 text-gray-700 border-gray-200' 
                                        : 'bg-blue-50 text-blue-700 border-blue-200'
                                    }`}>
                                      {detailData.isGenerated ? '완료' : '진행'}
                                    </span>
                                  </div>
                                </div>
                                <div>
                                  <span className="text-gray-500">이미지 용량</span>
                                  <div className="font-medium text-gray-800">{detailData.bmpVolume}</div>
                                </div>
                                <div>
                                  <span className="text-gray-500">요청일시</span>
                                  <div className="font-medium text-gray-800">{formatKST(detailData.requestedAt)}</div>
                                </div>
                                <div>
                                  <span className="text-gray-500">완료일시</span>
                                  <div className="font-medium text-gray-800">
                                    {detailData.completedAt ? formatKST(detailData.completedAt) : '-'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CommonContainerBox>
                          <CommonContainerBox className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-lg font-semibold text-gray-800">패턴 파라미터</h3>
                              <button
                                onClick={() => exportToCSV(detailData)}
                                className="text-blue-600 hover:underline text-sm cursor-pointer flex items-center gap-1.5"
                              >
                                <CsvIcon />
                                내보내기
                              </button>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm border-collapse">
                                <thead>
                                  <tr className="border-b border-gray-200">
                                    <th className="text-left py-2 px-0 font-semibold text-gray-700"></th>
                                    <th className="text-center py-2 px-3 font-semibold text-gray-700">이미지 크기</th>
                                    <th className="text-center py-2 px-3 font-semibold text-gray-700">R-G 간격</th>
                                    <th className="text-center py-2 px-3 font-semibold text-gray-700">G-B 간격</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr className="border-b border-gray-100">
                                    <td className="py-2 px-0 font-semibold text-gray-700"></td>
                                    <td className="py-2 px-3 text-center text-gray-700">
                                      W: {detailData.bmpWidth} × H: {detailData.bmpHeight}
                                    </td>
                                    <td className="py-2 px-3 text-center text-gray-600">
                                      W: {detailData.rgGap}
                                    </td>
                                    <td className="py-2 px-3 text-center text-gray-600">
                                      W: {detailData.gbGap}
                                    </td>
                                  </tr>
                                  <tr className="border-b border-gray-200">
                                    <th className="text-left py-2 px-0 font-semibold text-gray-700">채널</th>
                                    <th className="text-center py-2 px-0 font-semibold text-gray-700">크기</th>
                                    <th className="text-center py-2 px-0 font-semibold text-gray-700">개수</th>
                                    <th className="text-center py-2 px-0 font-semibold text-gray-700">간격</th>
                                  </tr>
                                  <tr className="border-b border-gray-100">
                                    <td className="py-2 px-0 font-semibold text-gray-700">R</td>
                                    <td className="py-2 px-0 text-center text-gray-600">
                                      X: {detailData.redSizeX} × Y: {detailData.redSizeY}
                                    </td>
                                    <td className="py-2 px-0 text-center text-gray-600">
                                      X: {detailData.redCountX} × Y: {detailData.redCountY}
                                    </td>
                                    <td className="py-2 px-0 text-center text-gray-600">
                                      X: {detailData.redGapX} × Y: {detailData.redGapY}
                                    </td>
                                  </tr>
                                  <tr className="border-b border-gray-100">
                                    <td className="py-2 px-0 font-semibold text-gray-700">G</td>
                                    <td className="py-2 px-0 text-center text-gray-600">
                                      X: {detailData.greenSizeX} × Y: {detailData.greenSizeY}
                                    </td>
                                    <td className="py-2 px-0 text-center text-gray-600">
                                      X: {detailData.greenCountX} × Y: {detailData.greenCountY}
                                    </td>
                                    <td className="py-2 px-0 text-center text-gray-600">
                                      X: {detailData.greenGapX} × Y: {detailData.greenGapY}
                                    </td>
                                  </tr>
                                  <tr className="border-b border-gray-100">
                                    <td className="py-2 px-0 font-semibold text-gray-700">B</td>
                                    <td className="py-2 px-0 text-center text-gray-600">
                                      X: {detailData.blueSizeX} × Y: {detailData.blueSizeY}
                                    </td>
                                    <td className="py-2 px-0 text-center text-gray-600">
                                      X: {detailData.blueCountX} × Y: {detailData.blueCountY}
                                    </td>
                                    <td className="py-2 px-0 text-center text-gray-600">
                                      X: {detailData.blueGapX} × Y: {detailData.blueGapY}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </CommonContainerBox>
                        </>
                      ) : (
                        <div className="text-center py-8 text-gray-500">상세 정보를 불러올 수 없습니다.</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 페이지네이션: 공통 컴포넌트 사용 */}
        {!isLoading && totalPages > 1 && (
          <CommonPagination currentPage={page + 1} totalPages={totalPages} onChange={handlePageChange} />
        )}
      </CommonContainerBox>
    </div>
  );
}

