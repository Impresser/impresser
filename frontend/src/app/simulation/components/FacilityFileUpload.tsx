'use client';

import React, { useMemo, useState, useCallback } from 'react';
import CompressionSettings from '@/app/imagecompressor/components/CompressionSettings';
import type { FileInfo } from '@/types/imageCompressor';
import CommonButton from '@/components/ui/CommonButton';

interface FacilityFileUploadProps {
  settings: {
    processingMethod: 'cpu' | 'gpu';
    algorithm: string;
    version: string;
  };
  onSubmit?: (payload: {
    files: File[];
    processingMethod: string;
    algorithm: string;
    version: string;
  }) => void;
  submitLabel?: string;
}

interface UploadEntry {
  file: File;
  info: FileInfo;
}

const readBmpDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const view = new DataView(arrayBuffer);
        const signature = String.fromCharCode(view.getUint8(0), view.getUint8(1));
        if (signature !== 'BM') {
          reject(new Error('유효하지 않은 BMP 파일입니다.'));
          return;
        }
        const width = view.getInt32(18, true);
        const height = view.getInt32(22, true);
        resolve({ width: Math.abs(width), height: Math.abs(height) });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.readAsArrayBuffer(file.slice(0, 26));
  });
};

const createPreview = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    if (file.size > 10 * 1024 * 1024) {
      resolve('');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(e.target?.result as string);
      img.onerror = () => resolve('');
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
};

export default function FacilityFileUpload({ settings, onSubmit, submitLabel = '대기열 추가' }: FacilityFileUploadProps) {
  const [uploads, setUploads] = useState<UploadEntry[]>([]);

  const selectedFiles = useMemo<FileInfo[]>(
    () => uploads.map((entry) => entry.info),
    [uploads]
  );

  const handleFileSelect = useCallback((files: File[]) => {
    const validFiles = files.filter((file) =>
      file.type === 'image/bmp' || file.name.toLowerCase().endsWith('.bmp')
    );

    if (validFiles.length !== files.length) {
      alert('BMP 파일만 업로드 가능합니다.');
    }

    if (!validFiles.length) return;

    (async () => {
      const entries = await Promise.all(
        validFiles.map(async (file) => {
          let dimensions = { width: 0, height: 0 };
          try {
            dimensions = await readBmpDimensions(file);
          } catch (error) {
            console.error(`${file.name} 크기 추출 실패:`, error);
          }

          const preview = await createPreview(file);

          const info: FileInfo = {
            name: file.name,
            size: file.size,
            format: 'BMP',
            dimensions,
            preview,
          };

          return { file, info };
        })
      );

      setUploads((prev) => [...prev, ...entries]);
    })();
  }, []);

  const handleFileRemove = useCallback((index: number) => {
    setUploads((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  const handleFileReorder = useCallback((fromIndex: number, toIndex: number) => {
    setUploads((prev) => {
      const next = [...prev];
      const [removed] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, removed);
      return next;
    });
  }, []);

  const handleAddToQueue = useCallback(() => {
    if (!uploads.length || !settings.algorithm || !settings.version) {
      alert('파일과 알고리즘, 버전을 모두 선택해주세요.');
      return;
    }

    onSubmit?.({
      files: uploads.map((entry) => entry.file),
      processingMethod: settings.processingMethod.toUpperCase(),
      algorithm: settings.algorithm,
      version: settings.version,
    });

    setUploads([]);
  }, [uploads, settings, onSubmit]);

  const isSubmitDisabled = !uploads.length || !settings.algorithm || !settings.version;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
        <h4 className="mb-3 text-sm font-semibold text-gray-800">선택된 압축방법</h4>
        <div className="grid gap-2 text-sm text-gray-700 md:grid-cols-3">
          <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-sm">
            <span className="text-xs font-medium text-gray-500">알고리즘</span>
            <span className="text-sm font-semibold text-gray-900">
              {settings.algorithm || '미선택'}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-sm">
            <span className="text-xs font-medium text-gray-500">버전</span>
            <span className="text-sm font-semibold text-gray-900">
              {settings.version || '미선택'}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-sm">
            <span className="text-xs font-medium text-gray-500">처리방식</span>
            <span className="text-sm font-semibold text-gray-900">
              {settings.processingMethod.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
      <CompressionSettings
        selectedFiles={selectedFiles}
        processingMethod={settings.processingMethod}
        algorithm={settings.algorithm}
        version={settings.version}
        onFileSelect={handleFileSelect}
        onFileRemove={handleFileRemove}
        onFileReorder={handleFileReorder}
        onProcessingMethodChange={(_value) => {}}
        onAlgorithmChange={(_value) => {}}
        onVersionChange={(_value) => {}}
        onAddToQueue={handleAddToQueue}
        hideTitle
        hideAddButton
        hideMethodSection
      />
      <div className="flex justify-end">
        <CommonButton
          type="button"
          variant={isSubmitDisabled ? 'gray' : 'blue'}
          className="px-6 py-2"
          onClick={handleAddToQueue}
          disabled={isSubmitDisabled}
        >
          {submitLabel}
        </CommonButton>
      </div>
    </div>
  );
}

