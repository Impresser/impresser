"use client";

import React from "react";

interface GlassButton01Props {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  variant?: "dark" | "light"; // dark: 어두운 배경, light: 밝은 배경
  gradient?: boolean; // 그라데이션 효과 여부
  className?: string;
  disabled?: boolean;
}

export default function GlassButton01({
  children,
  onClick,
  type = "button",
  variant = "dark",
  gradient = false,
  className = "",
  disabled = false,
}: GlassButton01Props) {
  const baseStyles = `
    h-8
    isolate
    font-medium
    relative
    flex items-center
    whitespace-nowrap
    px-6
    rounded-full
    transition-colors
    ring-[0.5px]
    cursor-pointer
    disabled:opacity-50
    disabled:cursor-not-allowed
  `;

  const variantStyles = {
    dark: `
      bg-slate-900/10
      backdrop-blur-lg
      ring-slate-900/12
      hover:bg-white
      shadow-[0_1px_1px_-0.5px_rgba(15,23,42,0.06),0_2px_2px_-1px_rgba(15,23,42,0.06),0_4px_4px_-2px_rgba(15,23,42,0.06),0_8px_8px_-4px_rgba(15,23,42,0.06)]
      [box-shadow:inset_0_1.5px_1px_rgba(255,255,255,0.9),inset_0_-1.5px_1px_rgba(255,255,255,0.9),inset_0_6px_6px_-3px_rgba(15,23,42,0.08),inset_0_-4px_4px_-2px_rgba(15,23,42,0.1)]
    `,
    light: `
      bg-neutral-50
      ring-slate-900/12
      transition-colors
      hover:bg-white
      shadow-[0_1px_1px_-0.5px_rgba(15,23,42,0.04),0_2px_2px_-1px_rgba(15,23,42,0.04),0_4px_4px_-2px_rgba(15,23,42,0.04),0_8px_8px_-4px_rgba(15,23,42,0.04)]
      [box-shadow:inset_0_1.5px_1px_rgba(255,255,255,0.9),inset_0_-1.5px_1px_rgba(255,255,255,0.8),inset_0_6px_6px_-3px_rgba(15,23,42,0.08),inset_0_-4px_4px_-2px_rgba(15,23,42,0.1)]
    `,
  };

  const gradientStyles = gradient
    ? `
      before:absolute
      before:-z-10
      before:rounded-[inherit]
      before:bottom-0
      before:h-2
      before:blur
      before:bg-gradient-to-r
      before:from-sky-200
      before:via-pink-200
      before:to-orange-200
      before:inset-x-2
      before:translate-y-1/2
    `
    : "";

  const textStyles = `
    bg-gradient-to-b
    from-slate-950
    to-slate-500
    leading-4
    text-transparent
    bg-clip-text
    [filter:drop-shadow(0_1px_0_rgba(255,255,255,0.75))_drop-shadow(0_1px_2px_rgba(15,23,42,0.25))_drop-shadow(0_-1px_0_rgba(15,23,42,0.02))]
  `;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${gradientStyles} ${className}`}
    >
      <span className={textStyles}>{children}</span>
    </button>
  );
}

