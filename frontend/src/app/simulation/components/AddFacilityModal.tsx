'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface AddFacilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (facilityData: {
    printerName: string;
    modelName: string;
    installDate: string;
    cpu: string;
    gpu: string;
    ram: string;
    vram: string;
    canvasX: number;
    canvasY: number;
  }) => void;
  sidebarWidth?: number;
  navbarHeight?: number;
  selectedPosition?: { x: number; y: number } | null;
  onSelectPosition?: () => void;
}

export default function AddFacilityModal({ isOpen, onClose, onAdd, sidebarWidth = 192, navbarHeight = 64, selectedPosition, onSelectPosition }: AddFacilityModalProps) {
  const [printerName, setPrinterName] = useState('');
  const [modelName, setModelName] = useState('');
  const [installDate, setInstallDate] = useState('');
  const [cpu, setCpu] = useState('');
  const [gpu, setGpu] = useState('');
  const [ram, setRam] = useState('');
  const [vram, setVram] = useState('');

  const handleSubmit = () => {
    if (!printerName || !modelName || !installDate || !cpu || !gpu || !ram || !vram) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    if (!selectedPosition) {
      alert('설비 위치를 선택해주세요.');
      return;
    }

    onAdd({
      printerName,
      modelName,
      installDate,
      cpu,
      gpu,
      ram,
      vram,
      canvasX: selectedPosition.x,
      canvasY: selectedPosition.y,
    });

    // 폼 초기화
    setPrinterName('');
    setModelName('');
    setInstallDate('');
    setCpu('');
    setGpu('');
    setRam('');
    setVram('');
    onClose();
  };

  const handleClose = () => {
    // 폼 초기화
    setPrinterName('');
    setModelName('');
    setInstallDate('');
    setCpu('');
    setGpu('');
    setRam('');
    setVram('');
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      className="w-full max-w-2xl" 
      leftOffset={sidebarWidth}
      topOffset={navbarHeight}
    >
      <div className="w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">설비 추가</h2>

        <div className="space-y-6">
          {/* 기본 정보 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                설비명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={printerName}
                onChange={(e) => setPrinterName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="프린터 이름"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                모델명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="모델명"
              />
            </div>
          </div>

          {/* 사양 정보 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CPU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={cpu}
                onChange={(e) => setCpu(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="CPU 정보"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GPU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={gpu}
                onChange={(e) => setGpu(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="GPU 정보"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                RAM <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={ram}
                onChange={(e) => setRam(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="RAM 정보"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                VRAM <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={vram}
                onChange={(e) => setVram(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="VRAM 정보"
              />
            </div>
          </div>

          {/* 설치일 및 설비 위치 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                설치일 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={installDate}
                onChange={(e) => setInstallDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                설비 위치 <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={selectedPosition ? `X: ${selectedPosition.x}, Y: ${selectedPosition.y}` : ''}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  placeholder="위치를 선택하세요"
                />
                <Button
                  variant="blue"
                  onClick={() => {
                    if (onSelectPosition) {
                      onSelectPosition();
                    }
                  }}
                  className="px-4 py-2 text-sm"
                >
                  선택
                </Button>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            선택 버튼을 클릭하여 맵에서 위치를 선택하세요
          </p>
        </div>

        {/* 버튼 */}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="gray" onClick={handleClose}>
            취소
          </Button>
          <Button variant="blue" onClick={handleSubmit}>
            추가
          </Button>
        </div>
      </div>
    </Modal>
  );
}
