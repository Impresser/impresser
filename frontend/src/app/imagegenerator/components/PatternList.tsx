'use client';

import React, { useMemo, useState, useEffect } from 'react';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import CommonPagination from '@/components/ui/CommonPagination';
import CommonModal from '@/components/ui/CommonModal';
import CommonButton from '@/components/ui/CommonButton';
import { getBmpList, getBmpDetail } from '@/service/imageGenerator';
import { BmpListItem, BmpDetailResult } from '@/types/imageGenerator';

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

export default function PatternTable() {
  const [bmpList, setBmpList] = useState<BmpListItem[]>([]);
  const [page, setPage] = useState(0); // API는 0부터 시작
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BmpListItem | null>(null);
  const [detailData, setDetailData] = useState<BmpDetailResult | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // API에서 목록 조회
  const fetchBmpList = async () => {
    try {
      setIsLoading(true);
      const response = await getBmpList({ page, size: pageSize });
      if (response.isSuccess && response.result) {
        setBmpList(response.result.content);
        setTotalPages(response.result.pagination.totalPages);
        setTotalElements(response.result.pagination.totalElements);
      }
    } catch (error) {
      console.error('목록 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBmpList();
  }, [page]);

  // 외부에서 새로고침할 수 있도록 이벤트 리스너 등록
  useEffect(() => {
    const handleRefresh = () => {
      fetchBmpList();
    };
    
    window.addEventListener('refreshBmpList', handleRefresh);
    
    return () => {
      window.removeEventListener('refreshBmpList', handleRefresh);
    };
  }, [page]);

  const formatKST = useMemo(() => {
    const toStr = (iso: string) => {
      const d = new Date(iso);
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
    setSelectedItem(item);
    setDetailData(null);
    
    // 상세 정보 조회
    try {
      setIsLoadingDetail(true);
      const response = await getBmpDetail(item.generationUuid);
      if (response.isSuccess && response.result) {
        setDetailData(response.result);
      }
    } catch (error) {
      console.error('상세 조회 실패:', error);
    } finally {
      setIsLoadingDetail(false);
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
      <h2 className="text-lg font-semibold text-gray-800 mb-4">목록</h2>

      <CommonContainerBox className="p-6">
        {/* 데스크톱: 표 */}
        <div className="hidden md:block">
          <div className="overflow-hidden rounded-md border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-gray-700">
                  <th className="text-center font-semibold text-xs tracking-wide py-2 px-3">No.</th>
                  <th className="text-center font-semibold text-xs tracking-wide py-2 px-3">생성일시</th>
                  <th className="text-center font-semibold text-xs tracking-wide py-2 px-3">이미지 크기</th>
                  <th className="text-center font-semibold text-xs tracking-wide py-2 px-3">상태</th>
                  <th className="text-center font-semibold text-xs tracking-wide py-2 px-3">담당자</th>
                  <th className="text-center font-semibold text-xs tracking-wide py-2 px-3">시작시각</th>
                  <th className="text-center font-semibold text-xs tracking-wide py-2 px-3">예상시간</th>
                  <th className="text-center font-semibold text-xs tracking-wide py-2 px-3">경과시간</th>
                  <th className="text-center font-semibold text-xs tracking-wide py-2 px-3 w-[140px]">진행률</th>
                  <th className="text-center font-semibold text-xs tracking-wide py-2 px-3">작업</th>
                </tr>
              </thead>

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
                    return (
                      <tr 
                        key={item.generationUuid} 
                        className={`cursor-pointer odd:bg-white even:bg-gray-50 hover:bg-gray-100`}
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
                        <td className="py-2 px-3 text-center text-gray-800">-</td>
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
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
              return (
                <div 
                  key={item.generationUuid} 
                  className="border rounded-lg p-3 text-sm bg-white cursor-pointer"
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
              );
            })
          )}
        </div>

        {/* 페이지네이션: 공통 컴포넌트 사용 */}
        {!isLoading && totalPages > 1 && (
          <CommonPagination currentPage={page + 1} totalPages={totalPages} onChange={handlePageChange} />
        )}
      </CommonContainerBox>

      {/* 작업 상세 모달 */}
      <CommonModal 
        isOpen={selectedItem !== null} 
        onClose={() => {
          setSelectedItem(null);
          setDetailData(null);
        }}
        className="min-w-[600px] max-w-[650px] overflow-visible"
        style={{ maxHeight: 'none', overflow: 'visible' }}
      >
        {selectedItem && (
          <div className="space-y-2">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-800">작업 상세 정보</h2>
              {detailData?.isGenerated && detailData?.bmpUrl && (
                <a
                  href={detailData.bmpUrl}
                  download
                  className="text-blue-600 hover:underline text-sm"
                >
                  다운로드
                </a>
              )}
            </div>
            
            {isLoadingDetail ? (
              <div className="text-center py-8 text-gray-500">로딩 중...</div>
            ) : detailData ? (
              <>
                <CommonContainerBox className="p-4">
                  <div className="space-y-3 text-sm">
                    {/* 첫 번째 줄: UUID, 상태, 이미지 크기, 이미지 용량 */}
                    <div className="grid grid-cols-5 gap-4">
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
                      {detailData.bmpUrl && (
                        <div className="">
                          <span className="text-gray-500">이미지 URL</span>
                          <div className="font-medium text-gray-800 break-all">
                            <a href={detailData.bmpUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {detailData.bmpUrl}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CommonContainerBox>

                {/* 채널별 파라미터 */}
                <CommonContainerBox className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">패턴 파라미터</h3>
                  <div className="space-y-3">
                    {/* 이미지 크기 및 간격 */}
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 whitespace-nowrap">이미지 크기</span>
                        <span className="font-medium text-gray-800">
                          W: {detailData.bmpWidth} × H: {detailData.bmpHeight}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 whitespace-nowrap">R-G 간격</span>
                        <span className="font-medium text-gray-800">
                          {detailData.rgGap}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 whitespace-nowrap">G-B 간격</span>
                        <span className="font-medium text-gray-800">
                          {detailData.gbGap}
                        </span>
                      </div>
                    </div>

                    {/* 채널별 파라미터 테이블 */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-0 font-semibold text-gray-700">채널</th>
                            <th className="text-center py-2 px-0 font-semibold text-gray-700">크기</th>
                            <th className="text-center py-2 px-0 font-semibold text-gray-700">개수</th>
                            <th className="text-center py-2 px-0 font-semibold text-gray-700">간격</th>
                          </tr>
                        </thead>
                        <tbody>
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
                  </div>
                </CommonContainerBox>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">상세 정보를 불러올 수 없습니다.</div>
            )}

            <div className="flex justify-end">
              <CommonButton variant="gray" onClick={() => setSelectedItem(null)}>
                닫기
              </CommonButton>
            </div>
          </div>
        )}
      </CommonModal>
    </div>
  );
}
