"use client";

import React from "react";

interface ContainerBoxProps {
  children: React.ReactNode;
  className?: string;
}

export default function ContainerBox({ children, className = "" }: ContainerBoxProps) {
  return (
    <div
      className={`
        bg-white
        rounded-2xl
        px-6 py-6
        shadow-[0_4px_12px_rgba(0,0,0,0.09),inset_0_2px_4px_rgba(0,0,0,0.02)]
        ${className}
      `}
    >
      {children}
    </div>
  );
}
