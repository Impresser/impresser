"use client";

import React from "react";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  variant?: "blue" | "gray" | "red" | "outline"; // ✅ 색상 구분용 prop 추가
  className?: string;
  disabled?: boolean;
}

export default function Button({
  children,
  onClick,
  type = "button",
  variant = "blue", // ✅ 기본값: 파란색
  className = "",
  disabled = false,
}: ButtonProps) {
  const baseStyle = `
    px-7 py-2
    rounded-full
    font-medium
    backdrop-blur-md
    shadow-[0_4px_5px_rgba(0,0,0,0.)]
    transition-all duration-200
    focus:outline-none
    hover:scale-103
    active:scale-95
    cursor-pointer
    disabled:opacity-50
    disabled:cursor-not-allowed
    disabled:hover:scale-100
  `;

  const colorStyles = {
    blue: `
      bg-[#0059FF]
      text-white
      hover:bg-[#0062CC]
    `,
    gray: `
      bg-[#8E8E93]
      text-white
      hover:bg-[#7A7A7E]
    `,
    red: `
      bg-[#DC2626]
      text-white
      hover:bg-[#B91C1C]
    `,
    outline: `
      bg-transparent
      border-2
      border-[#0059FF]
      text-[#0059FF]
      hover:bg-[#0059FF]
      hover:text-white
    `,
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${colorStyles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
