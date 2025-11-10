"use client";

import React from "react";
import ThreeIsometricMap from "../simulation/components/ThreeIsometricMap";

export default function Test001Page() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 gap-6">
      <h1 className="text-2xl font-bold">Three.js Isometric Map Demo</h1>
      <div className="w-full max-w-5xl h-[600px] border border-white/20 rounded-xl overflow-hidden shadow-lg">
        <ThreeIsometricMap />
      </div>
      <p className="text-sm text-white/60 text-center">
        좌클릭 드래그로 이동, 우클릭 드래그로 회전, 마우스 휠이나 터치 핀치로 확대/축소할 수 있습니다.
      </p>
    </div>
  );
}

