'use client';

import React, { useEffect, useState } from 'react';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import CommonDropdown from '@/components/ui/CommonDropdown';
import RadioButton from '@/components/ui/RadioButton';
import { getCompressionTypes, getCompressionTypeVersions } from '@/service/imageCompressor';
import type { CompressionTypeItem, CompressionTypeVersionItem } from '@/types/imageCompressor';

interface PerformanceSimulatorSettingsProps {
  slotIndex: number;
  settings: {
    processingMethod: 'cpu' | 'gpu';
    algorithm: string;
    version: string;
  };
  onSettingsChange: (
    update: Partial<{
      processingMethod: 'cpu' | 'gpu';
      algorithm: string;
      version: string;
    }>
  ) => void;
}

interface AlgorithmOption {
  value: string;
  label: string;
  uuid: string;
}

export default function PerformanceSimulatorSettings({
  slotIndex,
  settings,
  onSettingsChange,
}: PerformanceSimulatorSettingsProps) {
  const [algorithmOptions, setAlgorithmOptions] = useState<AlgorithmOption[]>([]);
  const [versionOptions, setVersionOptions] = useState<{ value: string; label: string }[]>([]);
  const [loadingAlgorithms, setLoadingAlgorithms] = useState(false);
  const [loadingVersions, setLoadingVersions] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const fetchAlgorithms = async () => {
      setLoadingAlgorithms(true);
      try {
        const response = await getCompressionTypes({ processingUnit: settings.processingMethod.toUpperCase() });
        if (response.isSuccess && response.result && !isCancelled) {
          const options = response.result.map((item: CompressionTypeItem) => ({
            value: item.type,
            label: item.type,
            uuid: item.compressionTypeUuid,
          }));
          setAlgorithmOptions(options);

          if (options.length) {
            const existing = options.find((option) => option.value === settings.algorithm);
            const nextAlgorithm = existing ? existing.value : options[0].value;
            if (nextAlgorithm !== settings.algorithm) {
              onSettingsChange({ algorithm: nextAlgorithm });
            }
          } else if (settings.algorithm) {
            onSettingsChange({ algorithm: '' });
          }
        }
      } catch (error) {
        console.error('알고리즘 정보를 불러오지 못했습니다.', error);
        if (!isCancelled) {
          setAlgorithmOptions([]);
          if (settings.algorithm) {
            onSettingsChange({ algorithm: '' });
          }
        }
      } finally {
        if (!isCancelled) {
          setLoadingAlgorithms(false);
        }
      }
    };

    fetchAlgorithms();

    return () => {
      isCancelled = true;
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

    const selectedAlgorithm = algorithmOptions.find((option) => option.value === settings.algorithm);
    if (!selectedAlgorithm) {
      setVersionOptions([]);
      if (settings.version) {
        onSettingsChange({ version: '' });
      }
      return;
    }

    let isCancelled = false;

    const fetchVersions = async () => {
      setLoadingVersions(true);
      try {
        const response = await getCompressionTypeVersions({ compressionTypeUuid: selectedAlgorithm.uuid });
        if (response.isSuccess && response.result && !isCancelled) {
          const options = response.result.map((item: CompressionTypeVersionItem) => ({
            value: item.version.toString(),
            label: `Version ${item.version}`,
          }));
          setVersionOptions(options);

          if (options.length) {
            const existing = options.find((option) => option.value === settings.version);
            const nextVersion = existing ? existing.value : options[0].value;
            if (nextVersion !== settings.version) {
              onSettingsChange({ version: nextVersion });
            }
          } else if (settings.version) {
            onSettingsChange({ version: '' });
          }
        }
      } catch (error) {
        console.error('압축 버전 정보를 불러오지 못했습니다.', error);
        if (!isCancelled) {
          setVersionOptions([]);
          if (settings.version) {
            onSettingsChange({ version: '' });
          }
        }
      } finally {
        if (!isCancelled) {
          setLoadingVersions(false);
        }
      }
    };

    fetchVersions();

    return () => {
      isCancelled = true;
    };
  }, [settings.algorithm, settings.version, algorithmOptions, onSettingsChange]);

  return (
    <CommonContainerBox className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">슬롯 {slotIndex + 1} 압축 설정</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <CommonDropdown
          label="알고리즘"
          options={algorithmOptions.map((option) => ({ value: option.value, label: option.label }))}
          value={settings.algorithm}
          onChange={(value) => onSettingsChange({ algorithm: value })}
          placeholder={loadingAlgorithms ? '로딩 중...' : algorithmOptions.length ? '알고리즘 선택' : '데이터 없음'}
        />
        <CommonDropdown
          label="버전"
          options={versionOptions}
          value={settings.version}
          onChange={(value) => onSettingsChange({ version: value })}
          placeholder={loadingVersions ? '로딩 중...' : versionOptions.length ? '버전 선택' : '알고리즘을 먼저 선택하세요'}
          disabled={!settings.algorithm || !versionOptions.length}
        />
        <div>
          <label className="mb-3 block text-sm font-medium text-gray-700">처리방식</label>
          <div className="flex gap-4">
            <RadioButton
              name={`processing-${slotIndex}`}
              value="cpu"
              label="CPU"
              checked={settings.processingMethod === 'cpu'}
              onChange={(value) => onSettingsChange({ processingMethod: value as 'cpu' | 'gpu' })}
            />
            <RadioButton
              name={`processing-${slotIndex}`}
              value="gpu"
              label="GPU"
              checked={settings.processingMethod === 'gpu'}
              onChange={(value) => onSettingsChange({ processingMethod: value as 'cpu' | 'gpu' })}
            />
          </div>
        </div>
      </div>
    </CommonContainerBox>
  );
}
