"use client";

import React from "react";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  variant?: "blue" | "gray"; // ✅ 색상 구분용 prop 추가
}

export default function Button({
  children,
  onClick,
  type = "button",
  variant = "blue", // ✅ 기본값: 파란색
}: ButtonProps) {
  const baseStyle = `
    px-7 py-2
    rounded-full
    font-medium
    text-white
    backdrop-blur-md
    shadow-[0_4px_10px_rgba(0,0,0,0.2)]
    transition-all duration-200
    focus:outline-none
    [text-shadow:0_1px_2px_rgba(0,0,0,0.25)]
    hover:scale-103
    active:scale-95
    cursor-pointer
  `;

  const colorStyles = {
    blue: `
      bg-[#0059FF]/80
      hover:bg-[#0062CC]/90
    `,
    gray: `
      bg-[#8E8E93]/80
      hover:bg-[#7A7A7E]/90
    `,
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseStyle} ${colorStyles[variant]}`}
    >
      {children}
    </button>
  );
}
