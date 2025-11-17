import React, { useCallback, useEffect, useMemo, useState } from 'react';
import CommonModal from '@/components/ui/CommonModal';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import CommonButton from '@/components/ui/CommonButton';
import { getBmpDetail, getBmpList } from '@/service/imageGenerator';
import type { BmpDetailResult, BmpListItem } from '@/types/imageGenerator';

interface AssignmentTargetInfo {
  motherGlassName: string;
  printerName: string;
  modelName: string;
  assignedSheets: number;
}

interface BmpImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (detail: BmpDetailResult) => void;
  targetInfo?: AssignmentTargetInfo | null;
  preselectedDetail?: BmpDetailResult | null;
}

function formatKst(datetime: string) {
  if (!datetime) return '-';

  const hasTimezone = /[Zz]|[+-]\d{2}:\d{2}$/.test(datetime);
  const normalized = hasTimezone ? datetime : `${datetime}Z`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return datetime;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

export default function BmpImportModal({
  isOpen,
  onClose,
  onSelect,
  targetInfo,
  preselectedDetail = null,
}: BmpImportModalProps) {
  const [bmpList, setBmpList] = useState<BmpListItem[]>([]);
  const [isListLoading, setIsListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const [detail, setDetail] = useState<BmpDetailResult | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 7;

  const hasTarget = Boolean(targetInfo);

  const headerDescription = useMemo(() => {
    if (!targetInfo) {
      return '생성 내역을 선택해 설비에 매칭하세요.';
    }
    return `${targetInfo.motherGlassName} · ${targetInfo.printerName} (${targetInfo.modelName})`;
  }, [targetInfo]);

  const fetchList = useCallback(async () => {
    try {
      setIsListLoading(true);
      setListError(null);
      const response = await getBmpList({ page: 0, size: 200 });
      if (response.isSuccess && response.result) {
        const sorted = [...response.result.content].sort((a, b) => {
          const aTime = new Date(a.requestedAt).getTime();
          const bTime = new Date(b.requestedAt).getTime();
          return bTime - aTime;
        });
        setBmpList(sorted);
        setCurrentPage(1);
      } else {
        setListError(response.message ?? '이미지 목록을 가져오지 못했습니다.');
      }
    } catch (error) {
      console.error('BMP 목록 조회 실패:', error);
      setListError(error instanceof Error ? error.message : '이미지 목록 조회 중 오류가 발생했습니다.');
    } finally {
      setIsListLoading(false);
    }
  }, []);

  const fetchDetail = useCallback(async (uuid: string) => {
    try {
      setIsDetailLoading(true);
      setDetailError(null);
      const response = await getBmpDetail(uuid);
      if (response.isSuccess && response.result) {
        setDetail(response.result);
      } else {
        setDetail(null);
        setDetailError(response.message ?? '상세 정보를 가져오지 못했습니다.');
      }
    } catch (error) {
      console.error('BMP 상세 조회 실패:', error);
      setDetail(null);
      setDetailError(error instanceof Error ? error.message : '상세 조회 중 오류가 발생했습니다.');
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    fetchList();
  }, [isOpen, fetchList]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedUuid(null);
      setDetail(null);
      setDetailError(null);
      return;
    }
    if (preselectedDetail) {
      setSelectedUuid(preselectedDetail.generationUuid);
      setDetail(preselectedDetail);
    }
  }, [isOpen, preselectedDetail]);

  useEffect(() => {
    if (!isOpen || !preselectedDetail || bmpList.length === 0) {
      return;
    }
    const index = bmpList.findIndex((item) => item.generationUuid === preselectedDetail.generationUuid);
    if (index !== -1) {
      const page = Math.floor(index / ITEMS_PER_PAGE) + 1;
      setCurrentPage(page);
      setSelectedUuid(preselectedDetail.generationUuid);
      setDetail(preselectedDetail);
    }
  }, [bmpList, isOpen, preselectedDetail]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(bmpList.length / ITEMS_PER_PAGE));
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [bmpList, currentPage]);

  useEffect(() => {
    if (selectedUuid) {
      fetchDetail(selectedUuid);
    } else {
      setDetail(null);
    }
  }, [selectedUuid, fetchDetail]);

  const handleSelectRow = (uuid: string) => {
    setSelectedUuid((prev) => (prev === uuid ? null : uuid));
  };

  const handleApply = () => {
    if (detail) {
      onSelect(detail);
    }
  };

  const printablePixels = useMemo(() => {
    if (!detail) {
      return null;
    }
    const red = detail.redCountX * detail.redCountY * detail.redSizeX * detail.redSizeY;
    const green = detail.greenCountX * detail.greenCountY * detail.greenSizeX * detail.greenSizeY;
    const blue = detail.blueCountX * detail.blueCountY * detail.blueSizeX * detail.blueSizeY;
    return {
      red,
      green,
      blue,
      total: red + green + blue,
    };
  }, [detail]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(bmpList.length / ITEMS_PER_PAGE)), [bmpList]);

  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return bmpList.slice(start, start + ITEMS_PER_PAGE);
  }, [bmpList, currentPage]);

  return (
    <CommonModal isOpen={isOpen} onClose={onClose} className="w-full max-w-5xl max-h-[90vh]" topOffset={64}>
      <div className="flex max-h-[80vh] flex-col gap-6 overflow-y-auto pr-1">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <h3 className="text-xl font-semibold text-gray-900">이미지 가져오기</h3>
            <span className="text-base text-gray-500">{headerDescription}</span>
          </div>
        </div>

        <CommonContainerBox className="px-4 py-4">
          <div className="flex flex-col gap-4 md:flex-row" style={{ minHeight: '400px', maxHeight: 'calc(80vh - 200px)' }}>
            <div className="md:w-1/2 md:border-r md:border-gray-100 md:pr-4 md:mr-4 flex flex-col">
              <div className="mb-3 flex items-center justify-between flex-shrink-0">
                <span className="text-base font-semibold text-gray-900">생성 내역</span>
                <button
                  type="button"
                  onClick={fetchList}
                  className="rounded-md border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 hover:border-gray-300 hover:text-gray-900"
                  disabled={isListLoading}
                >
                  새로고침
                </button>
              </div>
              <div className="flex-1 min-h-[320px] space-y-2 overflow-y-auto pr-1">
                {isListLoading ? (
                  <div className="flex h-full items-center justify-center text-sm text-gray-500">목록을 불러오는 중입니다…</div>
                ) : listError ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{listError}</div>
                  </div>
                ) : bmpList.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-gray-500">생성 내역이 없습니다.</div>
                ) : (
                  paginatedList.map((item) => {
                    const isSelected = selectedUuid === item.generationUuid;
                    return (
                      <button
                        key={item.generationUuid}
                        type="button"
                        onClick={() => handleSelectRow(item.generationUuid)}
                        className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                          isSelected ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white hover:border-blue-200'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="font-semibold text-[13px] text-gray-900">
                            {item.completedAt ? formatKst(item.completedAt) : '생성 중'}
                          </span>
                          <span>크기 {item.bmpWidth.toLocaleString()} × {item.bmpHeight.toLocaleString()}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {bmpList.length > 0 && (
                <div className="mt-3 flex items-center justify-center gap-3 text-xs text-gray-600 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="rounded-md border border-gray-200 px-2 py-1 hover:border-gray-300 disabled:cursor-not-allowed disabled:text-gray-400"
                  >
                    이전
                  </button>
                  <span>
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-md border border-gray-200 px-2 py-1 hover:border-gray-300 disabled:cursor-not-allowed disabled:text-gray-400"
                  >
                    다음
                  </button>
                </div>
              )}
            </div>

            <div className="md:w-1/2 flex flex-col">
              <div className="mb-3 flex items-center justify-between flex-shrink-0">
                <div>
                  <span className="text-base font-semibold text-gray-900">상세 정보</span>
                </div>
                {detail?.bmpUrl ? (
                  <a
                    href={detail.bmpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-md border border-blue-200 px-3 py-1 text-xs font-medium text-blue-600 hover:border-blue-300 hover:bg-blue-50"
                  >
                    원본 보기
                  </a>
                ) : (
                  <span className="text-xs text-gray-400">원본 미확인</span>
                )}
              </div>
              <div className="flex-1 min-h-[320px] rounded-lg border border-gray-200 bg-gray-50 p-4 overflow-y-auto">
                {isDetailLoading ? (
                  <div className="flex h-32 items-center justify-center text-sm text-gray-500">상세 정보를 불러오는 중입니다…</div>
                ) : detailError ? (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{detailError}</div>
                ) : detail ? (
                  <div className="text-sm text-gray-700">
                    <div className="rounded-md bg-white p-3 text-xs text-gray-600">
                      <table className="w-full table-fixed text-[13px]">
                        <thead>
                          <tr className="text-gray-500">
                            <th className="py-1 text-left font-semibold">색상</th>
                            <th className="py-1 text-left font-semibold">배열 개수</th>
                            <th className="py-1 text-left font-semibold">픽셀 크기</th>
                          </tr>
                        </thead>
                        <tbody className="text-gray-700">
                          <tr>
                            <td className="py-1 text-rose-600 font-medium">Red</td>
                            <td className="py-1">{detail.redCountX} × {detail.redCountY}</td>
                            <td className="py-1">{detail.redSizeX} / {detail.redSizeY}</td>
                          </tr>
                          <tr>
                            <td className="py-1 text-green-600 font-medium">Green</td>
                            <td className="py-1">{detail.greenCountX} × {detail.greenCountY}</td>
                            <td className="py-1">{detail.greenSizeX} / {detail.greenSizeY}</td>
                          </tr>
                          <tr>
                            <td className="py-1 text-blue-600 font-medium">Blue</td>
                            <td className="py-1">{detail.blueCountX} × {detail.blueCountY}</td>
                            <td className="py-1">{detail.blueSizeX} / {detail.blueSizeY}</td>
                          </tr>
                          <tr>
                            <td className="py-1 text-gray-500 font-medium">RG Gap</td>
                            <td className="py-1" colSpan={2}>{detail.rgGapX} / {detail.rgGapY}</td>
                          </tr>
                          <tr>
                            <td className="py-1 text-gray-500 font-medium">GB Gap</td>
                            <td className="py-1" colSpan={2}>{detail.gbGapX} / {detail.gbGapY}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <table className="w-full table-fixed border-separate border-spacing-y-2 text-[13px]">
                      <tbody>
                        <tr className="bg-white">
                          <th className="w-[30%] rounded-l-md bg-gray-100 px-3 py-2 text-left text-xs font-semibold text-gray-500">이미지 크기</th>
                          <td className="rounded-r-md bg-white px-3 py-2 text-sm font-medium text-gray-900">
                            {detail.bmpWidth.toLocaleString()} × {detail.bmpHeight.toLocaleString()}
                          </td>
                        </tr>
                        <tr className="bg-white">
                          <th className="w-[80%] rounded-l-md bg-gray-100 px-3 py-2 align-top text-left text-xs font-semibold text-gray-500">
                            실제 인쇄 픽셀 수
                          </th>
                          <td className="rounded-r-md bg-white px-3 py-2 text-sm font-medium text-gray-900">
                            <div>{printablePixels ? printablePixels.total.toLocaleString() : '-'}</div>
                            {printablePixels && (
                              <div className="mt-1 text-xs text-gray-500">
                                Red {printablePixels.red.toLocaleString()} · Green {printablePixels.green.toLocaleString()} · Blue {printablePixels.blue.toLocaleString()}
                              </div>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex h-32 items-center justify-center text-sm text-gray-500">이미지를 선택하면 상세 정보가 표시됩니다.</div>
                )}
              </div>
            </div>
          </div>
        </CommonContainerBox>

        <div className="sticky bottom-0 flex justify-end bg-white pt-2 pb-2 mt-2">
          <CommonButton
            variant="blue"
            onClick={handleApply}
            disabled={!detail || !hasTarget}
            className="px-4 py-2 text-sm font-semibold"
          >
            적용
          </CommonButton>
        </div>
      </div>
    </CommonModal>
  );
}
