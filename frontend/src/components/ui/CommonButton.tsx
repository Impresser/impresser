"use client";

import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "blue" | "gray" | "red" | "outline";
}

export default function Button({
  children,
  type = "button",
  variant = "blue",
  className = "",
  disabled = false,
  ...rest
}: ButtonProps) {
  const baseStyle = `
    px-7 py-2
    text-sm
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
      disabled={disabled}
      className={`${baseStyle} ${colorStyles[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
