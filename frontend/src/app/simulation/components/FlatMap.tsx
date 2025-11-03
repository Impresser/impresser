'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/CommonButton';
import type { TileType } from './IsometricMap';
import type { FacilityLocation } from './IsometricMap';

interface FlatMapProps {
  mapData: TileType[][];
  facilities?: FacilityLocation[];
  onTileClick?: (x: number, y: number) => void;
  showManagementButton?: boolean;
  sidebarWidth?: number;
  isLocationSelectMode?: boolean;
  onLocationSelect?: (x: number, y: number) => void;
  onAddFacilityClick?: () => void;
}

export default function FlatMap({ mapData, facilities = [], onTileClick, showManagementButton = true, sidebarWidth = 192, isLocationSelectMode = false, onLocationSelect, onAddFacilityClick }: FlatMapProps) {
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  
  const tileWidth = 80;
  const tileHeight = 80;
  
  const width = mapData[0]?.length || 0;
  const height = mapData.length || 0;

  const getTileClassName = (tileType: TileType): string => {
    const classMap: Record<TileType, string> = {
      'd': 'dirt',
      'f': 'field',
      'g': 'grass',
      's': 'sea',
      'w': 'wall',
      '': ''
    };
    return `tile ${classMap[tileType] || ''}`.trim();
  };

  const handleDeleteFacility = () => {
    // 설비 삭제 로직
    console.log('설비 삭제');
  };

  return (
    <>
      <style>{`
        .flat-map-container-wrapper {
          position: relative;
          overflow: auto;
          height: 100%;
          width: 100%;
          background: #222;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .flat-map-grid {
          display: grid;
          gap: 0;
          border: 2px solid #333;
        }

        .flat-map-tile {
          border: 1px solid #999;
          cursor: pointer;
          transition: background 0.2s ease-in;
          position: relative;
        }

        .flat-map-tile:hover {
          background: rgba(255, 255, 255, 0.3) !important;
        }

        .flat-map-tile:active {
          background: rgba(255, 255, 255, 0.5) !important;
        }

        .flat-map-tile.dirt {
          background: #555;
        }

        .flat-map-tile.field {
          background: #555;
        }

        .flat-map-tile.grass {
          background: #555;
        }

        .flat-map-tile.sea {
          background: #555;
        }

        .flat-map-tile.wall {
          background: #555;
        }

        .flat-map-facility-image-layer {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 10;
        }

        .flat-map-facility-image {
          position: absolute;
          pointer-events: auto;
        }

        .flat-map-facility-image img {
          max-width: ${tileWidth}px;
          max-height: ${tileHeight}px;
          object-fit: contain;
          display: block;
        }
      `}</style>
      <div className="flat-map-container-wrapper">
        {/* 위치 선택 모드 안내 */}
        {isLocationSelectMode && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg">
            <p className="text-sm font-medium">맵에서 위치를 클릭하여 선택하세요</p>
          </div>
        )}
        
        {/* 설비 관리 버튼 및 메뉴 */}
        {showManagementButton && (
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          {isManagementOpen ? (
            <>
              <Button
                onClick={() => setIsManagementOpen(false)}
                variant="gray"
                className="px-4 py-2 text-sm"
              >
                나가기
              </Button>
              <Button
                onClick={() => {
                  if (onAddFacilityClick) {
                    onAddFacilityClick();
                  }
                }}
                variant="blue"
                className="px-4 py-2 text-sm"
              >
                설비 추가
              </Button>
              <Button
                onClick={handleDeleteFacility}
                variant="red"
                className="px-4 py-2 text-sm"
              >
                설비 삭제
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setIsManagementOpen(true)}
              variant="gray"
              className="px-4 py-2 text-sm"
            >
              설비 관리
            </Button>
          )}
        </div>
        )}
        
        <div 
          className="flat-map-grid"
          style={{
            gridTemplateColumns: `repeat(${width}, ${tileWidth}px)`,
            gridTemplateRows: `repeat(${height}, ${tileHeight}px)`,
          }}
        >
          {mapData.map((row, y) =>
            row.map((tile, x) => (
              <div
                key={`${y}-${x}`}
                className={`flat-map-tile ${getTileClassName(tile)}`}
                style={{
                  width: tileWidth,
                  height: tileHeight
                }}
                onClick={() => {
                  if (isLocationSelectMode && onLocationSelect) {
                    onLocationSelect(x, y);
                  } else if (onTileClick) {
                    onTileClick(x, y);
                  }
                }}
              />
            ))
          )}
        </div>
        
        {/* 설비 이미지 레이어 */}
        <div className="flat-map-facility-image-layer">
          {facilities.map((facility) => {
            // 일반 그리드 맵에서는 타일의 실제 위치를 직접 계산
            const x = facility.canvasX * tileWidth + tileWidth / 2;
            const y = facility.canvasY * tileHeight + tileHeight / 2;
            
            return (
              <div
                key={facility.id}
                className="flat-map-facility-image"
                style={{
                  left: `${x}px`,
                  top: `${y}px`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <img
                  src={facility.imagePath}
                  alt={`Facility ${facility.id}`}
                />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

