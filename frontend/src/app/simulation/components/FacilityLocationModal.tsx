'use client';

import React from 'react';
import CommonModal from '@/components/ui/CommonModal';
import TileMap, { type TileType } from './TileMap';
import type { Facility } from '../types';

interface FacilityLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  mapData: TileType[][];
  facility: Facility;
  selectedLocation: { x: number; y: number };
  onSelectLocation: (x: number, y: number) => void;
}

export default function FacilityLocationModal({
  isOpen,
  onClose,
  mapData,
  facility,
  selectedLocation,
  onSelectLocation,
}: FacilityLocationModalProps) {
  if (!isOpen) {
    return null;
  }

  const facilityOverlay =
    facility.canvasX !== undefined && facility.canvasY !== undefined
      ? [
          {
            id: facility.id,
            name: facility.name,
            canvasX: facility.canvasX,
            canvasY: facility.canvasY,
            imagePath: '/images/facilities/topview02-1.png',
          },
        ]
      : [];

  return (
    <CommonModal isOpen={isOpen} onClose={onClose} className="w-[90vw] max-w-6xl">
      <div className="w-full">
        <h2 className="text-xl font-bold text-gray-900 mb-4">위치 선택</h2>
        <div className="w-full h-[65vh] min-h-[520px] border border-gray-300 overflow-hidden">
          <TileMap
            mapData={mapData}
            facilities={facilityOverlay}
            isLocationSelectMode={true}
            onLocationSelect={(x, y) => {
              onSelectLocation(x, y);
            }}
            selectedLocation={selectedLocation}
          />
        </div>
      </div>
    </CommonModal>
  );
}

