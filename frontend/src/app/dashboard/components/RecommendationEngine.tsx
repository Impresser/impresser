'use client';

import React, { useEffect, useState } from 'react';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import CommonInput from '@/components/ui/CommonInput01';
import CommonButton from '@/components/ui/CommonButton';
import { useImageCompressorStore } from '@/store/imageCompressorStore';
import { ConvertHistoryItem, ConvertHistoryDetailItem } from '@/types/imageCompressor';
import { getConvertHistoryDetail } from '@/service/imageCompressor';

interface RecommendationResult {
  history: ConvertHistoryItem;
  detail?: ConvertHistoryDetailItem;
  score: number;
  scores: {
    sizeSimilarity: number;
    compressionRatio: number;
    speed: number;
    totalTime: number;
    compressionTime: number;
  };
}

const formatFileSize = (kb: number) => {
  if (kb === 0) return '0.00 KB';
  const k = 1024;
  const sizes = ['KB', 'MB', 'GB'];
  if (kb < k) {
    return (Math.floor(kb * 100) / 100).toFixed(2) + ' ' + sizes[0];
  } else if (kb < k * k) {
    return (Math.floor((kb / k) * 100) / 100).toFixed(2) + ' ' + sizes[1];
  } else {
    return (Math.floor((kb / (k * k)) * 100) / 100).toFixed(2) + ' ' + sizes[2];
  }
};

const formatTime = (seconds: number): string => {
  if (!seconds && seconds !== 0) return '-';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts: string[] = [];
  if (hours > 0) {
    parts.push(`${hours}시간`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}분`);
  }
  if (secs > 0 || parts.length === 0) {
    parts.push(`${secs}초`);
  }
  
  return parts.join(' ');
};

const formatSeconds = (seconds: number): string => {
  if (!seconds && seconds !== 0) return '-';
  return `${seconds.toFixed(2)}초`;
};

export default function RecommendationEngine() {
  const { histories, fetchHistories, loading } = useImageCompressorStore();
  const [fileSize, setFileSize] = useState<string>('');
  const [fileSizeUnit, setFileSizeUnit] = useState<'KB' | 'MB' | 'GB'>('MB');
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [detailData, setDetailData] = useState<Record<string, ConvertHistoryDetailItem>>({});
  const [loadingDetails, setLoadingDetails] = useState<Set<string>>(new Set());
  const [hasSearched, setHasSearched] = useState(false);

  // 컴포넌트 마운트 시 전체 데이터 로드
  useEffect(() => {
    fetchHistories({ page: 0, size: 10000 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 파일 용량을 KB 단위로 변환
  const convertToKB = (size: number, unit: 'KB' | 'MB' | 'GB'): number => {
    switch (unit) {
      case 'KB':
        return size;
      case 'MB':
        return size * 1024;
      case 'GB':
        return size * 1024 * 1024;
      default:
        return size;
    }
  };

  // 추천 알고리즘 실행
  const calculateRecommendations = async () => {
    const sizeValue = parseFloat(fileSize);
    if (isNaN(sizeValue) || sizeValue <= 0) {
      alert('올바른 파일 용량을 입력해주세요.');
      return;
    }

    setHasSearched(true);
    setLoadingRecommendations(true);
    try {
      const inputSizeKB = convertToKB(sizeValue, fileSizeUnit);

      // 1단계: 기본 정보로 1차 필터링 및 점수 계산
      const candidates: Array<{
        history: ConvertHistoryItem;
        preliminaryScore: number;
      }> = [];

      for (const history of histories) {
        if (!history.bmpVolume || history.bmpVolume <= 0) continue;

        // 용량 유사도 계산 (비슷할수록 높은 점수)
        const sizeDiff = Math.abs(history.bmpVolume - inputSizeKB);
        const sizeRatio = Math.min(history.bmpVolume, inputSizeKB) / Math.max(history.bmpVolume, inputSizeKB);
        const sizeSimilarity = sizeRatio * 100; // 0~100 점수

        // 압축률 점수 (높을수록 좋음)
        const compressionRatio = history.compressionRatio || 0;

        // 1차 점수 계산 (용량 유사도 40%, 압축률 30%, 총 소요시간 30%)
        const totalTimeScore = history.elapsedTime && history.elapsedTime > 0
          ? Math.max(0, 100 - (history.elapsedTime / 3600) * 10) // 1시간당 10점 감소, 최소 0점
          : 50; // 데이터 없으면 중간 점수

        const preliminaryScore = 
          sizeSimilarity * 0.4 + 
          compressionRatio * 0.3 + 
          totalTimeScore * 0.3;

        candidates.push({
          history,
          preliminaryScore,
        });
      }

      // 1차 점수로 정렬하여 상위 20개 선택
      candidates.sort((a, b) => b.preliminaryScore - a.preliminaryScore);
      const topCandidates = candidates.slice(0, 20);

      // 2단계: 상위 후보들의 상세 정보 가져오기
      const detailPromises = topCandidates.map(async (candidate) => {
        if (detailData[candidate.history.convertHistoryUuid]) {
          return detailData[candidate.history.convertHistoryUuid];
        }

        setLoadingDetails(prev => new Set(prev).add(candidate.history.convertHistoryUuid));
        try {
          const response = await getConvertHistoryDetail(candidate.history.convertHistoryUuid);
          if (response.isSuccess && response.result) {
            setDetailData(prev => ({
              ...prev,
              [candidate.history.convertHistoryUuid]: response.result,
            }));
            return response.result;
          }
        } catch (error) {
          console.error('상세 조회 실패:', error);
        } finally {
          setLoadingDetails(prev => {
            const newSet = new Set(prev);
            newSet.delete(candidate.history.convertHistoryUuid);
            return newSet;
          });
        }
        return undefined;
      });

      const details = await Promise.all(detailPromises);

      // 3단계: 최종 점수 계산
      const results: RecommendationResult[] = [];

      // 정규화를 위한 최대값 계산
      const maxSpeed = Math.max(
        ...details
          .filter(d => d && d.avgSpeed && d.avgSpeed > 0)
          .map(d => d!.avgSpeed),
        1
      );
      const maxTotalTime = Math.max(
        ...topCandidates
          .filter(c => c.history.elapsedTime && c.history.elapsedTime > 0)
          .map(c => c.history.elapsedTime!),
        1
      );
      const maxCompressionTime = Math.max(
        ...details
          .filter(d => d && d.compressionTime && d.compressionTime > 0)
          .map(d => d!.compressionTime!),
        1
      );

      for (let i = 0; i < topCandidates.length; i++) {
        const candidate = topCandidates[i];
        const detail = details[i];
        const history = candidate.history;

        // 용량 유사도 점수
        const sizeDiff = Math.abs(history.bmpVolume - inputSizeKB);
        const sizeRatio = Math.min(history.bmpVolume, inputSizeKB) / Math.max(history.bmpVolume, inputSizeKB);
        const sizeSimilarity = sizeRatio * 100;

        // 압축률 점수
        const compressionRatio = history.compressionRatio || 0;

        // 속도 점수 (상대적)
        const speedScore = detail && detail.avgSpeed && detail.avgSpeed > 0
          ? (detail.avgSpeed / maxSpeed) * 100
          : 0;

        // 총 소요시간 점수 (짧을수록 높음)
        const totalTimeScore = history.elapsedTime && history.elapsedTime > 0
          ? (1 - history.elapsedTime / maxTotalTime) * 100
          : 0;

        // 압축 소요시간 점수 (짧을수록 높음)
        const compressionTimeScore = detail && detail.compressionTime && detail.compressionTime > 0
          ? (1 - detail.compressionTime / maxCompressionTime) * 100
          : 0;

        // 최종 점수 계산 (가중치 적용)
        const finalScore = 
          sizeSimilarity * 0.3 +        // 용량 유사도 30%
          compressionRatio * 0.25 +     // 압축률 25%
          speedScore * 0.2 +            // 속도 20%
          totalTimeScore * 0.15 +       // 총 소요시간 15%
          compressionTimeScore * 0.1;   // 압축 소요시간 10%

        results.push({
          history,
          detail,
          score: finalScore,
          scores: {
            sizeSimilarity,
            compressionRatio,
            speed: speedScore,
            totalTime: totalTimeScore,
            compressionTime: compressionTimeScore,
          },
        });
      }

      // 최종 점수로 정렬
      results.sort((a, b) => b.score - a.score);

      setRecommendations(results.slice(0, 10)); // 상위 10개만 표시
    } catch (error) {
      console.error('추천 계산 실패:', error);
      alert('추천 계산 중 오류가 발생했습니다.');
    } finally {
      setLoadingRecommendations(false);
    }
  };

  return (
    <div className="mt-8">
      <h1 className="text-xl font-bold text-gray-900 mb-3">알고리즘 추천</h1>

      <CommonContainerBox>
        <div className="">
          {/* 입력 섹션 */}
          <div className="flex items-center gap-4 flex-nowrap">
            <div className="flex items-center gap-5 flex-nowrap">
              <label className="text-md font-semibold text-gray-700 whitespace-nowrap">파일 용량:</label>
              <CommonInput
                type="number"
                value={fileSize}
                onChange={(e) => setFileSize(e.target.value)}
                placeholder="용량 입력"
                className="w-32 shrink-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                min="0"
                step="0.01"
              />
              <div className="flex gap-1 shrink-0">
                {(['KB', 'MB', 'GB'] as const).map((unit) => (
                  <CommonButton
                    key={unit}
                    type="button"
                    variant="outline"
                    onClick={() => setFileSizeUnit(unit)}
                    className={`px-3 py-2 rounded-full text-sm font-semibold shrink-0 ${
                      fileSizeUnit === unit
                        ? 'border-2 border-blue-600 text-blue-600 bg-white '
                        : 'border border-gray-300 text-gray-700 bg-white'
                    }`}
                  >
                    {unit}
                  </CommonButton>
                ))}
              </div>
            </div>
            <CommonButton
              onClick={calculateRecommendations}
              disabled={loadingRecommendations || loading || !fileSize}
              className="px-6 shrink-0"
            >
              {loadingRecommendations ? '계산 중...' : '추천 받기'}
            </CommonButton>
          </div>

          {/* 추천 알고리즘 설명 */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              추천 알고리즘 기준
            </h2>
            <div className="space-y-2 text-sm text-gray-700">
              <p className="mb-3 text-gray-600">
                입력하신 파일 용량과 유사한 압축 내역을 분석하여 최적의 알고리즘을 추천합니다.
                다음 5가지 기준을 종합하여 점수를 계산합니다:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-blue-600 min-w-20">용량 유사도 (30%)</span>
                  <span className="text-gray-600">입력한 파일 용량과 비슷한 압축 전 용량을 가진 내역을 우선 추천합니다.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-green-600 min-w-20">압축률 (25%)</span>
                  <span className="text-gray-600">압축률이 높을수록 더 많은 용량을 절약할 수 있습니다.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-purple-600 min-w-20">압축 속도 (20%)</span>
                  <span className="text-gray-600">평균 압축 속도가 빠를수록 처리 시간이 단축됩니다.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-orange-600 min-w-20">총 소요시간 (15%)</span>
                  <span className="text-gray-600">요청부터 완료까지의 총 소요시간이 짧을수록 좋습니다.</span>
                </div>
                <div className="flex items-start gap-2 md:col-span-2">
                  <span className="font-semibold text-red-600 min-w-20">압축 소요시간 (10%)</span>
                  <span className="text-gray-600">실제 압축 작업에 소요된 시간이 짧을수록 효율적입니다.</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs text-gray-500">
                  * 각 항목의 점수는 0~100점으로 계산되며, 가중치를 적용하여 종합 점수를 산출합니다.
                </p>
              </div>
            </div>
          </div>

          {/* 추천 결과 */}
          {recommendations.length > 0 && (
            <div className="space-y-6">
              {/* 최고 추천 결과 */}
              {recommendations[0] && (() => {
                const { history, detail, score, scores } = recommendations[0];
                const compressionRatio = history.compressionRatio || 0;

                return (
                  <div className="space-y-4 mt-6">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold text-gray-900">추천 결과</h2>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                        BEST
                      </span>
                    </div>
                    
                    <div className="border-2 border-blue-500 rounded-xl p-6 bg-linear-to-br from-blue-50 to-white shadow-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-baseline gap-3 mb-2">
                            <div className="text-3xl font-bold text-gray-900">
                              {history.compressionType}
                            </div>
                            <div className="text-xl text-gray-600">
                              v{history.version}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                history.processingUnit === 'GPU' 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'bg-amber-100 text-amber-700'
                                }`}>
                                {history.processingUnit} 처리
                                </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <div className="text-sm text-gray-500">종합 점수</div>
                          <div className="text-2xl font-bold text-blue-600">{score.toFixed(1)}점</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 pt-6 border-t border-blue-200">
                        <div>
                          <div className="text-gray-500 mb-1 text-sm">압축 전 용량</div>
                          <div className="font-semibold text-gray-900">{formatFileSize(history.bmpVolume)}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            유사도: {scores.sizeSimilarity.toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 mb-1 text-sm">압축률</div>
                          <div className="font-semibold text-green-600 text-lg">
                            {compressionRatio.toFixed(2)}%
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            점수: {scores.compressionRatio.toFixed(1)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 mb-1 text-sm">평균 속도</div>
                          <div className="font-semibold text-gray-900">
                            {detail?.avgSpeed ? `${detail.avgSpeed.toFixed(2)} MB/s` : '-'}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            점수: {scores.speed.toFixed(1)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 mb-1 text-sm">총 소요시간</div>
                          <div className="font-semibold text-gray-900">
                            {formatTime(history.elapsedTime)}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            점수: {scores.totalTime.toFixed(1)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 mb-1 text-sm">압축 소요시간</div>
                          <div className="font-semibold text-gray-900">
                            {detail?.compressionTime !== undefined && detail.compressionTime >= 0
                              ? formatSeconds(detail.compressionTime)
                              : '-'}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            점수: {scores.compressionTime.toFixed(1)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <div className="text-xs text-gray-500">
                          참고: {history.tiffName} | 담당자: {history.userName}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 다른 후보들 (참고용) */}
              {recommendations.length > 1 && (
                <div className="space-y-3">
                  <h3 className="text-md font-semibold text-gray-700">
                    다른 후보 (참고용)
                  </h3>
                  {recommendations.slice(1, 3).map((result, index) => {
                    const { history, detail, score, scores } = result;
                    const compressionRatio = history.compressionRatio || 0;

                    return (
                      <div
                        key={history.convertHistoryUuid}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-600 font-bold text-xs">
                              {index + 2}
                            </span>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {history.compressionType} v{history.version} {history.processingUnit} 처리
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex items-center justify-center gap-2">
                            <div className="text-xs text-gray-400">종합 점수</div>
                            <div className="text-lg font-bold text-gray-600">
                              {score.toFixed(1)}점
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-3 text-sm">
                          <div>
                            <div className="text-gray-500 mb-1 text-xs">압축 전 용량</div>
                            <div className="font-semibold text-sm">{formatFileSize(history.bmpVolume)}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              유사도: {scores.sizeSimilarity.toFixed(1)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500 mb-1 text-xs">압축률</div>
                            <div className="font-semibold text-green-600 text-sm">
                              {compressionRatio.toFixed(2)}%
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              점수: {scores.compressionRatio.toFixed(1)}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500 mb-1 text-xs">평균 속도</div>
                            <div className="font-semibold text-sm">
                              {detail?.avgSpeed ? `${detail.avgSpeed.toFixed(2)} MB/s` : '-'}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              점수: {scores.speed.toFixed(1)}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500 mb-1 text-xs">총 소요시간</div>
                            <div className="font-semibold text-sm">
                              {formatTime(history.elapsedTime)}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              점수: {scores.totalTime.toFixed(1)}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500 mb-1 text-xs">압축 소요시간</div>
                            <div className="font-semibold text-sm">
                              {detail?.compressionTime !== undefined && detail.compressionTime >= 0
                                ? formatSeconds(detail.compressionTime)
                                : '-'}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              점수: {scores.compressionTime.toFixed(1)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {hasSearched && recommendations.length === 0 && !loadingRecommendations && (
            <div className="text-center py-8 text-gray-500">
              입력하신 파일 용량과 유사한 압축 내역을 찾을 수 없습니다.
              <br />
              다른 용량으로 다시 시도해보세요.
            </div>
          )}
        </div>
      </CommonContainerBox>
    </div>
  );
}

