"use client";

import React from "react";

type CommonPaginationProps = {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
};

export default function CommonPagination({ currentPage, totalPages, onChange, className }: CommonPaginationProps) {
  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  const goPrev = () => {
    if (canPrev) onChange(currentPage - 1);
  };
  const goNext = () => {
    if (canNext) onChange(currentPage + 1);
  };

  if (totalPages <= 1) return null;

  return (
    <div className={`mt-4 flex items-center justify-center gap-2 ${className ?? ""}`}>
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

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
        <button
          key={pageNumber}
          type="button"
          onClick={() => onChange(pageNumber)}
          className={`h-9 min-w-9 px-3 flex items-center justify-center rounded-full border transition ${
            pageNumber === currentPage
              ? 'bg-[#0059FF] text-white border-transparent'
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
        className={`h-9 w-9 flex items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition ${!canNext ? 'opacity-40 pointer-events-none' : ''}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>
    </div>
  );
}


