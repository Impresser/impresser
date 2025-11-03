"use client";

import React, { useState } from "react";
import ContainerBox from "@/components/ui/ContainerBox";
import Input from "@/components/ui/Input01";
import Button from "@/components/ui/Button";
import CommonModal from "@/components/ui/CommonModal";
import LoginFindModalContent from "./loginfindmodal";

export default function LoginContain() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [infoOpen, setInfoOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: API 연동
    // console.log({ userId, password });
  };

  return (
    <div className="w-full flex items-center justify-center py-10">
      <ContainerBox className="w-[360px] md:w-[420px] px-8 py-6 md:px-15 md:py-8">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="w-full">
            <Input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="아이디"
              textAlign="left"
              leftIcon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="3" />
                </svg>
              }
            />
          </div>

          <div className="w-full">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              textAlign="left"
              leftIcon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="10" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              }
            />
          </div>

          <div className="pt-2">
            <Button type="submit" variant="blue" className="w-full">
              로그인
            </Button>
          </div>
        </form>

        <div className="mt-5 text-end text-xs text-gray-400">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setInfoOpen(true);
            }}
            className="hover:underline"
          >
            회원가입
          </a>
          <span className="mx-2">/</span>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setInfoOpen(true);
            }}
            className="hover:underline"
          >
            비밀번호 찾기
          </a>
        </div>
        <CommonModal isOpen={infoOpen} onClose={() => setInfoOpen(false)}>
          <LoginFindModalContent />
        </CommonModal>
      </ContainerBox>
    </div>
  );
}


