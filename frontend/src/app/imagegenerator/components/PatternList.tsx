'use client';

import React, { useMemo, useState } from 'react';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import { usePatternJobs } from '@/app/imagegenerator/hooks/usePatternJobs';

export default function PatternTable() {
  const { jobs } = usePatternJobs();
  const [page, setPage] = useState(1);
  const pageSize = 10;

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

  const totalPages = useMemo(() => Math.max(1, Math.ceil(jobs.length / pageSize)), [jobs.length]);
  const currentJobs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return jobs.slice(start, start + pageSize);
  }, [jobs, page]);

  const canPrev = page > 1;
  const canNext = page < totalPages;
  const goPrev = () => canPrev && setPage((p) => p - 1);
  const goNext = () => canNext && setPage((p) => p + 1);
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">목록</h2>

      <CommonContainerBox className="p-6">
        {/* 데스크톱: 표 */}
        <div className="hidden md:block">
          <table className="w-full text-sm border-separate border-spacing-y-0">
            <thead>
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
              {currentJobs.map((job, idx) => (
                <tr key={job.id} className="group">
                  <td className="h-10 py-0 px-3 text-center text-gray-600 border border-gray-200 border-r-0 bg-white group-hover:bg-gray-50">{jobs.length - ((page - 1) * pageSize + idx)}</td>
                  <td className="h-10 py-0 px-3 text-center border-t border-b border-gray-200 bg-white group-hover:bg-gray-50">{formatKST(job.createdAt)}</td>
                  <td className="h-10 py-0 px-3 text-center border-t border-b border-gray-200 bg-white group-hover:bg-gray-50">{job.imageSizeLabel}</td>
                  <td className={`h-10 py-0 px-3 text-center font-medium border-t border-b border-gray-200 bg-white group-hover:bg-gray-50 ${job.status === '진행' ? 'text-blue-600' : 'text-gray-700'}`}>{job.status}</td>
                  <td className="h-10 py-0 px-3 text-center border-t border-b border-gray-200 bg-white group-hover:bg-gray-50">{job.owner}</td>
                  <td className="h-10 py-0 px-3 text-center border-t border-b border-gray-200 bg-white group-hover:bg-gray-50">{job.startTime}</td>
                  <td className="h-10 py-0 px-3 text-center border-t border-b border-gray-200 bg-white group-hover:bg-gray-50">{job.etaTime}</td>
                  <td className="h-10 py-0 px-3 text-center border-t border-b border-gray-200 bg-white group-hover:bg-gray-50">{job.elapsed}</td>
                  <td className="h-10 py-0 px-3 text-center border-t border-b border-gray-200 bg-white group-hover:bg-gray-50">
                    <div className="relative w-full h-4 rounded bg-gray-200 overflow-hidden">
                      <div className={`h-full bg-[#2E7BEF]`} style={{ width: `${job.progress}%` }} />
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white">
                        {`${job.progress}%`}
                      </span>
                    </div>
                  </td>
                  <td className="h-10 py-0 px-3 text-center border border-gray-200 border-l-0 bg-white group-hover:bg-gray-50">
                    {job.status === '진행' ? (
                      <a href="#" className="text-gray-600 hover:underline text-sm">취소</a>
                    ) : (
                      <a href="#" className="text-blue-600 hover:underline text-sm">다운로드</a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 모바일: 카드 리스트 */}
        <div className="md:hidden space-y-3">
          {currentJobs.map((job, i) => (
            <div key={job.id} className="border rounded-lg p-3 text-sm bg-white">
              <div className="flex items-center justify-between">
                <span className="font-semibold">#{jobs.length - ((page - 1) * pageSize + i)}</span>
                <span className={`text-xs ${job.status === '진행' ? 'text-blue-600' : 'text-gray-600'}`}>{job.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-gray-700">
                <div>
                  <span className="text-gray-500">생성일시</span>
                  <div>{formatKST(job.createdAt)}</div>
                </div>
                <div>
                  <span className="text-gray-500">이미지 크기</span>
                  <div>{job.imageSizeLabel}</div>
                </div>
                <div>
                  <span className="text-gray-500">담당자</span>
                  <div>{job.owner}</div>
                </div>
                <div>
                  <span className="text-gray-500">시간</span>
                  <div>시작 {job.startTime} · 예상 {job.etaTime}</div>
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`h-2 rounded-full ${job.status === '진행' ? 'bg-blue-400' : 'bg-blue-600'}`} style={{ width: `${job.progress}%` }} />
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                {job.status === '진행' ? (
                  <a href="#" className="text-gray-600 hover:underline text-sm">취소</a>
                ) : (
                  <a href="#" className="text-blue-600 hover:underline text-sm">다운로드</a>
                )}
              </div>
            </div>
          ))}
        </div>
        {jobs.length === 0 && (
          <div className="flex justify-center mt-4 text-gray-500 text-sm">
            생성된 작업이 없습니다.
          </div>
        )}

        {/* 페이지네이션: 화살표 아이콘 + 숫자 버튼 */}
        {jobs.length > 0 && totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={goPrev}
              aria-label="이전 페이지"
              className={`h-9 w-9 flex items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition ${!canPrev ? 'opacity-40 pointer-events-none' : ''}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`h-9 min-w-9 px-3 flex items-center justify-center rounded-full border transition ${
                  p === page
                    ? 'bg-[#0059FF] text-white border-transparent'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
                aria-current={p === page ? 'page' : undefined}
                aria-label={`${p} 페이지`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              onClick={goNext}
              aria-label="다음 페이지"
              className={`h-9 w-9 flex items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition ${!canNext ? 'opacity-40 pointer-events-none' : ''}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        )}
      </CommonContainerBox>
    </div>
  );
}
