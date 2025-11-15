'use client';

import React, { useEffect, useMemo, useState } from 'react';
import CommonDropdown from '@/components/ui/CommonDropdown';
import RadioButton from '@/components/ui/RadioButton';
import type { Facility } from '../types';
import { getCompressionTypes, getCompressionTypeVersions } from '@/service/imageCompressor';
import type { CompressionTypeItem, CompressionTypeVersionItem } from '@/types/imageCompressor';

type CompressionSettings = {
  processingMethod: 'cpu' | 'gpu';
  algorithm: string;
  version: string;
};

interface AlgorithmOptionsProps {
  facility: Facility;
  settings: CompressionSettings;
  onSettingsChange: (update: Partial<CompressionSettings>) => void;
  className?: string;
}

interface AlgorithmOption {
  value: string;
  label: string;
  uuid: string;
}

export default function AlgorithmOptions({
  facility,
  settings,
  onSettingsChange,
  className = '',
}: AlgorithmOptionsProps) {
  const [algorithmOptions, setAlgorithmOptions] = useState<AlgorithmOption[]>([]);
  const [versionOptions, setVersionOptions] = useState<{ value: string; label: string }[]>([]);
  const [loadingAlgorithms, setLoadingAlgorithms] = useState(false);
  const [loadingVersions, setLoadingVersions] = useState(false);

  const processingUnitLabel = useMemo(
    () => (settings.processingMethod === 'cpu' ? 'CPU' : 'GPU'),
    [settings.processingMethod]
  );

  useEffect(() => {
    let cancelled = false;

    const fetchAlgorithms = async () => {
      setLoadingAlgorithms(true);
      try {
        const response = await getCompressionTypes({
          processingUnit: settings.processingMethod.toUpperCase(),
        });
        if (!cancelled && response.isSuccess && response.result) {
          const options = response.result.map((item: CompressionTypeItem) => ({
            value: item.type,
            label: item.type,
            uuid: item.compressionTypeUuid,
          }));
          setAlgorithmOptions(options);

          if (options.length > 0) {
            const matched = options.find((opt) => opt.value === settings.algorithm);
            const nextAlgorithm = matched ? matched.value : options[0].value;
            if (nextAlgorithm !== settings.algorithm) {
              onSettingsChange({ algorithm: nextAlgorithm, version: '' });
            }
          } else if (settings.algorithm) {
            onSettingsChange({ algorithm: '', version: '' });
          }
        }
      } catch (error) {
        console.error('압축 알고리즘 조회 실패:', error);
        if (!cancelled) {
          setAlgorithmOptions([]);
          if (settings.algorithm) {
            onSettingsChange({ algorithm: '', version: '' });
          }
        }
      } finally {
        if (!cancelled) {
          setLoadingAlgorithms(false);
        }
      }
    };

    fetchAlgorithms();

    return () => {
      cancelled = true;
    };
  }, [settings.processingMethod, settings.algorithm, onSettingsChange]);

  useEffect(() => {
    if (!settings.algorithm) {
      setVersionOptions([]);
      if (settings.version) {
        onSettingsChange({ version: '' });
      }
      return;
    }

    const selected = algorithmOptions.find((opt) => opt.value === settings.algorithm);
    if (!selected) {
      setVersionOptions([]);
      if (settings.version) {
        onSettingsChange({ version: '' });
      }
      return;
    }

    let cancelled = false;

    const fetchVersions = async () => {
      setLoadingVersions(true);
      try {
        const response = await getCompressionTypeVersions({
          compressionTypeUuid: selected.uuid,
        });
        if (!cancelled && response.isSuccess && response.result) {
          const options = response.result.map((item: CompressionTypeVersionItem) => ({
            value: item.version.toString(),
            label: `Version ${item.version}`,
          }));
          setVersionOptions(options);

          if (options.length > 0) {
            const matched = options.find((opt) => opt.value === settings.version);
            const nextVersion = matched ? matched.value : options[0].value;
            if (nextVersion !== settings.version) {
              onSettingsChange({ version: nextVersion });
            }
          } else if (settings.version) {
            onSettingsChange({ version: '' });
          }
        }
      } catch (error) {
        console.error('압축 버전 조회 실패:', error);
        if (!cancelled) {
          setVersionOptions([]);
          if (settings.version) {
            onSettingsChange({ version: '' });
          }
        }
      } finally {
        if (!cancelled) {
          setLoadingVersions(false);
        }
      }
    };

    fetchVersions();

    return () => {
      cancelled = true;
    };
  }, [settings.algorithm, settings.version, algorithmOptions, onSettingsChange]);

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex flex-col gap-1 min-w-[200px]">
            <span className="text-sm font-medium text-gray-700">알고리즘</span>
            <CommonDropdown
              options={algorithmOptions.map((option) => ({ value: option.value, label: option.label }))}
              value={settings.algorithm}
              onChange={(value) => onSettingsChange({ algorithm: value })}
              placeholder={loadingAlgorithms ? '로딩 중...' : algorithmOptions.length ? '알고리즘 선택' : '데이터 없음'}
              disabled={loadingAlgorithms || algorithmOptions.length === 0}
            />
          </div>
          <div className="flex flex-col gap-1 min-w-[180px]">
            <span className="text-sm font-medium text-gray-700">버전</span>
            <CommonDropdown
              options={versionOptions}
              value={settings.version}
              onChange={(value) => onSettingsChange({ version: value })}
              placeholder={
                loadingVersions
                  ? '로딩 중...'
                  : versionOptions.length
                    ? '버전 선택'
                    : '알고리즘을 먼저 선택하세요'
              }
              disabled={loadingVersions || !settings.algorithm || !versionOptions.length}
            />
          </div>
          <div className="flex flex-col gap-1 min-w-[220px]">
            <span className="text-sm font-medium text-gray-700">처리방식</span>
            <div className="flex items-center gap-4">
              <RadioButton
                name={`facility-comparison-processing-${facility.id}`}
                value="cpu"
                label="CPU"
                checked={settings.processingMethod === 'cpu'}
                onChange={(value) => onSettingsChange({ processingMethod: value as 'cpu' | 'gpu' })}
                className="min-w-[96px]"
              />
              <RadioButton
                name={`facility-comparison-processing-${facility.id}`}
                value="gpu"
                label="GPU"
                checked={settings.processingMethod === 'gpu'}
                onChange={(value) => onSettingsChange({ processingMethod: value as 'cpu' | 'gpu' })}
                className="min-w-[96px]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

