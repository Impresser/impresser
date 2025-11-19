"use client";

import React from "react";

type CommonPaginationProps = {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
};

export default function CommonPagination({ currentPage, totalPages, onChange, className }: CommonPaginationProps) {
  const pagesPerGroup = 10;
  const currentGroup = Math.floor((currentPage - 1) / pagesPerGroup);
  const startPage = currentGroup * pagesPerGroup + 1;
  const endPage = Math.min(startPage + pagesPerGroup - 1, totalPages);
  
  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;
  const canPrevGroup = currentGroup > 0;
  const canNextGroup = endPage < totalPages;

  const goPrev = () => {
    if (canPrev) onChange(currentPage - 1);
  };
  const goNext = () => {
    if (canNext) onChange(currentPage + 1);
  };
  const goPrevGroup = () => {
    if (canPrevGroup) {
      const prevGroupStartPage = (currentGroup - 1) * pagesPerGroup + 1;
      onChange(prevGroupStartPage);
    }
  };
  const goNextGroup = () => {
    if (canNextGroup) {
      const nextGroupStartPage = (currentGroup + 1) * pagesPerGroup + 1;
      onChange(nextGroupStartPage);
    }
  };

  if (totalPages <= 1) return null;

  const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  return (
    <div className={`mt-4 flex items-center justify-center gap-2 ${className ?? ""}`}>
      <button
        type="button"
        onClick={goPrevGroup}
        aria-label="이전 그룹"
        className={`h-9 w-9 flex items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition cursor-pointer ${!canPrevGroup ? 'opacity-40 pointer-events-none' : ''}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M11 18l-6-6 6-6" />
          <path d="M18 18l-6-6 6-6" />
        </svg>
      </button>

      <button
        type="button"
        onClick={goPrev}
        aria-label="이전 페이지"
        className={`h-9 w-9 flex items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition cursor-pointer ${!canPrev ? 'opacity-40 pointer-events-none' : ''}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      {pageNumbers.map((pageNumber) => (
        <button
          key={pageNumber}
          type="button"
          onClick={() => onChange(pageNumber)}
          className={`h-9 min-w-9 px-3 flex items-center justify-center rounded-full border transition cursor-pointer ${
            pageNumber === currentPage
              ? 'bg-[#0059FF] text-white border-transparent pointer-events-none'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
          aria-current={pageNumber === currentPage ? 'page' : undefined}
          aria-label={`${pageNumber} 페이지`}
        >
          {pageNumber}
        </button>
      ))}

      <button
        type="button"
        onClick={goNext}
        aria-label="다음 페이지"
        className={`h-9 w-9 flex items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition cursor-pointer ${!canNext ? 'opacity-40 pointer-events-none' : ''}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>

      <button
        type="button"
        onClick={goNextGroup}
        aria-label="다음 그룹"
        className={`h-9 w-9 flex items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition cursor-pointer ${!canNextGroup ? 'opacity-40 pointer-events-none' : ''}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M13 6l6 6-6 6" />
          <path d="M6 6l6 6-6 6" />
        </svg>
      </button>
    </div>
  );
}


