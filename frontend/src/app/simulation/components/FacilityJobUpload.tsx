'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import CommonButton from '@/components/ui/CommonButton';
import CommonDropdown from '@/components/ui/CommonDropdown';
import RadioButton from '@/components/ui/RadioButton';
import { getCompressionTypes, getCompressionTypeVersions } from '@/service/imageCompressor';
import type { CompressionTypeItem, CompressionTypeVersionItem } from '@/types/imageCompressor';
import type { Facility } from '../types';

interface FacilityJobUploadProps {
  facility: Facility | null;
  onSubmit?: (payload: {
    facilityId: string;
    files: File[];
    processingMethod: string;
    algorithm: string;
    version: string;
  }) => void;
}

interface UploadPreview {
  id: string;
  file: File;
  name: string;
  sizeLabel: string;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export default function FacilityJobUpload({ facility, onSubmit }: FacilityJobUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<UploadPreview[]>([]);
  const [processingMethod, setProcessingMethod] = useState<'CPU' | 'GPU'>('CPU');
  const [algorithm, setAlgorithm] = useState<string>('');
  const [version, setVersion] = useState<string>('');
  const [algorithmOptions, setAlgorithmOptions] = useState<
    { value: string; label: string; uuid: string }[]
  >([]);
  const [versionOptions, setVersionOptions] = useState<{ value: string; label: string }[]>([]);
  const [loadingAlgorithms, setLoadingAlgorithms] = useState(false);
  const [loadingVersions, setLoadingVersions] = useState(false);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const nextFiles = Array.from(files);
    if (nextFiles.length === 0) return;

    setItems((prev) => {
      const existingNames = new Set(prev.map((item) => item.name));
      const appended = nextFiles
        .filter((file) => !existingNames.has(file.name))
        .map((file) => ({
          id: `${file.name}-${file.size}-${file.lastModified}`,
          file,
          name: file.name,
          sizeLabel: formatFileSize(file.size),
        }));
      return [...prev, ...appended];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (!facility) {
        event.dataTransfer.dropEffect = 'none';
        return;
      }
      const { files } = event.dataTransfer;
      if (files && files.length > 0) {
        handleFiles(files);
      }
    },
    [facility, handleFiles]
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!facility) {
      event.dataTransfer.dropEffect = 'none';
    }
  }, [facility]);

  useEffect(() => {
    const fetchAlgorithms = async () => {
      setLoadingAlgorithms(true);
      try {
        const response = await getCompressionTypes({
          processingUnit: processingMethod.toUpperCase(),
        });

        if (response.isSuccess && response.result) {
          const options = response.result.map((item: CompressionTypeItem) => ({
            value: item.type,
            label: item.type,
            uuid: item.compressionTypeUuid,
          }));
          setAlgorithmOptions(options);

          if (options.length > 0) {
            const current = options.find((opt) => opt.value === algorithm);
            const nextAlgorithm = current ? current.value : options[0].value;
            if (nextAlgorithm !== algorithm) {
              setAlgorithm(nextAlgorithm);
            }
          } else if (algorithm) {
            setAlgorithm('');
          }
        } else {
          setAlgorithmOptions([]);
          if (algorithm) {
            setAlgorithm('');
          }
        }
      } catch (error) {
        console.error('알고리즘 조회 실패:', error);
        setAlgorithmOptions([]);
        if (algorithm) {
          setAlgorithm('');
        }
      } finally {
        setLoadingAlgorithms(false);
      }
    };

    fetchAlgorithms();
  }, [processingMethod]);

  useEffect(() => {
    const selected = algorithmOptions.find((opt) => opt.value === algorithm);
    if (!selected) {
      setVersionOptions([]);
      if (version) {
        setVersion('');
      }
      return;
    }

    const fetchVersions = async () => {
      setLoadingVersions(true);
      try {
        const response = await getCompressionTypeVersions({
          compressionTypeUuid: selected.uuid,
        });

        if (response.isSuccess && response.result) {
          const options = response.result.map((item: CompressionTypeVersionItem) => ({
            value: item.version.toString(),
            label: `Version ${item.version}`,
          }));
          setVersionOptions(options);

          if (options.length > 0) {
            const current = options.find((opt) => opt.value === version);
            const nextVersion = current ? current.value : options[0].value;
            if (nextVersion !== version) {
              setVersion(nextVersion);
            }
          } else if (version) {
            setVersion('');
          }
        } else {
          setVersionOptions([]);
          if (version) {
            setVersion('');
          }
        }
      } catch (error) {
        console.error('버전 조회 실패:', error);
        setVersionOptions([]);
        if (version) {
          setVersion('');
        }
      } finally {
        setLoadingVersions(false);
      }
    };

    fetchVersions();
  }, [algorithm, algorithmOptions, version]);

  const handleSubmit = useCallback(() => {
    if (!facility || items.length === 0 || !algorithm || !version) return;
    onSubmit?.({
      facilityId: facility.id,
      files: items.map((item) => item.file),
      processingMethod,
      algorithm,
      version,
    });
    setItems([]);
  }, [facility, items, onSubmit, algorithm, version, processingMethod]);

  const isSubmitDisabled = useMemo(
    () => !facility || items.length === 0 || !algorithm || !version,
    [facility, items.length, algorithm, version]
  );

  return (
    <div className="space-y-4">
      <CommonContainerBox className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-900">설비 작업 업로드</h4>
            <p className="mt-1 text-xs text-gray-500">파일 선택, 처리 옵션 지정 후 작업대기열에 추가하세요.</p>
          </div>
          <CommonButton
            type="button"
            variant="blue"
            className="px-4 py-2 text-sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={!facility}
          >
            이미지 업로드
          </CommonButton>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".bmp,.png,.jpg,.jpeg"
          multiple
          className="hidden"
          onChange={(event) => {
            const { files } = event.target;
            if (files) {
              handleFiles(files);
              event.target.value = '';
            }
          }}
        />

        <div
          className={`rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
            facility ? 'border-gray-200 bg-gray-50/80' : 'border-gray-200 bg-gray-100'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#0059FF] shadow-sm">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 12V4m0 0L8 8m4-4l4 4" />
            </svg>
          </div>
          <div className="mt-4 text-sm text-gray-700">
            {facility ? (
              <>
                <p className="font-medium text-gray-900">이미지를 드래그하거나 업로드 버튼으로 선택하세요.</p>
                <p className="text-xs text-gray-500">지원 형식: BMP, PNG, JPG (최대 50MB)</p>
              </>
            ) : (
              <p className="text-sm text-gray-500">설비를 선택하면 업로드할 수 있습니다.</p>
            )}
          </div>
        </div>

        {items.length > 0 ? (
          <div className="space-y-4">
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.sizeLabel}</p>
                  </div>
                  <button
                    type="button"
                    className="rounded-full p-2 text-gray-400 transition-colors hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    onClick={() => removeItem(item.id)}
                    aria-label={`${item.name} 제거`}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <div className="grid gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-gray-700">알고리즘</span>
                  <CommonDropdown
                    options={algorithmOptions.map((opt) => ({ value: opt.value, label: opt.label }))}
                    value={algorithm}
                    onChange={(value) => setAlgorithm(value)}
                    placeholder={loadingAlgorithms ? '불러오는 중...' : '알고리즘 선택'}
                    disabled={loadingAlgorithms || algorithmOptions.length === 0}
                    className="min-w-[200px]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-gray-700">버전</span>
                  <CommonDropdown
                    options={versionOptions}
                    value={version}
                    onChange={(value) => setVersion(value)}
                    placeholder={loadingVersions ? '불러오는 중...' : '버전 선택'}
                    disabled={loadingVersions || versionOptions.length === 0}
                    className="min-w-[180px]"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">처리방식</span>
                  <div className="flex items-center gap-2">
                    <RadioButton
                      name="facility-processing-method"
                      value="cpu"
                      label="CPU"
                      checked={processingMethod === 'CPU'}
                      onChange={() => setProcessingMethod('CPU')}
                    />
                    <RadioButton
                      name="facility-processing-method"
                      value="gpu"
                      label="GPU"
                      checked={processingMethod === 'GPU'}
                      onChange={() => setProcessingMethod('GPU')}
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap justify-between gap-2 text-sm text-gray-600">
                <div>
                  <span className="font-medium text-gray-700">선택된 파일: </span>
                  {items.length}개
                </div>
                <div>
                  <span className="font-medium text-gray-700">총 용량: </span>
                  {formatFileSize(items.reduce((sum, item) => sum + item.file.size, 0))}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <CommonButton
                type="button"
                variant="blue"
                className="px-4 py-2 text-sm"
                onClick={handleSubmit}
                disabled={isSubmitDisabled}
              >
                작업대기열 추가
              </CommonButton>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-500">
            업로드할 이미지 파일을 선택하면 목록과 처리 옵션이 여기에 표시됩니다.
          </div>
        )}
      </CommonContainerBox>
    </div>
  );
}
