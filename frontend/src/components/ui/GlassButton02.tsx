"use client";

import React, { useEffect, useRef } from "react";

interface GlassButton02Props {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
  disabled?: boolean;
  reflectionColor?: string; // 반사 색상 (hex)
  reflectionOpacity?: number; // 반사 투명도 (0-1)
  shadowBlur?: number; // 그림자 블러 (px)
}

export default function GlassButton02({
  children,
  onClick,
  type = "button",
  className = "",
  disabled = false,
  reflectionColor = "#B4F0E6",
  reflectionOpacity = 0.15,
  shadowBlur = 2,
}: GlassButton02Props) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const styleIdRef = useRef(`glass-button-02-${Math.random().toString(36).substr(2, 9)}`);

  // Hex to RGB 변환
  const hexToRgb = (hex: string) => {
    hex = hex.replace("#", "");
    if (hex.length === 3) {
      hex = hex.split("").map((x) => x + x).join("");
    }
    const bigint = parseInt(hex, 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255,
    };
  };

  // 동적 스타일 업데이트
  useEffect(() => {
    const { r, g, b } = hexToRgb(reflectionColor);
    let styleElement = document.getElementById(styleIdRef.current);
    
    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = styleIdRef.current;
      document.head.appendChild(styleElement);
    }

    styleElement.textContent = `
      .glass-button-02-${styleIdRef.current}::before {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: inherit;
        background: linear-gradient(135deg, rgba(${r}, ${g}, ${b}, ${reflectionOpacity}), transparent);
        pointer-events: none;
        mix-blend-mode: overlay;
      }
    `;

    return () => {
      const element = document.getElementById(styleIdRef.current);
      if (element) {
        element.remove();
      }
    };
  }, [reflectionColor, reflectionOpacity]);

  return (
    <div className="glass-button-wrap">
      <button
        ref={buttonRef}
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`glass-button-02 glass-button-02-${styleIdRef.current} ${className}`}
        style={{
          "--shadow-blur": `${shadowBlur}px`,
        } as React.CSSProperties}
      >
        <span>{children}</span>
      </button>
      <div
        className="glass-button-shadow"
        style={{
          filter: `blur(${shadowBlur}px)`,
        }}
      />
    </div>
  );
}
