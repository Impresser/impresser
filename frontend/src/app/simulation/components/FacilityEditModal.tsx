'use client';

import React, { useEffect, useState } from 'react';
import CommonModal from '@/components/ui/CommonModal';
import CommonButton from '@/components/ui/CommonButton';
import CommonDropdown from '@/components/ui/CommonDropdown';
import type { Facility } from '../types';
import { updateInkjetPrinter } from '@/service/inkjet';

interface FacilityEditModalProps {
  facility: Facility | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => Promise<void> | void;
  onRequestLocationChange?: () => void;
  draftLocation: { x: number; y: number } | null;
}

const STATUS_OPTIONS = [
  { value: 'OPERATIONAL', label: '정상' },
  { value: 'BROKEN', label: '고장' },
  { value: 'UNDER_REPAIR', label: '점검' },
];

const mapFacilityStatusToPrinterStatus = (status: Facility['status']): 'OPERATIONAL' | 'BROKEN' | 'UNDER_REPAIR' => {
  switch (status) {
    case 'active':
      return 'OPERATIONAL';
    case 'inactive':
      return 'BROKEN';
    case 'maintenance':
      return 'UNDER_REPAIR';
    default:
      return 'OPERATIONAL';
  }
};

const NAVBAR_HEIGHT = 64;

export default function FacilityEditModal({
  facility,
  isOpen,
  onClose,
  onUpdated,
  onRequestLocationChange,
  draftLocation,
}: FacilityEditModalProps) {
  const [printerName, setPrinterName] = useState('');
  const [modelName, setModelName] = useState('');
  const [cpu, setCpu] = useState('');
  const [gpu, setGpu] = useState('');
  const [ram, setRam] = useState('');
  const [vram, setVram] = useState('');
  const [printerStatus, setPrinterStatus] = useState<'OPERATIONAL' | 'BROKEN' | 'UNDER_REPAIR'>('OPERATIONAL');
  const [canvasXInput, setCanvasXInput] = useState('');
  const [canvasYInput, setCanvasYInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!facility || !isOpen) return;

    setPrinterName(facility.name);
    setModelName(facility.modelName || '');
    setCpu(facility.cpu || '');
    setGpu(facility.gpu || '');
    setRam(facility.ram || '');
    setVram(facility.vram || '');
    setPrinterStatus(mapFacilityStatusToPrinterStatus(facility.status));

    const initialX = facility.canvasX ?? 0;
    const initialY = facility.canvasY ?? 0;
    setCanvasXInput(facility.canvasX !== undefined ? String(facility.canvasX) : '');
    setCanvasYInput(facility.canvasY !== undefined ? String(facility.canvasY) : '');
    setSubmitError(null);
    setIsSubmitting(false);
  }, [facility, isOpen]);

  useEffect(() => {
    if (!isOpen || !draftLocation) return;
    setCanvasXInput(String(draftLocation.x));
    setCanvasYInput(String(draftLocation.y));
  }, [draftLocation, isOpen]);

  if (!facility) {
    return null;
  }

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleSubmit = async () => {
    if (!printerName || !modelName || !cpu || !gpu || !ram || !vram) {
      setSubmitError('모든 필드를 입력해주세요.');
      return;
    }

    if (canvasXInput.trim() === '' || canvasYInput.trim() === '') {
      setSubmitError('설비 위치 좌표를 입력해주세요.');
      return;
    }

    const parsedX = Number(canvasXInput);
    const parsedY = Number(canvasYInput);

    if (!Number.isFinite(parsedX) || !Number.isFinite(parsedY)) {
      setSubmitError('설비 위치는 숫자로 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      await updateInkjetPrinter(facility.id, {
        printerName,
        modelName,
        cpu,
        gpu,
        ram,
        vram,
        printerStatus,
        canvasX: parsedX,
        canvasY: parsedY,
      });

      onClose();
      await onUpdated?.();
    } catch (error) {
      console.error('설비 수정 실패:', error);
      setSubmitError(error instanceof Error ? error.message : '설비 수정 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <CommonModal isOpen={isOpen} onClose={handleClose} className="w-full max-w-2xl" topOffset={NAVBAR_HEIGHT}>
        <div className="w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">설비 정보 수정</h2>

          {submitError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          )}

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
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="설비명"
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
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="VRAM 정보"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">설비 상태</label>
                <CommonDropdown
                  options={STATUS_OPTIONS}
                  value={printerStatus}
                  onChange={(value) => setPrinterStatus(value as 'OPERATIONAL' | 'BROKEN' | 'UNDER_REPAIR')}
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
                      value={canvasXInput}
                      onChange={(e) => setCanvasXInput(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="X 좌표"
                    />
                    <input
                      type="text"
                      value={canvasYInput}
                      onChange={(e) => setCanvasYInput(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Y 좌표"
                    />
                  </div>
                  <CommonButton
                    variant="gray"
                    type="button"
                    onClick={() => {
                      if (isSubmitting) return;
                      onRequestLocationChange?.();
                    }}
                  >
                    변경
                  </CommonButton>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <CommonButton variant="gray" onClick={handleClose} disabled={isSubmitting}>
                취소
              </CommonButton>
              <CommonButton variant="blue" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? '저장 중...' : '저장'}
              </CommonButton>
            </div>
          </div>
        </div>
      </CommonModal>
    </>
  );
}
