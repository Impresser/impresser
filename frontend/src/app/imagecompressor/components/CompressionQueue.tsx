'use client';

import React, { useState, useEffect } from 'react';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import CommonTableFrame from '@/components/ui/CommonTableFrame';
import { QueueItem } from '@/components/ui/CommonTable';
import Button from '@/components/ui/CommonButton';
import CommonDropdown from '@/components/ui/CommonDropdown';
import RadioButton from '@/components/ui/RadioButton';
import { getCompressionTypes, getCompressionTypeVersions } from '@/service/imageCompressor';
import { CompressionTypeItem, CompressionTypeVersionItem } from '@/types/imageCompressor';

interface CompressionQueueProps {
  queue: QueueItem[];
  onStartCompression: () => void;
  onUpdateQueueItem: (id: string, field: 'algorithm' | 'version' | 'processingMethod', value: string) => void;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

const formatDateTime = (date: Date): string => {
  const formatter = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  const parts = formatter.formatToParts(date).reduce<Record<string, string>>((acc, p) => {
    if (p.type !== 'literal') acc[p.type] = p.value;
    return acc;
  }, {});
  
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
};

export default function CompressionQueue({
  queue,
  onStartCompression,
  onUpdateQueueItem,
}: CompressionQueueProps) {
  // 처리방식별 알고리즘 옵션 캐시 (UUID 포함)
  const [algorithmOptionsCache, setAlgorithmOptionsCache] = useState<Record<string, { value: string; label: string; uuid: string }[]>>({});
  // 알고리즘별 버전 옵션 캐시
  const [versionOptionsCache, setVersionOptionsCache] = useState<Record<string, { value: string; label: string }[]>>({});
  
  // 압축이 진행 중인지 확인
  const isCompressionInProgress = queue.some((item) => item.status === '진행');

  // 처리방식별 알고리즘 옵션 가져오기
  const getAlgorithmOptions = async (processingUnit: string) => {
    const cacheKey = processingUnit.toUpperCase();
    
    // 캐시에 있으면 반환
    if (algorithmOptionsCache[cacheKey]) {
      return algorithmOptionsCache[cacheKey];
    }
    
    try {
      const response = await getCompressionTypes({
        processingUnit: cacheKey,
      });
      
      if (response.isSuccess && response.result) {
        const options = response.result.map((item: CompressionTypeItem) => ({
          value: item.type,
          label: item.type,
          uuid: item.compressionTypeUuid,
        }));
        
        // 캐시에 저장
        setAlgorithmOptionsCache((prev) => ({
          ...prev,
          [cacheKey]: options,
        }));
        
        return options;
      }
    } catch (error) {
      console.error('알고리즘 조회 실패:', error);
    }
    
    return [];
  };

  // 필요한 처리방식의 알고리즘 옵션 미리 로드
  useEffect(() => {
    const processingUnits = new Set(
      queue
        .filter(item => item.status === '대기')
        .map(item => item.processingMethod.toUpperCase())
    );
    
    processingUnits.forEach((unit) => {
      if (!algorithmOptionsCache[unit]) {
        getAlgorithmOptions(unit);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue]);

  // 알고리즘별 버전 옵션 가져오기
  const getVersionOptions = async (compressionTypeUuid: string) => {
    // 캐시에 있으면 반환
    if (versionOptionsCache[compressionTypeUuid]) {
      return versionOptionsCache[compressionTypeUuid];
    }
    
    try {
      const response = await getCompressionTypeVersions({
        compressionTypeUuid,
      });
      
      if (response.isSuccess && response.result) {
        const options = response.result.map((item: CompressionTypeVersionItem) => ({
          value: item.version.toString(),
          label: `Version ${item.version}`,
        }));
        
        // 캐시에 저장
        setVersionOptionsCache((prev) => ({
          ...prev,
          [compressionTypeUuid]: options,
        }));
        
        return options;
      }
    } catch (error) {
      console.error('버전 조회 실패:', error);
    }
    
    return [];
  };
  
  return (
    <div className="mt-8">
      <h1 className="text-lg font-bold text-gray-900 mb-6">압축대기열</h1>

      <CommonContainerBox>
        <CommonTableFrame
          header={
            <thead className="bg-gray-50">
              <tr className="text-gray-700">
                <th className="text-left font-semibold text-xs tracking-wide py-2 px-3">파일명</th>
                <th className="text-left font-semibold text-xs tracking-wide py-2 px-3">알고리즘</th>
                <th className="text-center font-semibold text-xs tracking-wide py-2 px-3">버전</th>
                <th className="text-center font-semibold text-xs tracking-wide py-2 px-3 whitespace-nowrap">처리방식</th>
                <th className="text-center font-semibold text-xs tracking-wide py-2 px-3">파일용량</th>
                <th className="text-center font-semibold text-xs tracking-wide py-2 px-3">상태</th>
                <th className="text-center font-semibold text-xs tracking-wide py-2 px-3">담당자</th>
                <th className="text-center font-semibold text-xs tracking-wide py-2 px-3">시작시각</th>
                <th className="text-center font-semibold text-xs tracking-wide py-2 px-3">경과시간</th>
                <th className="text-center font-semibold text-xs tracking-wide py-2 px-3">예상시간</th>
                <th className="text-center font-semibold text-xs tracking-wide py-2 px-3">진행률</th>
              </tr>
            </thead>
          }
          body={
            <tbody>
              {queue.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-gray-500 text-sm">
                    대기열에 추가된 항목이 없습니다.
                  </td>
                </tr>
              ) : (
                queue.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-100 text-sm text-gray-900 hover:bg-gray-50"
                  >
                    <td className="py-3 px-3 truncate max-w-xs" title={item.fileName}>
                      {item.fileName}
                    </td>
                    <td className="py-3 px-3">
                      {item.status === '대기' && !isCompressionInProgress ? (
                        <AlgorithmDropdown
                          processingUnit={item.processingMethod}
                          value={item.algorithm}
                          onChange={(value) => onUpdateQueueItem(item.id, 'algorithm', value)}
                          getAlgorithmOptions={getAlgorithmOptions}
                          algorithmOptionsCache={algorithmOptionsCache}
                        />
                      ) : (
                        <span className="truncate max-w-xs" title={item.algorithm}>
                          {item.algorithm}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {item.status === '대기' && !isCompressionInProgress ? (
                        <div className="flex justify-center">
                          <VersionDropdown
                            algorithm={item.algorithm}
                            processingUnit={item.processingMethod}
                            value={item.version}
                            onChange={(value) => onUpdateQueueItem(item.id, 'version', value)}
                            getAlgorithmOptions={getAlgorithmOptions}
                            getVersionOptions={getVersionOptions}
                            algorithmOptionsCache={algorithmOptionsCache}
                            versionOptionsCache={versionOptionsCache}
                          />
                        </div>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 border border-gray-200 px-2 py-0.5 text-[11px]">
                          v{item.version}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {item.status === '대기' && !isCompressionInProgress ? (
                        <div className="flex gap-2 justify-center">
                          <RadioButton
                            name={`processingMethod-${item.id}`}
                            value="cpu"
                            label="CPU"
                            checked={item.processingMethod.toUpperCase() === 'CPU'}
                            onChange={(value) => onUpdateQueueItem(item.id, 'processingMethod', value.toUpperCase())}
                          />
                          <RadioButton
                            name={`processingMethod-${item.id}`}
                            value="gpu"
                            label="GPU"
                            checked={item.processingMethod.toUpperCase() === 'GPU'}
                            onChange={(value) => onUpdateQueueItem(item.id, 'processingMethod', value.toUpperCase())}
                          />
                        </div>
                      ) : (
                        <span className={`${item.processingMethod === 'GPU' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'} inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]`}>
                          {item.processingMethod}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">{formatFileSize(item.fileSize)}</td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${
                          item.status === '진행'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-gray-100 text-gray-700 border-gray-200'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">{item.assignedUser}</td>
                    <td className="py-3 px-3 text-center">
                      {item.startTime ? formatDateTime(item.startTime) : '-'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {item.status === '진행' ? formatTime(item.elapsedTime) : '-'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {item.estimatedTime > 0 ? formatTime(item.estimatedTime) : '-'}
                    </td>
                    <td className="py-3 px-3">
                      {item.status === '진행' ? (
                        <div className="relative flex-1 bg-gray-200 rounded h-4 min-w-[100px]">
                          <div
                            className="bg-blue-600 h-4 rounded transition-all duration-300"
                            style={{ width: `${item.progress}%` }}
                          />
                          <span className={`absolute inset-0 flex items-center justify-center text-xs font-medium ${
                            item.progress > 45 ? 'text-white' : 'text-gray-700'
                          }`}>
                            {item.progress}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-center">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          }
        />
      </CommonContainerBox>
      {/* 압축 버튼 (우측 정렬) */}
        {queue.length > 0 && (
          <div className="flex justify-end mt-4">
            <Button 
              onClick={onStartCompression} 
              variant={(!queue.some((item) => item.status === '대기') || isCompressionInProgress) ? "gray" : "blue"}
              disabled={!queue.some((item) => item.status === '대기') || isCompressionInProgress}
            >
              압축
            </Button>
          </div>
        )}
    </div>
  );
}

// 알고리즘 드롭다운 컴포넌트
interface AlgorithmDropdownProps {
  processingUnit: string;
  value: string;
  onChange: (value: string) => void;
  getAlgorithmOptions: (processingUnit: string) => Promise<{ value: string; label: string; uuid: string }[]>;
  algorithmOptionsCache: Record<string, { value: string; label: string; uuid: string }[]>;
}

function AlgorithmDropdown({
  processingUnit,
  value,
  onChange,
  getAlgorithmOptions,
  algorithmOptionsCache,
}: AlgorithmDropdownProps) {
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadOptions = async () => {
      const cacheKey = processingUnit.toUpperCase();
      const cached = algorithmOptionsCache[cacheKey];
      
      if (cached) {
        setOptions(cached);
      } else {
        setLoading(true);
        const opts = await getAlgorithmOptions(processingUnit);
        setOptions(opts);
        setLoading(false);
      }
    };

    loadOptions();
  }, [processingUnit, algorithmOptionsCache, getAlgorithmOptions]);

  return (
    <CommonDropdown
      options={options.map(opt => ({ value: opt.value, label: opt.label }))}
      value={value}
      onChange={onChange}
      className="w-full max-w-[200px]"
      size="sm"
      placeholder={loading ? "로딩 중..." : "알고리즘 선택"}
      disabled={loading || options.length === 0}
    />
  );
}

// 버전 드롭다운 컴포넌트
interface VersionDropdownProps {
  algorithm: string;
  processingUnit: string;
  value: string;
  onChange: (value: string) => void;
  getAlgorithmOptions: (processingUnit: string) => Promise<{ value: string; label: string; uuid: string }[]>;
  getVersionOptions: (compressionTypeUuid: string) => Promise<{ value: string; label: string }[]>;
  algorithmOptionsCache: Record<string, { value: string; label: string; uuid: string }[]>;
  versionOptionsCache: Record<string, { value: string; label: string }[]>;
}

function VersionDropdown({
  algorithm,
  processingUnit,
  value,
  onChange,
  getAlgorithmOptions,
  getVersionOptions,
  algorithmOptionsCache,
  versionOptionsCache,
}: VersionDropdownProps) {
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadOptions = async () => {
      if (!algorithm) {
        setOptions([]);
        return;
      }

      const cacheKey = processingUnit.toUpperCase();
      const algorithmOptions = algorithmOptionsCache[cacheKey] || await getAlgorithmOptions(processingUnit);
      
      const selectedAlgorithm = algorithmOptions.find(opt => opt.value === algorithm);
      if (!selectedAlgorithm) {
        setOptions([]);
        return;
      }

      const cached = versionOptionsCache[selectedAlgorithm.uuid];
      if (cached) {
        setOptions(cached);
      } else {
        setLoading(true);
        const opts = await getVersionOptions(selectedAlgorithm.uuid);
        setOptions(opts);
        setLoading(false);
      }
    };

    loadOptions();
  }, [algorithm, processingUnit, algorithmOptionsCache, versionOptionsCache, getAlgorithmOptions, getVersionOptions]);

  return (
    <CommonDropdown
      options={options}
      value={value}
      onChange={onChange}
      className="w-[110px]"
      size="sm"
      placeholder={loading ? "로딩 중..." : "버전 선택"}
      disabled={loading || options.length === 0}
    />
  );
}


