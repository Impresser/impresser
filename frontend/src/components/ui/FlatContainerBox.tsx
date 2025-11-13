import React from 'react';

interface FlatContainerBoxProps {
  children: React.ReactNode;
  className?: string;
}

export default function FlatContainerBox({ children, className = '' }: FlatContainerBoxProps) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-700 ${className}`.trim()}
    >
      {children}
    </div>
  );
}
