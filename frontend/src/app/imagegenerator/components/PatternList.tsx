'use client';

import React, { useMemo, useState } from 'react';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import { usePatternJobs } from '@/app/imagegenerator/hooks/usePatternJobs';
import CommonPagination from '@/components/ui/CommonPagination';
import CommonModal from '@/components/ui/CommonModal';
import CommonButton from '@/components/ui/CommonButton';
import { PatternJob } from '@/store/imageGeneratorStore';

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
  const { jobs } = usePatternJobs();
  const [page, setPage] = useState(1);
  const [selectedJob, setSelectedJob] = useState<PatternJob | null>(null);
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

  const handlePageChange = (p: number) => setPage(p);
  const handleRowClick = (job: PatternJob) => {
    setSelectedJob(job);
  };

  const getJobNumber = (job: PatternJob, idx: number) => {
    return jobs.length - ((page - 1) * pageSize + idx);
  };

  const getSelectedJobNumber = (job: PatternJob) => {
    const jobIndex = jobs.findIndex(j => j.id === job.id);
    return jobIndex !== -1 ? jobs.length - jobIndex : 0;
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
                {currentJobs.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 px-3 text-center text-gray-500 text-sm">
                      생성된 작업이 없습니다.
                    </td>
                  </tr>
                ) : (
                  currentJobs.map((job, idx) => (
                    <tr 
                      key={job.id} 
                      className={`cursor-pointer odd:bg-white even:bg-gray-50 hover:bg-gray-100`}
                      onClick={() => handleRowClick(job)}
                    >
                      <td className="py-2 px-3 text-center text-gray-600">{getJobNumber(job, idx)}</td>
                      <td className="py-2 px-3 text-center text-gray-800">{formatKST(job.createdAt)}</td>
                      <td className="py-2 px-3 text-center text-gray-800">{job.imageSizeLabel}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${
                          job.status === '진행' 
                            ? 'bg-blue-50 text-blue-700 border-blue-200' 
                            : 'bg-gray-100 text-gray-700 border-gray-200'
                        }`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center text-gray-800">{job.owner}</td>
                      <td className="py-2 px-3 text-center text-gray-800">{job.startTime}</td>
                      <td className="py-2 px-3 text-center text-gray-800">{job.etaTime}</td>
                      <td className="py-2 px-3 text-center text-gray-800">{job.elapsed}</td>
                      <td className="py-2 px-3 text-center">
                        <div className="relative w-full h-4 rounded bg-gray-200 overflow-hidden">
                          <div className={`h-full bg-[#2E7BEF]`} style={{ width: `${job.progress}%` }} />
                          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white">
                            {`${job.progress}%`}
                          </span>
                        </div>
                      </td>
                      <td 
                        className="py-2 px-3 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {job.status === '진행' ? (
                          <a href="#" className="text-gray-600 hover:underline text-sm flex items-center justify-center gap-1">
                            <CancelIcon />
                            취소
                          </a>
                        ) : (
                          <a href="#" className="text-blue-600 hover:underline text-sm">다운로드</a>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 모바일: 카드 리스트 */}
        <div className="md:hidden space-y-3">
          {currentJobs.map((job, i) => (
            <div 
              key={job.id} 
              className="border rounded-lg p-3 text-sm bg-white cursor-pointer"
              onClick={() => handleRowClick(job)}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">#{getJobNumber(job, i)}</span>
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
              <div 
                className="mt-3 flex justify-end"
                onClick={(e) => e.stopPropagation()}
              >
                {job.status === '진행' ? (
                  <a href="#" className="text-gray-600 hover:underline text-sm">취소</a>
                ) : (
                  <a href="#" className="text-blue-600 hover:underline text-sm">다운로드</a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 페이지네이션: 공통 컴포넌트 사용 */}
        {jobs.length > 0 && totalPages > 1 && (
          <CommonPagination currentPage={page} totalPages={totalPages} onChange={handlePageChange} />
        )}
      </CommonContainerBox>

      {/* 작업 상세 모달 */}
      <CommonModal 
        isOpen={selectedJob !== null} 
        onClose={() => setSelectedJob(null)}
        className="min-w-[600px] max-w-[650px] overflow-visible"
        style={{ maxHeight: 'none', overflow: 'visible' }}
      >
        {selectedJob && (
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">작업 상세 정보</h2>

            {/* 입력 파라미터 상세 정보 */}
            <CommonContainerBox className="p-2">
              {/* 이미지 크기 및 간격 */}
              <div className="space-y-2 mb-3">
                <div className="grid grid-cols-3 gap-30 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">이미지 크기</span>
                    <span className="font-medium text-gray-800">
                      W: {selectedJob.form.imageSize.w || '-'} × H: {selectedJob.form.imageSize.h || '-'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">R-G 간격</span>
                    <span className="font-medium text-gray-800">
                      X: {selectedJob.form.gapRG.x || '-'} × Y: {selectedJob.form.gapRG.y || '-'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">G-B 간격</span>
                    <span className="font-medium text-gray-800">
                      X: {selectedJob.form.gapGB.x || '-'} × Y: {selectedJob.form.gapGB.y || '-'}
                    </span>
                  </div>
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
                    {(['R', 'G', 'B'] as const).map((color) => {
                      const channel = selectedJob.form.channels[color];
                      return (
                        <tr key={color} className="border-b border-gray-100">
                          <td className="py-2 px-0 font-semibold text-gray-700">{color}</td>
                          <td className="py-2 px-0 text-center text-gray-600">
                            X: {channel.size.x || '-'} × Y: {channel.size.y || '-'}
                          </td>
                          <td className="py-2 px-0 text-center text-gray-600">
                            X: {channel.count.x || '-'} × Y: {channel.count.y || '-'}
                          </td>
                          <td className="py-2 px-0 text-center text-gray-600">
                            X: {channel.spacing.x || '-'} × Y: {channel.spacing.y || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CommonContainerBox>
            {/* 작업 기본 정보 */}
            <CommonContainerBox className="p-2">
              <div className="space-y-2 text-sm">
                {/* 진행률 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {selectedJob.status === '진행' ? '진행 중...' : '완료'}
                    </span>
                    <span className="text-sm text-gray-600">
                      {selectedJob.status === '진행' 
                        ? `${selectedJob.elapsed}/${selectedJob.etaTime}`
                        : selectedJob.startTime
                      }
                    </span>
                  </div>
                  <div className="relative w-full h-6 rounded bg-gray-200 overflow-hidden">
                    <div className={`h-full bg-[#2E7BEF]`} style={{ width: `${selectedJob.progress}%` }} />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
                      {`${selectedJob.progress}%`}
                    </span>
                  </div>
                </div>
              </div>
            </CommonContainerBox>

            <div className="flex justify-end">
              <CommonButton variant="gray" onClick={() => setSelectedJob(null)}>
                닫기
              </CommonButton>
            </div>
          </div>
        )}
      </CommonModal>
    </div>
  );
}
