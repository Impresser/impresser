"use client";

import React from "react";

export default function LoginFindModalContent() {
  return (
    <div className="text-center select-none">
      <p className="text-[16px] md:text-[16px] font-semibold leading-relaxed text-[#184483]">
        회원가입 및 비밀번호 변경은
        <br /> 인사팀에 문의하세요
      </p>
      <a
        href="mailto:rec.semes@semes.com"
        className="inline-block mt-6 text-[#184483] underline text-lg"
      >
        rec.semes@semes.com
      </a>
    </div>
  );
}


