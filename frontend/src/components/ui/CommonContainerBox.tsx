"use client";

import React from "react";

interface ContainerBoxProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  style?: React.CSSProperties;
}

export default function ContainerBox({ children, className = "", title, style }: ContainerBoxProps) {
  return (
    <div
      className={`
        bg-white
        rounded-2xl
        px-6 py-6
        shadow-[0_4px_12px_rgba(0,0,0,0.09),inset_0_2px_4px_rgba(0,0,0,0.02)]
        ${className}
      `}
      style={style}
    >
      {title && (
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}
