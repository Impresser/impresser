"use client";

import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import ContainerBox from "@/components/ui/ContainerBox"; // ✅ 컨테이너 박스 import

export default function ModalTestPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-10">
      {/* 🔹 버튼 섹션 */}
      <div className="flex flex-col items-center gap-6">
        <Button variant="blue" onClick={() => setOpen(true)}>
          파란색 모달 열기
        </Button>
        <Button variant="gray" onClick={() => setOpen(true)}>
          회색 모달 열기
        </Button>
      </div>

      {/* 🔹 컨테이너 박스 예시 */}
      <ContainerBox className="w-[400px]">
        <h2 className="text-lg font-semibold mb-3">컨테이너 박스 예시</h2>
        <p className="text-gray-600">
          이 컨테이너는 내용에 따라 자동으로 크기가 조정되고,
          <br /> 부드러운 그림자와 둥근 모서리를 가지고 있습니다.
        </p>
      </ContainerBox>

      {/* 🔹 모달 */}
      <Modal isOpen={open} onClose={() => setOpen(false)}>
        <h2 className="text-xl font-semibold mb-4">모달 제목</h2>
        <p className="text-gray-600 mb-6">
          이 모달은 부드러운 그림자와 둥근 모서리를 가진 디자인입니다.
        </p>
        <div className="flex justify-end">
          <Button variant="gray" onClick={() => setOpen(false)}>
            닫기
          </Button>
        </div>
      </Modal>
    </div>
  );
}
