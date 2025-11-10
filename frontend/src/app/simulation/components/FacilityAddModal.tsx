"use client";

import React, { useEffect, useState } from "react";
import CommonModal from '@/components/ui/CommonModal';
import CommonButton from '@/components/ui/CommonButton';
import { createInkjetPrinter } from '@/service/inkjet';

interface FacilityAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (facilityData: {
    printerName: string;
    modelName: string;
    installDate: string;
    cpu: string;
    gpu: string;
    ram: string;
    vram: string;
    canvasX: number;
    canvasY: number;
  }) => void;
  sidebarWidth?: number;
  navbarHeight?: number;
  initialCanvasPosition?: { x: number; y: number } | null;
  onRequestLocationChange?: () => void;
}

export default function FacilityAddModal({
  isOpen,
  onClose,
  onAdd,
  sidebarWidth = 192,
  navbarHeight = 64,
  initialCanvasPosition = null,
  onRequestLocationChange,
}: FacilityAddModalProps) {
  const [printerName, setPrinterName] = useState('');
  const [modelName, setModelName] = useState('');
  const [installDate, setInstallDate] = useState('');
  const [cpu, setCpu] = useState('');
  const [gpu, setGpu] = useState('');
  const [ram, setRam] = useState('');
  const [vram, setVram] = useState('');
  const [canvasX, setCanvasX] = useState<string>('');
  const [canvasY, setCanvasY] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (initialCanvasPosition) {
      setCanvasX(String(initialCanvasPosition.x));
      setCanvasY(String(initialCanvasPosition.y));
    } else {
      setCanvasX('');
      setCanvasY('');
    }
  }, [initialCanvasPosition, isOpen]);

  const handleSubmit = async () => {
    if (!printerName || !modelName || !installDate || !cpu || !gpu || !ram || !vram) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    if (canvasX.trim() === '' || canvasY.trim() === '') {
      alert('설비 위치 좌표를 입력해주세요.');
      return;
    }

    const parsedX = Number(canvasX);
    const parsedY = Number(canvasY);

    if (!Number.isFinite(parsedX) || !Number.isFinite(parsedY)) {
      alert('설비 위치는 숫자로 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await createInkjetPrinter({
        modelName,
        printerName,
        installDate,
        cpu,
        gpu,
        ram,
        vram,
        printerStatus: 'OPERATIONAL',
        processStatus: 'WAITING',
        canvasX: parsedX,
        canvasY: parsedY,
      });

      if (response.isSuccess) {
        onAdd({
          printerName,
          modelName,
          installDate,
          cpu,
          gpu,
          ram,
          vram,
          canvasX: parsedX,
          canvasY: parsedY,
        });

        setPrinterName('');
        setModelName('');
        setInstallDate('');
        setCpu('');
        setGpu('');
        setRam('');
        setVram('');
        setCanvasX('');
        setCanvasY('');
        onClose();
      } else {
        alert(response.message || '설비 추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('설비 추가 실패:', error);
      alert(error instanceof Error ? error.message : '설비 추가 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setPrinterName('');
    setModelName('');
    setInstallDate('');
    setCpu('');
    setGpu('');
    setRam('');
    setVram('');
    setCanvasX('');
    setCanvasY('');
    onClose();
  };

  const handleLocationChangeRequest = () => {
    onRequestLocationChange?.();
  };

  return (
    <CommonModal
      isOpen={isOpen}
      onClose={handleClose}
      className="w-full max-w-2xl"
      leftOffset={0}
      topOffset={navbarHeight}
    >
      <div className="w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">설비 추가</h2>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                설비명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={printerName}
                onChange={(e) => setPrinterName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="프린터 이름"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                모델명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="모델명"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CPU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={cpu}
                onChange={(e) => setCpu(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="CPU 정보"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GPU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={gpu}
                onChange={(e) => setGpu(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="GPU 정보"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                RAM <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={ram}
                onChange={(e) => setRam(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="RAM 정보"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                VRAM <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={vram}
                onChange={(e) => setVram(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="VRAM 정보"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                설치일 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={installDate}
                onChange={(e) => setInstallDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                설비 위치 (X, Y) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={canvasX}
                    onChange={(e) => setCanvasX(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="X 좌표"
                  />
                  <input
                    type="text"
                    value={canvasY}
                    onChange={(e) => setCanvasY(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Y 좌표"
                  />
                </div>
                <CommonButton variant="gray" type="button" onClick={handleLocationChangeRequest}>
                  변경
                </CommonButton>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <CommonButton variant="gray" onClick={handleClose} disabled={isSubmitting}>
            취소
          </CommonButton>
          <CommonButton variant="blue" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? '추가 중...' : '추가'}
          </CommonButton>
        </div>
      </div>
    </CommonModal>
  );
}
