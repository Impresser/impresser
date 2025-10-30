"use client";

import React from "react";

interface ModalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

export default function Modal({ children, isOpen, onClose }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="
        fixed inset-0 
        flex items-center justify-center
        backdrop-blur-md 
        z-50
      "
      onClick={onClose}
    >
      <div
        className="
          relative
          bg-white
          backdrop-blur-xl
          rounded-xl
          shadow-[0_12px_15px_rgba(0,0,0,0.15),0_4px_10px_rgba(0,0,0,0.1),inset_2px_2px_6px_rgba(255,255,255,0.6),inset_-2px_-2px_25px_rgba(0,0,0,0.05)]
          p-8
          w-[500px] max-w-[90%]
          transition-all duration-300
          max-h-[80vh] overflow-auto
          before:absolute before:inset-0
          before:rounded-xl
          before:bg-linear-to-br before:from-transparent before:to-white/40
          before:pointer-events-none
        "
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
