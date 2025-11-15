"use client";

import React from "react";

interface CommonTableFrameProps {
  className?: string;
  tableClassName?: string;
  header: React.ReactNode;
  body: React.ReactNode;
}

export default function CommonTableFrame({ className = "", tableClassName = "", header, body }: CommonTableFrameProps) {
  const hasOverflowVisible = className.includes('overflow-visible');
  const overflowClass = hasOverflowVisible ? '' : 'overflow-hidden';
  
  return (
    <div className={`${overflowClass} rounded-md border border-gray-200 ${className}`}>
      <table className={`w-full text-sm ${tableClassName}`}>
        {header}
        {body}
      </table>
    </div>
  );
}

