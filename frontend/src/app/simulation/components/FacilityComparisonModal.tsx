'use client';

import React, { useCallback, useEffect, useState } from 'react';
import CommonModal from '@/components/ui/CommonModal';
import CommonButton from '@/components/ui/CommonButton';
import type { Facility } from '../types';
import FacilityJobUpload from './FacilityJobUpload';
import FacilityFileUpload from './FacilityFileUpload';

type CompressionSettings = {
  processingMethod: 'cpu' | 'gpu';
  algorithm: string;
  version: string;
};

interface FacilityComparisonModalProps {
  facility: Facility | null;
  isOpen: boolean;
  settings: CompressionSettings;
  onSettingsChange: (update: Partial<CompressionSettings>) => void;
  onConfirm: () => void;
  onClose: () => void;
  onUpload?: (
    facility: Facility,
    payload: {
      files: File[];
      processingMethod: string;
      algorithm: string;
      version: string;
    }
  ) => void;
}

export default function FacilityComparisonModal({
  facility,
  isOpen,
  settings,
  onSettingsChange,
  onConfirm,
  onClose,
  onUpload,
}: FacilityComparisonModalProps) {
  const [step, setStep] = useState<'settings' | 'upload'>('settings');

  useEffect(() => {
    if (!isOpen) {
      setStep('settings');
    }
  }, [isOpen]);

  useEffect(() => {
    setStep('settings');
  }, [facility?.id]);

  const isNextDisabled = !settings.algorithm || !settings.version;

  const handleNext = useCallback(() => {
    if (isNextDisabled) return;
    setStep('upload');
  }, [isNextDisabled]);

  const handleUploadSubmit = useCallback(
    (payload: { files: File[]; processingMethod: string; algorithm: string; version: string }) => {
      if (!facility) return;
      onUpload?.(facility, payload);
      onConfirm();
    },
    [facility, onConfirm, onUpload]
  );

  const modalWidthClassName = step === 'upload' ? 'w-full max-w-[57.6rem]' : 'w-full max-w-3xl';

  return (
    <CommonModal
      isOpen={isOpen && !!facility}
      onClose={onClose}
      className={modalWidthClassName}
    >
      {facility && (
        <div className="space-y-6">
          <div className="relative flex items-start justify-between">
            <div className="pr-10">
              <h3 className="text-lg font-semibold text-gray-900">
                {step === 'settings' ? '압축 설정 선택' : '압축 파일 업로드'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {step === 'settings'
                  ? `${facility.name} 설비의 압축 알고리즘과 버전을 선택하세요.`
                  : '선택한 압축 방법으로 제출할 파일을 등록하세요.'}
              </p>
            </div>
            <button
              type="button"
              aria-label="비교 모달 닫기"
              className="absolute top-0 right-0 rounded-full p-2 text-gray-400 transition-colors hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              onClick={onClose}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {step === 'settings' ? (
            <FacilityJobUpload
              facility={facility}
              settings={settings}
              onSettingsChange={onSettingsChange}
            />
          ) : (
            <FacilityFileUpload
              settings={settings}
              onSubmit={handleUploadSubmit}
              submitLabel="추가"
            />
          )}

          {step === 'settings' && (
            <div className="flex justify-end">
              <CommonButton
                variant="blue"
                className="px-5 py-2 text-sm"
                onClick={handleNext}
                disabled={isNextDisabled}
              >
                다음
              </CommonButton>
            </div>
          )}
        </div>
      )}
    </CommonModal>
  );
}

