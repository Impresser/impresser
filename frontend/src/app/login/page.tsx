"use client";

import React from "react";
import LoginContain from "./components/logincontain";

export default function LoginPage() {
  return (
    <main className="min-h-[calc(100vh-0px)] flex items-center justify-center px-4 py-10">
      {/* 반응형: 좌우 패딩으로 여백 확보, 내부 컴포넌트는 자체 폭 제어 */}
      <LoginContain />
    </main>
  );
}


