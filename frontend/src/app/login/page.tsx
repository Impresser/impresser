"use client";

import React, { Suspense } from "react";
import LoginContain from "./components/logincontain";

export default function LoginPage() {
  return (
    <main className="h-screen w-screen overflow-hidden">
      <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center">로딩 중...</div>}>
        <LoginContain />
      </Suspense>
    </main>
  );
}


