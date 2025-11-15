"use client";

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  fixedPlaceholder?: string; // 커스텀 placeholder 텍스트
  fixedPlaceholderPadding?: 'sm' | 'md'; // 오버레이 텍스트용 좌측 패딩 크기
}

export default function Input({
  className = "",
  fixedPlaceholder,
  fixedPlaceholderPadding = 'md',
  ...props
}: InputProps) {
  const leftPaddingClass = fixedPlaceholder
    ? (fixedPlaceholderPadding === 'sm' ? 'pl-6' : 'pl-12')
    : '';
  return (
    <div className="relative w-full">
      {fixedPlaceholder && (
        <span
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm"
        >
          {fixedPlaceholder}
        </span>
      )}

      <input
        className={`
          w-full
          px-3 py-2
          bg-[#F8F8F8]
          border border-[#E5E5E5]
          rounded-md
          text-gray-800
          text-right
          placeholder:text-left
          focus:outline-none
          focus:ring-1 focus:ring-blue-400
          transition
          ${leftPaddingClass}
          ${className}
        `}
        {...props}
      />
    </div>
  );
}
