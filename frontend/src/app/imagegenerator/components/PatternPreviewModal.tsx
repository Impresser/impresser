'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import CommonModal from '@/components/ui/CommonModal';
import { PatternFormState } from '@/store/imageGeneratorStore';
import { renderPattern, hasPatternPreview } from './PatternPreview';

interface PatternPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: PatternFormState;
}

export default function PatternPreviewModal({ isOpen, onClose, form }: PatternPreviewModalProps) {
  const modalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const modalPreviewContainerRef = useRef<HTMLDivElement | null>(null);
  const [modalZoom, setModalZoom] = useState(0.8);
  const [modalPanX, setModalPanX] = useState(0);
  const [modalPanY, setModalPanY] = useState(0);
  const [isModalPanning, setIsModalPanning] = useState(false);
  const [modalPanStart, setModalPanStart] = useState({ x: 0, y: 0 });

  const hasPreview = hasPatternPreview(form);

  // 모달 확대/축소 리셋
  const handleModalResetZoom = useCallback(() => {
    // 패턴 크기에 따른 줌 계산
    const rCountX = Number(form.channels.R.count.x);
    const rCountY = Number(form.channels.R.count.y);
    const gCountX = Number(form.channels.G.count.x);
    const gCountY = Number(form.channels.G.count.y);
    const bCountX = Number(form.channels.B.count.x);
    const bCountY = Number(form.channels.B.count.y);

    const rSizeX = Number(form.channels.R.size.x);
    const rSizeY = Number(form.channels.R.size.y);
    const gSizeX = Number(form.channels.G.size.x);
    const gSizeY = Number(form.channels.G.size.y);
    const bSizeX = Number(form.channels.B.size.x);
    const bSizeY = Number(form.channels.B.size.y);

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

    const gridCols = Math.max(
      hasR ? rCountX : 0,
      hasG ? gCountX : 0,
      hasB ? bCountX : 0
    );
    const gridRows = Math.max(
      hasR ? rCountY : 0,
      hasG ? gCountY : 0,
      hasB ? bCountY : 0
    );

    // 패턴 개수에 따른 줌 레벨 계산 (최대값 기준)
    const maxPatternSize = Math.max(gridCols, gridRows);
    let targetZoom: number;
    
    if (maxPatternSize <= 10) {
      // 10x10 이하: 80%
      targetZoom = 0.8;
    } else if (maxPatternSize <= 50) {
      // 50x50 이하: 600%
      targetZoom = 6;
    } else if (maxPatternSize <= 100) {
      // 100x100 이하: 1000%
      targetZoom = 10;
    } else if (maxPatternSize <= 200) {
      // 200x200 이하: 2000%
      targetZoom = 20;
    } else if (maxPatternSize <= 300) {
      // 300x300 이하: 3000%
      targetZoom = 30;
    } else {
      // 400x400 이상: 5000%
      targetZoom = 50;
    }

    setModalZoom(targetZoom);
    setModalPanX(0);
    setModalPanY(0);
  }, [form]);

  // 모달 열기 시 초기 줌 설정
  useEffect(() => {
    if (isOpen) {
      handleModalResetZoom();
    }
  }, [isOpen, handleModalResetZoom]);

  // 모달 확대/축소 핸들러
  const handleModalWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setModalZoom((prev) => Math.max(0.5, Math.min(100, prev * delta)));
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

  // 모달 캔버스 렌더러
  useEffect(() => {
    if (!isOpen) return;
    
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

      renderPattern(canvas, cssWidth, cssHeight, modalZoom, modalPanX, modalPanY, form);
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

      renderPattern(canvas, cssWidth, cssHeight, modalZoom, modalPanX, modalPanY, form);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [form, modalZoom, modalPanX, modalPanY, isOpen]);

  // 모달 영역 휠 이벤트 처리 (passive: false로 등록)
  useEffect(() => {
    if (!isOpen) return;
    
    const container = modalPreviewContainerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleModalWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleModalWheel);
    };
  }, [handleModalWheel, isOpen]);

  return (
    <CommonModal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[65vw] w-[65vw] px-0 py-0"
      style={{ maxWidth: '65vw', width: '65vw' }}
    >
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-1 py-2">
          <h3 className="text-xl font-semibold text-gray-800">패턴 미리보기</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        <div className="relative flex-1 flex items-center bg-[#4B4B4B] rounded-lg shadow-inner overflow-hidden">
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
          {hasPreview && (
            <>
              <div className="absolute top-2 right-2 flex flex-col gap-2">
                <button
                  onClick={() => setModalZoom((prev) => Math.min(100, prev + 0.1))}
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
  );
}







