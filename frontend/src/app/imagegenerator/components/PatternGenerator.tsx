'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Papa from 'papaparse';
import CommonButton from '@/components/ui/CommonButton';
import CommonContainerBox from '@/components/ui/CommonContainerBox';
import CommonInput from '@/components/ui/CommonInput01';
import CommonModal from '@/components/ui/CommonModal';
import { usePatternForm } from '@/app/imagegenerator/hooks/usePatternForm';

export default function PatternForm() {
  const { form, setFormField } = usePatternForm();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  // 모달 관련 상태
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const modalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const modalPreviewContainerRef = useRef<HTMLDivElement | null>(null);
  const [modalZoom, setModalZoom] = useState(1);
  const [modalPanX, setModalPanX] = useState(0);
  const [modalPanY, setModalPanY] = useState(0);
  const [isModalPanning, setIsModalPanning] = useState(false);
  const [modalPanStart, setModalPanStart] = useState({ x: 0, y: 0 });

  // 패턴 미리보기가 실제로 표시되는지 확인
  const hasPatternPreview = React.useMemo(() => {
    const hasAnyInput = (
      form.gapRG.x !== '' || form.gapRG.y !== '' ||
      form.gapGB.x !== '' || form.gapGB.y !== '' ||
      form.channels.R.size.x !== '' || form.channels.R.size.y !== '' ||
      form.channels.G.size.x !== '' || form.channels.G.size.y !== '' ||
      form.channels.B.size.x !== '' || form.channels.B.size.y !== '' ||
      form.channels.R.spacing.x !== '' || form.channels.R.spacing.y !== '' ||
      form.channels.G.spacing.x !== '' || form.channels.G.spacing.y !== '' ||
      form.channels.B.spacing.x !== '' || form.channels.B.spacing.y !== ''
    );

    if (!hasAnyInput) return false;

    const rSizeX = Number(form.channels.R.size.x);
    const rSizeY = Number(form.channels.R.size.y);
    const gSizeX = Number(form.channels.G.size.x);
    const gSizeY = Number(form.channels.G.size.y);
    const bSizeX = Number(form.channels.B.size.x);
    const bSizeY = Number(form.channels.B.size.y);

    const hasR = Number.isFinite(rSizeX) && rSizeX > 0 && Number.isFinite(rSizeY) && rSizeY > 0;
    const hasG = Number.isFinite(gSizeX) && gSizeX > 0 && Number.isFinite(gSizeY) && gSizeY > 0;
    const hasB = Number.isFinite(bSizeX) && bSizeX > 0 && Number.isFinite(bSizeY) && bSizeY > 0;

    return hasR || hasG || hasB;
  }, [form]);

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
        return;
      }
      const num = Number(raw.replace(/[^0-9]/g, ''));
      setFormField(path, Number.isNaN(num) ? '' : num);
    };

  // 확대/축소 핸들러
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((prev) => Math.max(0.5, Math.min(10, prev * delta)));
  }, []);

  // 팬(드래그) 핸들러
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 0) { // 왼쪽 클릭
      setIsPanning(true);
      setPanStart({ x: e.clientX - panX, y: e.clientY - panY });
    }
  }, [panX, panY]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      setPanX(e.clientX - panStart.x);
      setPanY(e.clientY - panStart.y);
    }
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // 확대/축소 리셋
  const handleResetZoom = useCallback(() => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  }, []);

  // 모달 확대/축소 리셋
  const handleModalResetZoom = useCallback(() => {
    setModalZoom(1);
    setModalPanX(0);
    setModalPanY(0);
  }, []);

  // 모달 열기
  const handleOpenPreviewModal = useCallback(() => {
    if (hasPatternPreview) {
      setIsPreviewModalOpen(true);
      // 모달 열 때 줌/팬 초기화
      setModalZoom(1);
      setModalPanX(0);
      setModalPanY(0);
    }
  }, [hasPatternPreview]);

  // 모달 닫기
  const handleClosePreviewModal = useCallback(() => {
    setIsPreviewModalOpen(false);
  }, []);

  // 모달 확대/축소 핸들러
  const handleModalWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setModalZoom((prev) => Math.max(0.5, Math.min(10, prev * delta)));
  }, []);

  // 모달 팬(드래그) 핸들러
  const handleModalMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 0) {
      setIsModalPanning(true);
      setModalPanStart({ x: e.clientX - modalPanX, y: e.clientY - modalPanY });
    }
  }, [modalPanX, modalPanY]);

  const handleModalMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isModalPanning) {
      setModalPanX(e.clientX - modalPanStart.x);
      setModalPanY(e.clientY - modalPanStart.y);
    }
  }, [isModalPanning, modalPanStart]);

  const handleModalMouseUp = useCallback(() => {
    setIsModalPanning(false);
  }, []);

  // 🔹 패턴 렌더링 함수 (재사용)
  const renderPattern = useCallback((
    canvas: HTMLCanvasElement,
    cssWidth: number,
    cssHeight: number,
    currentZoom: number,
    currentPanX: number,
    currentPanY: number
  ) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 배경 (캔버스 전체)
    const viewH = cssHeight || 200;
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, cssWidth, viewH);

    // 이미지 크기 적용: 입력 이미지 크기로 좌표계를 설정하고 캔버스에 비율 유지하여 맞춤
    const imgW = Number(form.imageSize.w) || cssWidth;
    const imgH = Number(form.imageSize.h) || cssHeight;
    const baseScale = Math.min(cssWidth / imgW, viewH / imgH);
    const finalScale = baseScale * currentZoom;
    const offsetX = (cssWidth - imgW * finalScale) / 2 + currentPanX;
    const offsetY = (viewH - imgH * finalScale) / 2 + currentPanY;

    // 입력 여부에 따라 미리보기 표시 결정
    const hasAnyInput = (
      form.gapRG.x !== '' || form.gapRG.y !== '' ||
      form.gapGB.x !== '' || form.gapGB.y !== '' ||
      form.channels.R.size.x !== '' || form.channels.R.size.y !== '' ||
      form.channels.G.size.x !== '' || form.channels.G.size.y !== '' ||
      form.channels.B.size.x !== '' || form.channels.B.size.y !== '' ||
      form.channels.R.spacing.x !== '' || form.channels.R.spacing.y !== '' ||
      form.channels.G.spacing.x !== '' || form.channels.G.spacing.y !== '' ||
      form.channels.B.spacing.x !== '' || form.channels.B.spacing.y !== ''
    );

    if (!hasAnyInput) {
      ctx.fillStyle = '#9ca3af';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('값을 입력하면 미리보기가 표시됩니다', cssWidth / 2, viewH / 2);
      return;
    }

    // 색 강도는 항상 최대(불투명)로 고정
    const r = 255;
    const g = 255;
    const b = 255;

    // 채널별 사이즈 입력 여부 판단
    const rSizeX = Number(form.channels.R.size.x);
    const rSizeY = Number(form.channels.R.size.y);
    const gSizeX = Number(form.channels.G.size.x);
    const gSizeY = Number(form.channels.G.size.y);
    const bSizeX = Number(form.channels.B.size.x);
    const bSizeY = Number(form.channels.B.size.y);

    const hasR = Number.isFinite(rSizeX) && rSizeX > 0 && Number.isFinite(rSizeY) && rSizeY > 0;
    const hasG = Number.isFinite(gSizeX) && gSizeX > 0 && Number.isFinite(gSizeY) && gSizeY > 0;
    const hasB = Number.isFinite(bSizeX) && bSizeX > 0 && Number.isFinite(bSizeY) && bSizeY > 0;

    const gapRGx = Number(form.gapRG.x) || 3;
    const gapRGy = form.gapRG.y !== '' ? Number(form.gapRG.y) : 0;
    const gapGBx = Number(form.gapGB.x) || 3;
    const gapGBy = form.gapGB.y !== '' ? Number(form.gapGB.y) : 0;

    const spacingR_X = Number(form.channels.R.spacing.x) || 6;
    const spacingG_X = Number(form.channels.G.spacing.x) || 6;
    const spacingB_X = Number(form.channels.B.spacing.x) || 6;
    const spacingR_Y = Number(form.channels.R.spacing.y) || 6;
    const spacingG_Y = Number(form.channels.G.spacing.y) || 6;
    const spacingB_Y = Number(form.channels.B.spacing.y) || 6;

    const rowGapY = Math.max(
      Number(form.channels.R.spacing.y) || 6,
      Number(form.channels.G.spacing.y) || 6,
      Number(form.channels.B.spacing.y) || 6,
    );

    // 표시할 채널 목록 구성 (입력된 채널만)
    // 개수는 최소 1 이상이어야 함 (0이거나 입력되지 않으면 1로 처리)
    const countR_X = Math.max(1, Number(form.channels.R.count.x) || 1);
    const countR_Y = Math.max(1, Number(form.channels.R.count.y) || 1);
    const countG_X = Math.max(1, Number(form.channels.G.count.x) || 1);
    const countG_Y = Math.max(1, Number(form.channels.G.count.y) || 1);
    const countB_X = Math.max(1, Number(form.channels.B.count.x) || 1);
    const countB_Y = Math.max(1, Number(form.channels.B.count.y) || 1);

    type Present = {
      key: 'R' | 'G' | 'B';
      w: number; // 단일 타일 폭
      h: number; // 단일 타일 높이
      countX: number;
      countY: number;
      spacingX: number;
      spacingY: number;
      fill: string;
    };
    const present: Present[] = [];
    if (hasR) present.push({ key: 'R', w: rSizeX, h: rSizeY, countX: countR_X, countY: countR_Y, spacingX: spacingR_X, spacingY: spacingR_Y, fill: `rgb(${r},0,0)` });
    if (hasG) present.push({ key: 'G', w: gSizeX, h: gSizeY, countX: countG_X, countY: countG_Y, spacingX: spacingG_X, spacingY: spacingG_Y, fill: `rgb(0,${g},0)` });
    if (hasB) present.push({ key: 'B', w: bSizeX, h: bSizeY, countX: countB_X, countY: countB_Y, spacingX: spacingB_X, spacingY: spacingB_Y, fill: `rgb(0,0,${b})` });

    if (present.length === 0) {
      ctx.fillStyle = '#9ca3af';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('채널 크기(X,Y)를 입력하면 해당 색이 표시됩니다', cssWidth / 2, viewH / 2);
      return;
    }

    // 각 채널의 유효(풋프린트) 폭/높이 계산
    const chFootprints = present.map((ch) => {
      const effW = ch.w * ch.countX + ch.spacingX * (ch.countX - 1);
      const effH = ch.h * ch.countY + ch.spacingY * (ch.countY - 1);
      return { key: ch.key, effW, effH };
    });

    // 행 높이: 표시 채널들의 최대 유효 높이
    const rowH = chFootprints.reduce((m, fp) => Math.max(m, fp.effH), 0);

    // 한 셀의 폭 계산: 채널 유효 폭 + 채널 간 간격 + 그룹 간 간격(spacing)
    let internalGaps = 0;
    for (let i = 1; i < present.length; i++) {
      const prev = present[i - 1].key;
      const curr = present[i].key;
      if (prev === 'R' && curr === 'G') internalGaps += gapRGx;
      else if (prev === 'G' && curr === 'B') internalGaps += gapGBx;
      else internalGaps += gapRGx + gapGBx; // R-B 인접 시 두 간격 합산
    }
    const widthsSum = chFootprints.reduce((s, fp) => s + fp.effW, 0);
    const lastKey = present[present.length - 1].key;
    const groupGapX = lastKey === 'R' ? spacingR_X : lastKey === 'G' ? spacingG_X : spacingB_X;
    const cellW = widthsSum + internalGaps + groupGapX;

    // 이미지 영역에 클립 후, 이미지 좌표계로 변환
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(finalScale, finalScale);
    ctx.beginPath();
    ctx.rect(0, 0, imgW, imgH);
    ctx.clip();
    // 이미지 배경
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, imgW, imgH);

    // 일반 사각형 그리기 헬퍼
    const drawRect = (x: number, y: number, w: number, h: number, fill: string) => {
      ctx.fillStyle = fill;
      ctx.fillRect(x, y, w, h);
    };

    // 패턴 타일링: 화면 밖에서 시작해서 끝까지 채우기
    let rowIndex = 0;
    for (let y = -rowH; y <= imgH + rowH; y += rowH + rowGapY) {
      const rowOffset = (rowIndex % 2) * (cellW / 2);
      for (let x = -cellW - rowOffset; x <= imgW + cellW; x += cellW) {
        let cursorX = x + rowOffset;
        let cumulativeGapY = 0; // Y 방향 간격 누적
        for (let i = 0; i < present.length; i++) {
          const ch = present[i];
          const fp = chFootprints[i];
          // 이전 채널과의 X 방향 간격 적용
          if (i > 0) {
            const prev = present[i - 1].key;
            if (prev === 'R' && ch.key === 'G') {
              cursorX += gapRGx;
              cumulativeGapY += gapRGy; // Y 방향 간격 누적
            } else if (prev === 'G' && ch.key === 'B') {
              cursorX += gapGBx;
              cumulativeGapY += gapGBy; // Y 방향 간격 누적
            } else {
              cursorX += gapRGx + gapGBx;
              cumulativeGapY += gapRGy + gapGBy; // Y 방향 간격 누적
            }
          }
          // 수직 중앙 정렬을 위해 오프셋 계산 + Y 방향 간격 적용
          const offsetY = y + (rowH - fp.effH) / 2 + cumulativeGapY;
          // 내부 타일 반복 그리기
          for (let yy = 0; yy < ch.countY; yy++) {
            for (let xx = 0; xx < ch.countX; xx++) {
              const drawX = cursorX + xx * (ch.w + ch.spacingX);
              const drawY = offsetY + yy * (ch.h + ch.spacingY);
              drawRect(drawX, drawY, ch.w, ch.h, ch.fill);
            }
          }
          cursorX += fp.effW;
        }
        // 마지막에는 그룹 간 간격만큼 띄움
        cursorX += groupGapX;
      }
      rowIndex += 1;
    }
    ctx.restore();
  }, [form]);

  // 🔹 미리보기 캔버스 렌더러
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement as HTMLElement | null;
    const cssWidth = parent ? parent.clientWidth : 300;
    const cssHeight = parent ? parent.clientHeight : 200;
    // 레티나 대응
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(cssWidth * dpr));
    canvas.height = Math.max(1, Math.floor(cssHeight * dpr));
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    renderPattern(canvas, cssWidth, cssHeight, zoom, panX, panY);
  }, [form, zoom, panX, panY, renderPattern]);

  // 🔹 미리보기 영역 휠 이벤트 처리 (passive: false로 등록)
  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  // 🔹 모달 캔버스 렌더러
  useEffect(() => {
    if (!isPreviewModalOpen) return;
    
    // 모달이 열린 후 약간의 지연을 두어 DOM이 완전히 렌더링되도록 함
    const timer = setTimeout(() => {
      const canvas = modalCanvasRef.current;
      if (!canvas) return;

      const parent = canvas.parentElement as HTMLElement | null;
      const cssWidth = parent ? parent.clientWidth : 800;
      const cssHeight = parent ? parent.clientHeight : 600;
      // 레티나 대응
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(cssWidth * dpr));
      canvas.height = Math.max(1, Math.floor(cssHeight * dpr));
      canvas.style.width = '100%';
      canvas.style.height = '100%';

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(dpr, dpr);

      renderPattern(canvas, cssWidth, cssHeight, modalZoom, modalPanX, modalPanY);
    }, 100);

    // 리사이즈 이벤트 핸들러
    const handleResize = () => {
      const canvas = modalCanvasRef.current;
      if (!canvas) return;

      const parent = canvas.parentElement as HTMLElement | null;
      const cssWidth = parent ? parent.clientWidth : 800;
      const cssHeight = parent ? parent.clientHeight : 600;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(cssWidth * dpr));
      canvas.height = Math.max(1, Math.floor(cssHeight * dpr));
      canvas.style.width = '100%';
      canvas.style.height = '100%';

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(dpr, dpr);

      renderPattern(canvas, cssWidth, cssHeight, modalZoom, modalPanX, modalPanY);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [form, modalZoom, modalPanX, modalPanY, isPreviewModalOpen, renderPattern]);

  // 🔹 모달 영역 휠 이벤트 처리 (passive: false로 등록)
  useEffect(() => {
    if (!isPreviewModalOpen) return;
    
    const container = modalPreviewContainerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleModalWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleModalWheel);
    };
  }, [handleModalWheel, isPreviewModalOpen]);

  return (
    <div>
      {/* 제목 & 불러오기 버튼 */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-gray-800">생성할 패턴</h2>
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
            <div className="flex-1">이미지 크기</div>
            <div className="flex-1">R-G 간격</div>
            <div className="flex-1">G-B 간격</div>
          </div>
          <div className="flex gap-3 md:gap-11 text-sm items-center">
            {/* 라벨 영역 */}
            <span className="font-semibold text-gray-700 w-8">IMG</span>

            {/* 크기 */}
            <div className="flex-1 grid grid-cols-2 gap-2">
              <CommonInput fixedPlaceholder="W" fixedPlaceholderPadding="sm" value={form.imageSize.w} onChange={onNumChange('imageSize.w')} />
              <CommonInput fixedPlaceholder="H" fixedPlaceholderPadding="sm" value={form.imageSize.h} onChange={onNumChange('imageSize.h')} />
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
            {/* 🔹 남는 공간을 모두 사용하는 미리보기 박스 */}
            <div className="relative w-full flex-1 bg-[#4B4B4B] rounded-lg shadow-inner overflow-hidden">
              <div
                ref={previewContainerRef}
                className="w-full h-full cursor-grab active:cursor-grabbing"
                onMouseDown={(e) => {
                  handleMouseDown(e);
                  // 클릭 시작 위치 저장 (드래그와 구분하기 위해)
                  const startX = e.clientX;
                  const startY = e.clientY;
                  const handleClick = (upEvent: MouseEvent) => {
                    const deltaX = Math.abs(upEvent.clientX - startX);
                    const deltaY = Math.abs(upEvent.clientY - startY);
                    // 5px 이내 이동이면 클릭으로 간주
                    if (deltaX < 5 && deltaY < 5 && hasPatternPreview) {
                      handleOpenPreviewModal();
                    }
                    document.removeEventListener('mouseup', handleClick);
                  };
                  document.addEventListener('mouseup', handleClick);
                }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <canvas ref={canvasRef} className="w-full h-full" />
              </div>
              {/* 확대/축소 컨트롤 - 패턴이 표시될 때만 보임 */}
              {hasPatternPreview && (
                <>
                  <div className="absolute top-2 right-2 flex flex-col gap-2">
                    <button
                      onClick={() => setZoom((prev) => Math.min(10, prev + 0.1))}
                      className="bg-white/90 hover:bg-white text-gray-700 rounded px-2 py-1 text-sm font-semibold shadow cursor-pointer"
                      title="확대"
                    >
                      +
                    </button>
                    <button
                      onClick={() => setZoom((prev) => Math.max(0.5, prev - 0.1))}
                      className="bg-white/90 hover:bg-white text-gray-700 rounded px-2 py-1 text-sm font-semibold shadow cursor-pointer"
                      title="축소"
                    >
                      −
                    </button>
                    <button
                      onClick={handleResetZoom}
                      className="bg-white/90 hover:bg-white text-gray-700 rounded px-2 py-1 text-xs font-semibold shadow cursor-pointer"
                      title="리셋"
                    >
                      x
                    </button>
                  </div>
                  {/* 줌 레벨 표시 */}
                  <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    {Math.round(zoom * 100)}%
                  </div>
                </>
              )}
            </div>
          </CommonContainerBox>
      </div>

      {/* 패턴 미리보기 모달 */}
      <CommonModal
        isOpen={isPreviewModalOpen}
        onClose={handleClosePreviewModal}
        className="max-w-[70vw] max-h-[80vh] w-[70vw] h-[80vh] p-6"
        style={{ maxWidth: '70vw', maxHeight: '90vh', width: '70vw', height: '90vh' }}
      >
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">패턴 미리보기</h3>
            <button
              onClick={handleClosePreviewModal}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          <div className="relative flex-1 bg-[#4B4B4B] rounded-lg shadow-inner overflow-hidden" style={{ minHeight: '500px' }}>
            <div
              ref={modalPreviewContainerRef}
              className="w-full h-full cursor-grab active:cursor-grabbing"
              onMouseDown={handleModalMouseDown}
              onMouseMove={handleModalMouseMove}
              onMouseUp={handleModalMouseUp}
              onMouseLeave={handleModalMouseUp}
            >
              <canvas ref={modalCanvasRef} className="w-full h-full" />
            </div>
            {/* 확대/축소 컨트롤 */}
            {hasPatternPreview && (
              <>
                <div className="absolute top-2 right-2 flex flex-col gap-2">
                  <button
                    onClick={() => setModalZoom((prev) => Math.min(10, prev + 0.1))}
                    className="bg-white/90 hover:bg-white text-gray-700 rounded px-2 py-1 text-sm font-semibold shadow cursor-pointer"
                    title="확대"
                  >
                    +
                  </button>
                  <button
                    onClick={() => setModalZoom((prev) => Math.max(0.5, prev - 0.1))}
                    className="bg-white/90 hover:bg-white text-gray-700 rounded px-2 py-1 text-sm font-semibold shadow cursor-pointer"
                    title="축소"
                  >
                    −
                  </button>
                  <button
                    onClick={handleModalResetZoom}
                    className="bg-white/90 hover:bg-white text-gray-700 rounded px-2 py-1 text-xs font-semibold shadow cursor-pointer"
                    title="리셋"
                  >
                    x
                  </button>
                </div>
                {/* 줌 레벨 표시 */}
                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  {Math.round(modalZoom * 100)}%
                </div>
              </>
            )}
          </div>
        </div>
      </CommonModal>
    </div>
  );
}
