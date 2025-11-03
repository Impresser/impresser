'use client';

import React, { useState } from 'react';
import CommonButton from '@/components/ui/CommonButton';

export type TileType = 'd' | 'f' | 'g' | 's' | 'w' | '';

export interface FacilityLocation {
  id: string;
  canvasX: number;
  canvasY: number;
  imagePath: string;
}

interface IsometricMapProps {
  mapData: TileType[][];
  facilities?: FacilityLocation[];
  onTileClick?: (x: number, y: number) => void;
  showManagementButton?: boolean;
  sidebarWidth?: number;
  isLocationSelectMode?: boolean;
  onLocationSelect?: (x: number, y: number) => void;
  onAddFacilityClick?: () => void;
  selectedLocation?: { x: number; y: number } | null;
}

export default function IsometricMap({ mapData, facilities = [], onTileClick, showManagementButton = true, sidebarWidth = 192, isLocationSelectMode = false, onLocationSelect, onAddFacilityClick, selectedLocation = null }: IsometricMapProps) {
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);
  
  const tileWidth = 30;
  const tileHeight = 30;
  
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

  // 3x3 영역이 유효한지 확인 (맵 경계 체크)
  const isValid3x3Area = (centerX: number, centerY: number): boolean => {
    // 3x3 영역의 중심 기준으로 상하좌우 1칸씩 필요
    // 테두리 칸은 선택 불가 (인덱스 0, width-1, height-1은 불가)
    if (centerX < 1 || centerX >= width - 1 || centerY < 1 || centerY >= height - 1) {
      return false;
    }
    return true;
  };

  // 3x3 영역의 모든 타일 좌표 반환
  const get3x3Tiles = (centerX: number, centerY: number): Array<{ x: number; y: number }> => {
    const tiles: Array<{ x: number; y: number }> = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        tiles.push({ x: centerX + dx, y: centerY + dy });
      }
    }
    return tiles;
  };

  // 특정 타일이 3x3 영역에 포함되는지 확인
  const isInHovered3x3Area = (x: number, y: number): boolean => {
    if (!hoveredTile) return false;
    if (!isValid3x3Area(hoveredTile.x, hoveredTile.y)) return false;
    
    const tiles = get3x3Tiles(hoveredTile.x, hoveredTile.y);
    return tiles.some(tile => tile.x === x && tile.y === y);
  };

  // 특정 타일이 선택된 3x3 영역에 포함되는지 확인
  const isInSelected3x3Area = (x: number, y: number): boolean => {
    if (!selectedLocation) return false;
    if (!isValid3x3Area(selectedLocation.x, selectedLocation.y)) return false;
    
    const tiles = get3x3Tiles(selectedLocation.x, selectedLocation.y);
    return tiles.some(tile => tile.x === x && tile.y === y);
  };

  return (
    <>
      <style>{`
        .isometric-map-container-wrapper {
          position: relative;
          overflow: auto;
          height: 100%;
          width: 100%;
          background: #222;
        }

        .isometric-map-container-wrapper::after {
          content: ' ';
          display: block;
          clear: both;
        }

        .isometric-map-container {
          position: absolute;
          top: 50%;
          left: 50%;
          float: left;
          perspective: 1000px;
          transform: translate(-50%, -50%) rotateX(60deg) rotateZ(45deg);
          transform-style: preserve-3d;
          box-shadow: 12px 12px 12px rgba(0, 0, 0, 0.24);
          background: #242424;
        }

        .isometric-map {
          float: left;
        }

        .isometric-map-tile {
          float: left;
          pointer-events: auto;
          border: 1px solid #333;
          cursor: pointer;
        }

        .isometric-map-tile::after {
          content: ' ';
          display: block;
          width: 100%;
          height: 100%;
          transition: box-shadow 0.250s ease-in, background 0.250s ease-in;
          box-shadow: 6px 6px 6px rgba(0, 0, 0, 0);
          background: rgba(255, 255, 255, 0);
        }

        @media (hover: hover) {
          .isometric-map-container-wrapper.is-location-select-mode .isometric-map-tile.tile-hover-3x3 {
            transition: background 0.250s ease-in;
            background: rgba(255, 255, 255, 0.2);
          }

          .isometric-map-container-wrapper.is-location-select-mode .isometric-map-tile.tile-hover-3x3::after {
            transform: translate(-6px, -6px);
            box-shadow: 6px 6px 6px rgba(0, 0, 0, 0.24);
            background: rgba(255, 255, 255, 0.8);
          }
        }

        .isometric-map-container-wrapper.is-location-select-mode .isometric-map-tile.tile-active-3x3 {
          transition: background 0.250s ease-in;
          background: rgba(255, 255, 255, 0.2);
        }

        .isometric-map-container-wrapper.is-location-select-mode .isometric-map-tile.tile-active-3x3::after {
          transform: translate(-6px, -6px);
          box-shadow: 6px 6px 6px rgba(0, 0, 0, 0.24);
          background: rgba(255, 255, 255, 0.8);
        }

        .isometric-map-container-wrapper.is-location-select-mode .isometric-map-tile.tile-invalid {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .isometric-map-container-wrapper.is-location-select-mode .isometric-map-tile.tile-selected-3x3 {
          background: rgba(59, 130, 246, 0.3);
        }

        .isometric-map-container-wrapper.is-location-select-mode .isometric-map-tile.tile-selected-3x3::after {
          background: rgba(59, 130, 246, 0.5);
        }

        .isometric-map-tile.dirt {
          background: #555;
        }

        .isometric-map-tile.field {
          background: #555;
        }

        .isometric-map-tile.grass {
          background: #555;
        }

        .isometric-map-tile.sea {
          background: #555;
        }

        .isometric-map-tile.wall {
          background: #555;
        }

        .isometric-map-facility-image-layer {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 10;
        }

        .isometric-map-facility-image {
          position: absolute;
          pointer-events: auto;
        }

        .isometric-map-facility-image img {
          max-width: 30px;
          max-height: 30px;
          object-fit: contain;
          display: block;
        }
      `}</style>
      <div className={`isometric-map-container-wrapper ${isLocationSelectMode ? 'is-location-select-mode' : ''}`}>
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
              <CommonButton
                onClick={() => setIsManagementOpen(false)}
                variant="gray"
                className="px-4 py-2 text-sm"
              >
                나가기
              </CommonButton>
              <CommonButton
                onClick={() => {
                  if (onAddFacilityClick) {
                    onAddFacilityClick();
                  }
                }}
                variant="blue"
                className="px-4 py-2 text-sm"
              >
                설비 추가
              </CommonButton>
              <CommonButton
                onClick={handleDeleteFacility}
                variant="red"
                className="px-4 py-2 text-sm"
              >
                설비 삭제
              </CommonButton>
            </>
          ) : (
            <CommonButton
              onClick={() => setIsManagementOpen(true)}
              variant="gray"
              className="px-4 py-2 text-sm"
            >
              설비 관리
            </CommonButton>
          )}
        </div>
        )}
        
        <div 
          className="isometric-map-container"
          style={{
            width: width * tileWidth,
            height: height * tileHeight
          }}
          onMouseLeave={() => {
            if (isLocationSelectMode) {
              setHoveredTile(null);
            }
          }}
        >
          <div className="isometric-map">
            {mapData.map((row, y) =>
              row.map((tile, x) => {
                const isInHoverArea = isInHovered3x3Area(x, y);
                const isInSelectedArea = isInSelected3x3Area(x, y);
                const isValid = isValid3x3Area(x, y);
                const isInvalid = isLocationSelectMode && !isValid;
                
                return (
                  <div
                    key={`${y}-${x}`}
                    className={`
                      isometric-map-tile 
                      ${getTileClassName(tile)}
                      ${isInHoverArea ? 'tile-hover-3x3' : ''}
                      ${isInSelectedArea && !isInHoverArea ? 'tile-selected-3x3' : ''}
                      ${isInvalid ? 'tile-invalid' : ''}
                    `.trim()}
                    style={{
                      width: tileWidth,
                      height: tileHeight
                    }}
                    onMouseEnter={() => {
                      if (isLocationSelectMode) {
                        setHoveredTile({ x, y });
                      }
                    }}
                    onClick={() => {
                      if (isLocationSelectMode && onLocationSelect) {
                        // 3x3 영역이 유효한지 확인
                        if (isValid3x3Area(x, y)) {
                          onLocationSelect(x, y);
                        }
                      } else if (onTileClick) {
                        onTileClick(x, y);
                      }
                    }}
                  />
                );
              })
            )}
          </div>
          
        </div>
        
        {/* 설비 이미지 레이어 (평면, isometric 변환 없음) */}
        <div className="isometric-map-facility-image-layer">
          {facilities.map((facility) => {
            // isometric 변환된 타일의 실제 화면 위치 계산
            // CSS transform: translate(-50%, -50%) rotateX(60deg) rotateZ(45deg)
            // 3D 변환 행렬을 직접 계산하여 정확한 위치 산출
            
            // 타일 좌표 (타일 중심 기준)
            const tileX = facility.canvasX + 0.5;
            const tileY = facility.canvasY + 0.5;
            
            // 타일 중심의 원본 좌표 (픽셀, map-container 내부 기준)
            // map-container의 중심을 (0, 0)으로 하는 좌표계 사용
            const mapCenterX = (width * tileWidth) / 2;
            const mapCenterY = (height * tileHeight) / 2;
            
            const originX = tileX * tileWidth - mapCenterX;
            const originY = tileY * tileHeight - mapCenterY;
            const originZ = 0; // 2D 타일이므로 Z는 0
            
            // rotateX(60deg) rotateZ(45deg) 변환 행렬 적용
            // 먼저 rotateZ(45deg), 그 다음 rotateX(60deg)
            const cos45 = Math.cos(Math.PI / 4); // cos(45deg) ≈ 0.707
            const sin45 = Math.sin(Math.PI / 4); // sin(45deg) ≈ 0.707
            const cos60 = Math.cos(Math.PI / 3); // cos(60deg) = 0.5
            const sin60 = Math.sin(Math.PI / 3); // sin(60deg) ≈ 0.866
            
            // rotateZ(45deg) 적용
            const zX = originX * cos45 - originY * sin45;
            const zY = originX * sin45 + originY * cos45;
            const zZ = originZ;
            
            // rotateX(60deg) 적용 (Z축 중심으로 Y와 Z가 회전)
            const xX = zX;
            const xY = zY * cos60 - zZ * sin60;
            const xZ = zY * sin60 + zZ * cos60;
            
            // perspective 변환 적용 (perspective: 1000px)
            const perspective = 1000;
            const scale = perspective / (perspective + xZ);
            const screenX = xX * scale;
            const screenY = xY * scale;
            
            // map-container의 실제 크기
            const mapWidth = width * tileWidth;
            const mapHeight = height * tileHeight;
            
            // wrapper의 중앙(50%, 50%)을 기준으로 상대 위치 계산
            // map-container는 translate(-50%, -50%)로 중앙 배치되므로
            // 변환된 좌표를 wrapper의 중앙에 더하면 됨
            const relativeX = (screenX / mapWidth) * 100;
            const relativeY = (screenY / mapHeight) * 100;
            
            // wrapper 중앙을 기준으로 절대 위치
            const x = `calc(50% + ${relativeX}%)`;
            const y = `calc(50% + ${relativeY}%)`;
            
            return (
              <div
                key={facility.id}
                className="isometric-map-facility-image"
                style={{
                  left: x,
                  top: y,
                  transform: 'translate(-50%, -100%)',
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

