"use client";

import React, { useState } from "react";
import CommonModal from "@/components/ui/CommonModal";
import CommonButton from "@/components/ui/CommonButton";
import CommonContainerBox from "@/components/ui/CommonContainerBox"; // ✅ 컨테이너 박스 import
import { useToast } from "@/components/ui/CommonToast";

export default function ModalTestPage() {
  const [open, setOpen] = useState(false);
  const { showToast } = useToast();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-10 p-8">
      {/* 🔹 토스트 메시지 테스트 버튼 섹션 */}
      <CommonContainerBox className="w-full max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">토스트 메시지 테스트</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <CommonButton 
            variant="blue" 
            onClick={() => showToast('성공 메시지입니다!', 'success')}
          >
            Success
          </CommonButton>
          <CommonButton 
            variant="red" 
            onClick={() => showToast('오류가 발생했습니다.', 'error')}
          >
            Error
          </CommonButton>
          <CommonButton 
            variant="outline" 
            onClick={() => showToast('정보 메시지입니다.', 'info')}
          >
            Info
          </CommonButton>
          <CommonButton 
            variant="gray" 
            onClick={() => showToast('경고 메시지입니다.', 'warning')}
          >
            Warning
          </CommonButton>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">긴 메시지 테스트:</p>
          <CommonButton 
            variant="blue" 
            onClick={() => showToast('이것은 토스트 메시지입니다.', 'success', 3000)}
          >
            긴 메시지 (3초)
          </CommonButton>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">긴 메시지 테스트:</p>
          <CommonButton 
            variant="blue" 
            onClick={() => showToast('이것은 토스트 메시지입니다.', 'error', 3000)}
          >
            긴 메시지 (3초)
          </CommonButton>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">긴 메시지 테스트:</p>
          <CommonButton 
            variant="blue" 
            onClick={() => showToast('이것은 토스트 메시지입니다.', 'info', 3000)}
          >
            긴 메시지 (3초)
          </CommonButton>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">긴 메시지 테스트:</p>
          <CommonButton 
            variant="blue" 
            onClick={() => showToast('이것은 토스트 메시지입니다.', 'warning', 3000)}
          >
            긴 메시지 (3초)
          </CommonButton>
        </div>
      </CommonContainerBox>

      {/* 🔹 버튼 섹션 */}
      <div className="flex flex-col items-center gap-6">
        <CommonButton variant="blue" onClick={() => setOpen(true)}>
          파란색 모달 열기
        </CommonButton>
        <CommonButton variant="gray" onClick={() => setOpen(true)}>
          회색 모달 열기
        </CommonButton>
      </div>

      {/* 🔹 컨테이너 박스 예시 */}
      <CommonContainerBox className="w-[400px]">
        <h2 className="text-lg font-semibold mb-3">컨테이너 박스 예시</h2>
        <p className="text-gray-600">
          이 컨테이너는 내용에 따라 자동으로 크기가 조정되고,
          <br /> 부드러운 그림자와 둥근 모서리를 가지고 있습니다.
        </p>
      </CommonContainerBox>

      {/* 🔹 모달 */}
      <CommonModal isOpen={open} onClose={() => setOpen(false)}>
        <h2 className="text-xl font-semibold mb-4">모달 제목</h2>
        <p className="text-gray-600 mb-6">
          이 모달은 부드러운 그림자와 둥근 모서리를 가진 디자인입니다.
        </p>
        <div className="flex justify-end">
          <CommonButton variant="gray" onClick={() => setOpen(false)}>
            닫기
          </CommonButton>
        </div>
      </CommonModal>
    </div>
  );
}
