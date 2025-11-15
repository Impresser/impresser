'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Papa from 'papaparse';
import CommonButton from '@/components/ui/CommonButton';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import CommonInput from '@/components/ui/CommonInput01';
import { useImageGeneratorStore } from '@/store/imageGeneratorStore';
import PatternPreview from './PatternPreview';
import PatternPreviewModal from './PatternPreviewModal';

export default function PatternForm() {
  const form = useImageGeneratorStore((s) => s.form);
  const setFormField = useImageGeneratorStore((s) => s.setFormField);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const handleClickUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleDownloadTemplate = useCallback(() => {
    const link = document.createElement('a');
    link.href = '/pattern-template.csv';
    link.download = 'pattern-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse<string[]>(file as any, {
      header: false,
      skipEmptyLines: false,
      complete: (results: Papa.ParseResult<string[]>) => {
        try {
          const rows = results.data as string[][];
          if (!rows || rows.length === 0) return;

          // CSV 데이터를 맵으로 저장
          const dataMap: Record<string, string> = {};

          // 헤더-값 쌍을 찾아서 맵에 저장
          for (let i = 0; i < rows.length - 1; i++) {
            const headerRow = rows[i];
            const valueRow = rows[i + 1];

            if (!headerRow || !valueRow) continue;

            // 헤더 행과 값 행을 매칭
            for (let j = 0; j < Math.max(headerRow.length, valueRow.length); j++) {
              const header = (headerRow[j] || '').toString().trim();
              const value = (valueRow[j] || '').toString().trim();

              if (header && value) {
                dataMap[header] = value;
              }
            }
          }

          const getNum = (key: string) => {
            const v = (dataMap[key] ?? '').toString().trim();
            if (v === '') return '' as const;
            const n = Number(v);
            return Number.isFinite(n) ? n : ('' as const);
          };

          const mappings: Array<[string, string]> = [
            ['image_width', 'imageSize.w'],
            ['image_height', 'imageSize.h'],
            ['rg_gap_x', 'gapRG.x'],
            ['rg_gap_y', 'gapRG.y'],
            ['gb_gap_x', 'gapGB.x'],
            ['gb_gap_y', 'gapGB.y'],

            ['r_size_x', 'channels.R.size.x'],
            ['r_size_y', 'channels.R.size.y'],
            ['r_count_x', 'channels.R.count.x'],
            ['r_count_y', 'channels.R.count.y'],
            ['r_gap_x', 'channels.R.spacing.x'],
            ['r_gap_y', 'channels.R.spacing.y'],

            ['g_size_x', 'channels.G.size.x'],
            ['g_size_y', 'channels.G.size.y'],
            ['g_count_x', 'channels.G.count.x'],
            ['g_count_y', 'channels.G.count.y'],
            ['g_gap_x', 'channels.G.spacing.x'],
            ['g_gap_y', 'channels.G.spacing.y'],

            ['b_size_x', 'channels.B.size.x'],
            ['b_size_y', 'channels.B.size.y'],
            ['b_count_x', 'channels.B.count.x'],
            ['b_count_y', 'channels.B.count.y'],
            ['b_gap_x', 'channels.B.spacing.x'],
            ['b_gap_y', 'channels.B.spacing.y'],
          ];

          mappings.forEach(([csvKey, path]) => {
            const value = getNum(csvKey);
            setFormField(path, value);
          });
        } catch (err) {
          console.error('CSV 파싱/매핑 오류:', err);
        }
      },
      error: (error: any) => {
        console.error('CSV 파싱 실패:', error);
      },
    });
  }, [setFormField]);

  const onNumChange = (path: string) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.trim();
      if (raw === '') {
        setFormField(path, '');
        // 간격 필드인 경우 모든 채널 비우기
        if (path.includes('.spacing.')) {
          const axis = path.includes('.x') ? 'x' : 'y';
          setFormField(`channels.R.spacing.${axis}`, '');
          setFormField(`channels.G.spacing.${axis}`, '');
          setFormField(`channels.B.spacing.${axis}`, '');
        }
        return;
      }
      // R-G 간격, G-B 간격은 음수 허용
      const isGapField = path.startsWith('gapRG.') || path.startsWith('gapGB.');
      let cleaned: string;
      if (isGapField) {
        // 음수 허용: 숫자와 음수 기호만 허용
        cleaned = raw.replace(/[^0-9-]/g, '');
        // 음수 기호는 맨 앞에만 하나만 허용
        if (cleaned.startsWith('-')) {
          cleaned = '-' + cleaned.slice(1).replace(/-/g, '');
        } else {
          cleaned = cleaned.replace(/-/g, '');
        }
      } else {
        cleaned = raw.replace(/[^0-9]/g, '');
      }
      const num = Number(cleaned);
      const value = Number.isNaN(num) ? '' : num;
      setFormField(path, value);
      
      // 간격 필드인 경우 모든 채널에 같은 값 설정
      if (path.includes('.spacing.')) {
        const axis = path.includes('.x') ? 'x' : 'y';
        setFormField(`channels.R.spacing.${axis}`, value);
        setFormField(`channels.G.spacing.${axis}`, value);
        setFormField(`channels.B.spacing.${axis}`, value);
      }
    };

  // 모달 열기
  const handleOpenPreviewModal = useCallback(() => {
    setIsPreviewModalOpen(true);
  }, []);

  // 모달 닫기
  const handleClosePreviewModal = useCallback(() => {
    setIsPreviewModalOpen(false);
  }, []);

  // 🔹 이미지 크기 자동 계산
  useEffect(() => {
    const rSizeX = Number(form.channels.R.size.x);
    const rSizeY = Number(form.channels.R.size.y);
    const gSizeX = Number(form.channels.G.size.x);
    const gSizeY = Number(form.channels.G.size.y);
    const bSizeX = Number(form.channels.B.size.x);
    const bSizeY = Number(form.channels.B.size.y);

    const rCountX = Number(form.channels.R.count.x);
    const rCountY = Number(form.channels.R.count.y);
    const gCountX = Number(form.channels.G.count.x);
    const gCountY = Number(form.channels.G.count.y);
    const bCountX = Number(form.channels.B.count.x);
    const bCountY = Number(form.channels.B.count.y);

    // 크기와 개수가 모두 입력된 채널만 포함
    const hasR = Number.isFinite(rSizeX) && rSizeX > 0 && 
                 Number.isFinite(rSizeY) && rSizeY > 0 &&
                 Number.isFinite(rCountX) && rCountX > 0 &&
                 Number.isFinite(rCountY) && rCountY > 0;
    const hasG = Number.isFinite(gSizeX) && gSizeX > 0 && 
                 Number.isFinite(gSizeY) && gSizeY > 0 &&
                 Number.isFinite(gCountX) && gCountX > 0 &&
                 Number.isFinite(gCountY) && gCountY > 0;
    const hasB = Number.isFinite(bSizeX) && bSizeX > 0 && 
                 Number.isFinite(bSizeY) && bSizeY > 0 &&
                 Number.isFinite(bCountX) && bCountX > 0 &&
                 Number.isFinite(bCountY) && bCountY > 0;

    if (!hasR && !hasG && !hasB) return;

    const gapRGx = form.gapRG.x !== '' ? Number(form.gapRG.x) : 0;
    const gapRGy = form.gapRG.y !== '' ? Number(form.gapRG.y) : 0;
    const gapGBx = form.gapGB.x !== '' ? Number(form.gapGB.x) : 0;
    const gapGBy = form.gapGB.y !== '' ? Number(form.gapGB.y) : 0;

    const spacingR_X = form.channels.R.spacing.x !== '' ? Number(form.channels.R.spacing.x) : 0;
    const spacingG_X = form.channels.G.spacing.x !== '' ? Number(form.channels.G.spacing.x) : 0;
    const spacingB_X = form.channels.B.spacing.x !== '' ? Number(form.channels.B.spacing.x) : 0;
    const spacingR_Y = form.channels.R.spacing.y !== '' ? Number(form.channels.R.spacing.y) : 0;
    const spacingG_Y = form.channels.G.spacing.y !== '' ? Number(form.channels.G.spacing.y) : 0;
    const spacingB_Y = form.channels.B.spacing.y !== '' ? Number(form.channels.B.spacing.y) : 0;

    const countR_X = rCountX;
    const countR_Y = rCountY;
    const countG_X = gCountX;
    const countG_Y = gCountY;
    const countB_X = bCountX;
    const countB_Y = bCountY;

    // 셀 내부 가로 폭 계산
    let cellInnerWidth = 0;
    if (hasR) cellInnerWidth += rSizeX;
    if (hasR && hasG) cellInnerWidth += gapRGx;
    if (hasG) cellInnerWidth += gSizeX;
    if (hasR && !hasG && hasB) cellInnerWidth += (gapRGx + gapGBx);
    if (hasG && hasB) cellInnerWidth += gapGBx;
    if (hasB) cellInnerWidth += bSizeX;

    // 셀 내부 세로 높이 계산
    const rTop = 0;
    const gTop = gapRGy;
    const bTop = gapRGy + gapGBy;
    const cellInnerHeight = Math.max(
      hasR ? rTop + rSizeY : 0,
      hasG ? gTop + gSizeY : 0,
      hasB ? bTop + bSizeY : 0
    );

    const interCellGapX = Math.max(
      hasR ? spacingR_X : 0,
      hasG ? spacingG_X : 0,
      hasB ? spacingB_X : 0
    );
    const interCellGapY = Math.max(
      hasR ? spacingR_Y : 0,
      hasG ? spacingG_Y : 0,
      hasB ? spacingB_Y : 0
    );

    const gridCols = Math.max(
      hasR ? countR_X : 0,
      hasG ? countG_X : 0,
      hasB ? countB_X : 0
    );
    const gridRows = Math.max(
      hasR ? countR_Y : 0,
      hasG ? countG_Y : 0,
      hasB ? countB_Y : 0
    );

    const gridWidth = gridCols * cellInnerWidth + Math.max(0, gridCols - 1) * interCellGapX;
    const gridHeight = gridRows * cellInnerHeight + Math.max(0, gridRows - 1) * interCellGapY;

    // 패턴 크기만 계산 (padding 제외)
    const calculatedW = gridWidth;
    const calculatedH = gridHeight;

    // 현재 값과 계산된 값을 숫자로 비교
    const currentW = Number(form.imageSize.w) || 0;
    const currentH = Number(form.imageSize.h) || 0;

    // 값이 실제로 다를 때만 업데이트
    if (Math.abs(currentW - calculatedW) > 0.1) {
      setFormField('imageSize.w', calculatedW);
    }
    if (Math.abs(currentH - calculatedH) > 0.1) {
      setFormField('imageSize.h', calculatedH);
    }
  }, [
    form.channels.R.size.x,
    form.channels.R.size.y,
    form.channels.R.count.x,
    form.channels.R.count.y,
    form.channels.R.spacing.x,
    form.channels.R.spacing.y,
    form.channels.G.size.x,
    form.channels.G.size.y,
    form.channels.G.count.x,
    form.channels.G.count.y,
    form.channels.G.spacing.x,
    form.channels.G.spacing.y,
    form.channels.B.size.x,
    form.channels.B.size.y,
    form.channels.B.count.x,
    form.channels.B.count.y,
    form.channels.B.spacing.x,
    form.channels.B.spacing.y,
    form.gapRG.x,
    form.gapRG.y,
    form.gapGB.x,
    form.gapGB.y,
    setFormField
  ]);


  return (
    <div>
      {/* 제목 & 불러오기 버튼 */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-semibold text-gray-800">생성할 패턴</h2>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#0059FF] underline cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
            pattern-template.csv
          </button>
          <CommonButton variant="blue" onClick={handleClickUpload}>불러오기</CommonButton>
        </div>
      </div>

      <div className="flex flex-col md:flex-row w-full gap-4 items-stretch">
      <CommonContainerBox className="flex-1 md:basis-2/3 flex flex-col justify-center items-center">
        <div className="w-full max-w-full">
          {/* 🔹 이미지 크기 / 간격 입력 (채널 행과 동일한 1행 정렬) */}
          {/* 헤더 라벨 (데스크톱 전용) */}
          <div className="hidden md:flex gap-11 text-sm font-semibold text-gray-700 mb-2">
            <div className="w-8"></div>
            <div className="flex-1">이미지 크기 <span className="text-xs font-normal text-gray-500">(* 자동 계산)</span></div>
            <div className="flex-1">R-G 간격</div>
            <div className="flex-1">G-B 간격</div>
          </div>
          <div className="flex gap-3 md:gap-11 text-sm items-center">
            {/* 라벨 영역 */}
            <span className="font-semibold text-gray-700 w-8">IMG</span>

            {/* 크기 */}
            <div className="flex-1 grid grid-cols-2 gap-2">
              <CommonInput fixedPlaceholder="W" fixedPlaceholderPadding="sm" value={form.imageSize.w} onChange={onNumChange('imageSize.w')} disabled />
              <CommonInput fixedPlaceholder="H" fixedPlaceholderPadding="sm" value={form.imageSize.h} onChange={onNumChange('imageSize.h')} disabled />
            </div>

            {/* R-G 간격 */}
            <div className="flex-1 grid grid-cols-2 gap-2">
              <CommonInput fixedPlaceholder="X" fixedPlaceholderPadding="sm" value={form.gapRG.x} onChange={onNumChange('gapRG.x')} />
              <CommonInput fixedPlaceholder="Y" fixedPlaceholderPadding="sm" value={form.gapRG.y} onChange={onNumChange('gapRG.y')} />
            </div>

            {/* G-B 간격 */}
            <div className="flex-1 grid grid-cols-2 gap-2">
              <CommonInput fixedPlaceholder="X" fixedPlaceholderPadding="sm" value={form.gapGB.x} onChange={onNumChange('gapGB.x')} />
              <CommonInput fixedPlaceholder="Y" fixedPlaceholderPadding="sm" value={form.gapGB.y} onChange={onNumChange('gapGB.y')} />
            </div>
          </div>


          {/* 🔹 R, G, B 채널 설정 (모바일 스택, 데스크톱 테이블) */}
          <div className="mt-4">
            
            <div className="hidden md:flex gap-11 text-sm font-semibold text-gray-700 mb-2">
              <div className="w-8"></div>
              <div className="flex-1">크기</div>
              <div className="flex-1">개수</div>
              <div className="flex-1">간격</div>
            </div>

            {(['R', 'G', 'B'] as const).map((color) => (
              <div key={color} className="mb-4 last:mb-0">
                <div className="flex gap-3 md:gap-11 text-sm items-center">
                  {/* 색상 레이블 */}
                  <span className="font-semibold text-gray-700 w-8">{color}</span>
                  {/* 크기 */}
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <CommonInput fixedPlaceholder="X" fixedPlaceholderPadding="sm" value={form.channels[color].size.x} onChange={onNumChange(`channels.${color}.size.x`)} />
                    <CommonInput fixedPlaceholder="Y" fixedPlaceholderPadding="sm" value={form.channels[color].size.y} onChange={onNumChange(`channels.${color}.size.y`)} />
                  </div>

                  {/* 개수 */}
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <CommonInput fixedPlaceholder="X" fixedPlaceholderPadding="sm" value={form.channels[color].count.x} onChange={onNumChange(`channels.${color}.count.x`)} />
                    <CommonInput fixedPlaceholder="Y" fixedPlaceholderPadding="sm" value={form.channels[color].count.y} onChange={onNumChange(`channels.${color}.count.y`)} />
                  </div>

                  {/* 간격 */}
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <CommonInput fixedPlaceholder="X" fixedPlaceholderPadding="sm" value={form.channels[color].spacing.x} onChange={onNumChange(`channels.${color}.spacing.x`)} />
                    <CommonInput fixedPlaceholder="Y" fixedPlaceholderPadding="sm" value={form.channels[color].spacing.y} onChange={onNumChange(`channels.${color}.spacing.y`)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CommonContainerBox>
          <CommonContainerBox className="flex-1 md:basis-1/3 flex flex-col p-6">
            <PatternPreview form={form} onOpenModal={handleOpenPreviewModal} />
          </CommonContainerBox>
      </div>

      <PatternPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={handleClosePreviewModal}
        form={form}
      />
    </div>
  );
}
