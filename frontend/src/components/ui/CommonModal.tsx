"use client";

import React from "react";

interface CommonModalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  leftOffset?: number;
  topOffset?: number;
  style?: React.CSSProperties;
  hideBackdrop?: boolean;
}

export default function CommonModal({ children, isOpen, onClose, className = '', leftOffset = 0, topOffset = 0, style, hideBackdrop = false }: CommonModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className={`
        fixed
        flex items-center justify-center
        ${hideBackdrop ? '' : 'bg-black/50'}
        z-50
      `}
      style={{
        left: leftOffset > 0 ? `${leftOffset}px` : '0',
        top: topOffset > 0 ? `${topOffset}px` : '0',
        right: '0',
        bottom: '0',
      }}
      onClick={onClose}
    >
      <div
        className={`
          relative
          bg-white
          backdrop-blur-xl
          rounded-xl
          shadow-[0_12px_15px_rgba(0,0,0,0.15),0_4px_10px_rgba(0,0,0,0.1),inset_2px_2px_6px_rgba(255,255,255,0.6),inset_-2px_-2px_25px_rgba(0,0,0,0.05)]
          p-8
          min-w-[500px]
          transition-all duration-300
          max-h-[90vh] overflow-visible
          ${className}
          before:absolute before:inset-0
          before:rounded-xl
          before:bg-linear-to-br before:from-transparent before:to-white/40
          before:pointer-events-none
        `}
        style={style}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

