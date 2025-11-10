'use client';

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { FacilityStatus, FacilityProcessStatus } from "../types";

export type TileType = "d" | "f" | "g" | "s" | "w" | "";

export interface FacilityLocation {
  id: string;
  name?: string;
  canvasX: number;
  canvasY: number;
  imagePath: string;
  status?: FacilityStatus;
  processStatus?: FacilityProcessStatus;
}

interface TileMapProps {
  mapData: TileType[][];
  facilities?: FacilityLocation[];
  onTileClick?: (x: number, y: number) => void;
  onFacilityClick?: (facilityId: string) => void;
  hoveredFacilityId?: string | null;
  onFacilityHoverChange?: (facilityId: string | null) => void;
  showManagementButton?: boolean;
  sidebarWidth?: number;
  isLocationSelectMode?: boolean;
  onLocationSelect?: (x: number, y: number) => void;
  onAddFacilityClick?: () => void;
  onCancelLocationSelect?: () => void;
  selectedLocation?: { x: number; y: number } | null;
  focusFacility?: { x: number; y: number } | null;
  focusPaddingTop?: number;
  focusPaddingBottom?: number;
  selectedFacilityId?: string | null;
}

interface FacilityOverlay {
  id: string;
  style: React.CSSProperties;
}

export default function TileMap({
  mapData,
  facilities = [],
  onTileClick,
  onFacilityClick,
  hoveredFacilityId,
  onFacilityHoverChange,
  showManagementButton: _showManagementButton = true,
  sidebarWidth: _sidebarWidth = 192,
  isLocationSelectMode = false,
  onLocationSelect,
  onAddFacilityClick: _onAddFacilityClick,
  onCancelLocationSelect: _onCancelLocationSelect,
  selectedLocation = null,
  focusFacility = null,
  focusPaddingTop = 32,
  focusPaddingBottom = 240,
  selectedFacilityId = null,
}: TileMapProps) {
  const [internalHoveredFacilityId, setInternalHoveredFacilityId] = useState<string | null>(null);
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const baseTileSize = 30;
  const [tileSize, setTileSize] = useState(baseTileSize);
  const [mapOffsetY, setMapOffsetY] = useState(0);

  const width = mapData[0]?.length || 0;
  const height = mapData.length || 0;
  const hoverImagePath = "/images/facilities/topview02-1.png";
  const hoverImageWidthTiles = 6;
  const hoverImageHeightTiles = 3;
  const facilityImagePath = "/images/facilities/topview02-1.png";

  useEffect(() => {
    if (!containerRef.current || width === 0 || height === 0) {
      return;
    }

    const element = containerRef.current;

    const updateTileSize = () => {
      const { clientWidth, clientHeight } = element;
      if (clientWidth === 0 || clientHeight === 0) return;

      const possibleWidth = Math.floor(clientWidth / width);
      const possibleHeight = Math.floor(clientHeight / height);
      const nextSize = Math.max(10, Math.min(baseTileSize, possibleWidth, possibleHeight));

      setTileSize(nextSize);
    };

    updateTileSize();

    const resizeObserver = new ResizeObserver(() => {
      updateTileSize();
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [width, height]);

  const activeHoveredFacilityId = hoveredFacilityId ?? internalHoveredFacilityId;

  useEffect(() => {
    if (!isLocationSelectMode) {
      setHoveredTile(null);
    }
  }, [isLocationSelectMode]);

  useEffect(() => {
    if (isLocationSelectMode) {
      setInternalHoveredFacilityId(null);
      onFacilityHoverChange?.(null);
    }
  }, [isLocationSelectMode, onFacilityHoverChange]);

  useEffect(() => {
    if (!focusFacility || !containerRef.current || tileSize <= 0) {
      setMapOffsetY(0);
      return;
    }

    const containerHeight = containerRef.current.clientHeight;
    const mapHeightPx = height * tileSize;
    const facilityCenterY = (focusFacility.y + 0.5) * tileSize;

    const topSafe = focusPaddingTop;
    const bottomSafe = containerHeight - focusPaddingBottom;

    const mapTopAtOffset0 = containerHeight / 2 - mapHeightPx / 2;
    const facilityScreenYAtOffset0 = mapTopAtOffset0 + facilityCenterY;

    let desiredOffset = 0;
    if (facilityScreenYAtOffset0 > bottomSafe) {
      desiredOffset = bottomSafe - facilityScreenYAtOffset0;
    } else if (facilityScreenYAtOffset0 < topSafe) {
      desiredOffset = topSafe - facilityScreenYAtOffset0;
    } else {
      desiredOffset = 0;
    }

    const minOffset = topSafe - facilityScreenYAtOffset0;
    const maxOffset = bottomSafe - facilityScreenYAtOffset0;

    desiredOffset = Math.min(Math.max(desiredOffset, minOffset), maxOffset);

    setMapOffsetY(desiredOffset);
  }, [focusFacility?.x, focusFacility?.y, focusPaddingTop, focusPaddingBottom, tileSize, height]);

  const hoverAreaTiles = useMemo(() => {
    if (!selectedLocation) return null;

    const tiles: Array<{ x: number; y: number }> = [];

    const startX = Math.max(0, Math.min(selectedLocation.x - Math.floor(hoverImageWidthTiles / 2), width - hoverImageWidthTiles));
    const startY = Math.max(0, Math.min(selectedLocation.y - Math.floor(hoverImageHeightTiles / 2), height - hoverImageHeightTiles));

    for (let y = 0; y < hoverImageHeightTiles; y++) {
      for (let x = 0; x < hoverImageWidthTiles; x++) {
        tiles.push({ x: startX + x, y: startY + y });
      }
    }

    return new Set(tiles.map((tile) => `${tile.x}-${tile.y}`));
  }, [selectedLocation, width, height]);

  const hoverImageStyle = useMemo(() => {
    if (!isLocationSelectMode || !hoveredTile || tileSize <= 0 || width === 0 || height === 0) {
      return null;
    }

    let startX = hoveredTile.x - Math.floor(hoverImageWidthTiles / 2);
    let startY = hoveredTile.y - Math.floor(hoverImageHeightTiles / 2);

    const maxStartX = Math.max(0, width - hoverImageWidthTiles);
    const maxStartY = Math.max(0, height - hoverImageHeightTiles);

    startX = Math.max(0, Math.min(startX, maxStartX));
    startY = Math.max(0, Math.min(startY, maxStartY));

    let left = startX * tileSize;
    let top = startY * tileSize;
    const widthPx = hoverImageWidthTiles * tileSize;
    const heightPx = hoverImageHeightTiles * tileSize;

    const maxLeft = width * tileSize - widthPx;
    const maxTop = height * tileSize - heightPx;

    left = Math.max(0, Math.min(left, maxLeft));
    top = Math.max(0, Math.min(top, maxTop));

    return {
      left,
      top,
      width: widthPx,
      height: heightPx,
      backgroundImage: `url(${hoverImagePath})`,
      opacity: 0.85,
    } as React.CSSProperties;
  }, [hoveredTile, isLocationSelectMode, tileSize, width, height]);

  const facilityMetaById = useMemo(() => {
    const map = new Map<string, FacilityLocation>();
    facilities.forEach((facility) => {
      map.set(facility.id, facility);
    });
    return map;
  }, [facilities]);

  const facilityOverlayData = useMemo<{
    overlays: FacilityOverlay[];
    areaByFacilityId: Map<string, Set<string>>;
  }>(() => {
    if (tileSize <= 0 || width === 0 || height === 0 || facilities.length === 0) {
      return {
        overlays: [],
        areaByFacilityId: new Map<string, Set<string>>(),
      };
    }

    const overlays: FacilityOverlay[] = [];
    const areaByFacilityId = new Map<string, Set<string>>();

    facilities.forEach((facility) => {
      if (facility.canvasX === undefined || facility.canvasY === undefined) {
        return;
      }

      const clampedX = Math.max(0, Math.min(facility.canvasX, width - 1));
      const clampedY = Math.max(0, Math.min(facility.canvasY, height - 1));

      let startX = clampedX - Math.floor(hoverImageWidthTiles / 2);
      let startY = clampedY - Math.floor(hoverImageHeightTiles / 2);

      startX = Math.max(0, Math.min(startX, Math.max(0, width - hoverImageWidthTiles)));
      startY = Math.max(0, Math.min(startY, Math.max(0, height - hoverImageHeightTiles)));

      let left = startX * tileSize;
      let top = startY * tileSize;
      const widthPx = hoverImageWidthTiles * tileSize;
      const heightPx = hoverImageHeightTiles * tileSize;

      const maxLeft = width * tileSize - widthPx;
      const maxTop = height * tileSize - heightPx;

      left = Math.max(0, Math.min(left, maxLeft));
      top = Math.max(0, Math.min(top, maxTop));

      overlays.push({
        id: facility.id,
        style: {
          left,
          top,
          width: widthPx,
          height: heightPx,
          backgroundImage: `url(${facility.imagePath || facilityImagePath})`,
        },
      });

      const areaKeys = new Set<string>();

      for (let offsetY = 0; offsetY < hoverImageHeightTiles; offsetY += 1) {
        for (let offsetX = 0; offsetX < hoverImageWidthTiles; offsetX += 1) {
          const tileX = startX + offsetX;
          const tileY = startY + offsetY;
          areaKeys.add(`${tileX}-${tileY}`);
        }
      }

      areaByFacilityId.set(facility.id, areaKeys);
    });

    return {
      overlays,
      areaByFacilityId,
    };
  }, [facilities, facilityImagePath, tileSize, width, height]);

  const getTileClassName = (tileType: TileType): string => {
    const classMap: Record<TileType, string> = {
      d: "dirt",
      f: "field",
      g: "grass",
      s: "sea",
      w: "wall",
      "": "",
    };
    return `tile ${classMap[tileType] || ""}`.trim();
  };

  const getStatusLabel = (status?: FacilityStatus) => {
    switch (status) {
      case "active":
        return "정상";
      case "inactive":
        return "고장";
      case "maintenance":
        return "점검";
      default:
        return "";
    }
  };

  const getProcessLabel = (processStatus?: FacilityProcessStatus) => {
    switch (processStatus) {
      case "RUNNING":
        return "진행";
      case "WAITING":
        return "대기";
      default:
        return "";
    }
  };

  const renderLeftBadge = (status?: FacilityStatus) => {
    if (!status) return null;

    let bgClass = "";
    let icon: React.ReactNode = null;

    if (status === "active") {
      bgClass = "bg-emerald-500";
      icon = (
        <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 text-white" aria-hidden="true">
          <path d="M3.5 8.5l3 3L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    } else if (status === "maintenance") {
      bgClass = "bg-amber-500";
      icon = (
        <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 text-white" aria-hidden="true">
          <path
            d="M12.2 5.8l-2.2-.9-.9-2.2a.5.5 0 0 0-.82-.15L6.2 4.53a2.5 2.5 0 1 0 1.27 1.27l2.01-2.09.56 1.4a.5.5 0 0 0 .28.28l1.4.56-2.09 2.01a2.5 2.5 0 1 0 1.27 1.27l2.09-2.01a.5.5 0 0 0-.15-.82Z"
            fill="currentColor"
          />
        </svg>
      );
    } else if (status === "inactive") {
      return null;
    }

    return (
      <span className={`pointer-events-none absolute left-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full ${bgClass}`}>
        {icon}
      </span>
    );
  };

  const renderRightBadge = (status?: FacilityStatus, processStatus?: FacilityProcessStatus) => {
    if (!status) return null;

    let text = "";
    let badgeClass = "";

    if (status === "active") {
      text = getProcessLabel(processStatus) || "대기";
      badgeClass = processStatus === "RUNNING" ? "bg-blue-600" : "bg-gray-600";
    } else if (status === "inactive") {
      text = getStatusLabel(status);
      badgeClass = "bg-red-500";
    } else if (status === "maintenance") {
      text = getStatusLabel(status);
      badgeClass = "bg-amber-500";
    }

    if (!text) return null;

    return (
      <span className={`pointer-events-none absolute right-1 top-1 z-10 rounded px-2 py-0.5 text-[11px] font-semibold text-white ${badgeClass}`}>
        {text}
      </span>
    );
  };

  return (
    <>
      <style>{`
        .tile-map-container-wrapper {
          position: relative;
          overflow: auto;
          height: 100%;
          width: 100%;
          background: transparent;
        }

        .tile-map-container {
          position: relative;
          margin: 0;
          background: transparent;
          box-shadow: 12px 12px 18px rgba(0, 0, 0, 0.25);
        }

        .tile-map {
          display: grid;
        }

        .tile-map-tile {
          position: relative;
          border: 0.5px solid rgba(0, 0, 0, 0.3);
          cursor: pointer;
          background: rgba(0, 89, 255, 0.5);
          transition: background 0.15s ease-in, box-shadow 0.15s ease-in, transform 0.15s ease-in;
        }

        .tile-map-tile.tile-hover {
          background: rgba(255, 255, 255, 0.18);
          box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.2);
        }

        .tile-map-tile.tile-selected {
          background: rgba(59, 130, 246, 0.3);
          box-shadow: inset 0 0 0 2px rgba(37, 99, 235, 0.8);
        }

        .tile-map-tile.dirt,
        .tile-map-tile.field,
        .tile-map-tile.grass,
        .tile-map-tile.sea,
        .tile-map-tile.wall {
          background: rgb(228, 228, 228);
        }

        .tile-map-tile.tile-selected-area {
          background: #0059FF !important;
        }

        .tile-map-facility-overlay-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 4;
        }

        .tile-map-facility-overlay-image {
          position: absolute;
          background-repeat: no-repeat;
          background-size: cover;
          background-position: center;
          border-radius: 0;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
          cursor: pointer;
          border: none;
          padding: 0;
          outline: none;
          transition: transform 0.12s ease-in-out, box-shadow 0.12s ease-in-out;
          transform: scale(1);
          transform-origin: center;
          pointer-events: auto;
        }

        .tile-map-facility-overlay-image:focus-visible {
          box-shadow: 0 0 0 3px rgba(0, 89, 255, 0.45), 0 14px 24px rgba(0, 0, 0, 0.35);
        }

        .tile-map-facility-overlay-image.tile-map-facility-overlay-image--active {
          transform: scale(1.1);
          box-shadow: 0 18px 36px rgba(0, 0, 0, 0.35);
          z-index: 6;
        }

        .tile-map-facility-overlay-image:hover,
        .tile-map-facility-overlay-image:focus-visible {
          transform: scale(1.1);
          box-shadow: 0 18px 36px rgba(0, 0, 0, 0.35);
        }

        .tile-map-facility-overlay-image::after {
          content: "";
          position: absolute;
          inset: 0;
          background: transparent;
          pointer-events: none;
          transition: background 0.15s ease-in-out;
          z-index: 5;
        }

        .tile-map-facility-overlay-image.tile-map-facility-overlay-image--inactive::after {
          background: rgba(0, 0, 0, 0.45);
        }

        .tile-map-facility-overlay-image.tile-map-facility-overlay-image--selected {
          transform: scale(1.1);
          box-shadow: 0 18px 36px rgba(0, 89, 255, 0.35), 0 0 30px rgba(0, 89, 255, 0.4);
          z-index: 6;
        }

        .tile-map-container-wrapper.is-location-select-mode .tile-map-facility-overlay-image {
          pointer-events: none;
          transform: scale(1) !important;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25) !important;
        }

        .tile-map-container-wrapper.is-location-select-mode .tile-map-facility-overlay-image:hover,
        .tile-map-container-wrapper.is-location-select-mode .tile-map-facility-overlay-image:focus-visible {
          transform: scale(1) !important;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25) !important;
        }

        .tile-map-hover-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 5;
        }

        .tile-map-hover-image {
          position: absolute;
          background-repeat: no-repeat;
          background-size: cover;
          background-position: center;
          box-shadow: 0 10px 25px rgba(0, 89, 255, 0.25);
        }
      `}</style>
      <div
        ref={containerRef}
        className={`tile-map-container-wrapper ${isLocationSelectMode ? "is-location-select-mode" : ""}`}
      >
        {isLocationSelectMode && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg">
            <p className="text-sm font-medium">맵에서 위치를 클릭하여 선택하세요</p>
          </div>
        )}

        <div
          className="tile-map-container"
          style={{
            width: width * tileSize,
            height: height * tileSize,
            position: 'absolute',
            top: `calc(50% + ${mapOffsetY}px)`,
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          onMouseLeave={() => {
            if (isLocationSelectMode) {
              setHoveredTile(null);
            }
            setInternalHoveredFacilityId(null);
            onFacilityHoverChange?.(null);
          }}
        >
          <div
            className="tile-map-facility-overlay-layer"
            style={{ pointerEvents: isLocationSelectMode ? "none" : "auto" }}
          >
            {facilityOverlayData.overlays.map((overlay) => {
              const isActiveOverlay = activeHoveredFacilityId === overlay.id;
              const facilityMeta = facilityMetaById.get(overlay.id);
              const overlayClasses = [
                "relative",
                "tile-map-facility-overlay-image",
                isActiveOverlay ? "tile-map-facility-overlay-image--active" : "",
                selectedFacilityId === overlay.id ? "tile-map-facility-overlay-image--selected" : "",
                facilityMeta?.status === "inactive" ? "tile-map-facility-overlay-image--inactive" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <button
                  key={overlay.id}
                  type="button"
                  className={overlayClasses}
                  style={overlay.style}
                  onMouseEnter={() => {
                    if (isLocationSelectMode) return;
                    setInternalHoveredFacilityId(overlay.id);
                    onFacilityHoverChange?.(overlay.id);
                  }}
                  onMouseLeave={() => {
                    if (isLocationSelectMode) return;
                    setInternalHoveredFacilityId((prev) => (prev === overlay.id ? null : prev));
                    onFacilityHoverChange?.(null);
                  }}
                  onClick={() => {
                    if (isLocationSelectMode) return;
                    onFacilityClick?.(overlay.id);
                  }}
                  aria-label="facility"
                >
                  {renderLeftBadge(facilityMeta?.status)}
                  {renderRightBadge(facilityMeta?.status, facilityMeta?.processStatus)}
                  {facilityMeta?.name && (
                    <span className="pointer-events-none absolute bottom-1 left-1/2 z-10 -translate-x-1/2 rounded bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">
                      {facilityMeta.name}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="tile-map-hover-layer">
            {hoverImageStyle && <div className="tile-map-hover-image" style={hoverImageStyle} />}
          </div>
          <div
            className="tile-map"
            style={{
              gridTemplateColumns: `repeat(${width}, ${tileSize}px)`,
              gridAutoRows: `${tileSize}px`,
            }}
          >
            {mapData.map((row, y) =>
              row.map((tile, x) => {
                const tileKey = `${x}-${y}`;
                const isSelectedArea = hoverAreaTiles?.has(tileKey);
                const isHoveredFacilityArea =
                  activeHoveredFacilityId != null
                    ? facilityOverlayData.areaByFacilityId.get(activeHoveredFacilityId)?.has(tileKey) ?? false
                    : false;

                return (
                  <div
                    key={tileKey}
                    className={[
                      "tile-map-tile",
                      getTileClassName(tile),
                      isLocationSelectMode && hoveredTile?.x === x && hoveredTile?.y === y ? "tile-hover" : "",
                      selectedLocation && selectedLocation.x === x && selectedLocation.y === y ? "tile-selected" : "",
                      isSelectedArea ? "tile-selected-area" : "",
                      isHoveredFacilityArea ? "tile-facility-area-hover" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onMouseEnter={() => {
                      if (isLocationSelectMode) {
                        setHoveredTile({ x, y });
                      }
                    }}
                    onClick={() => {
                      if (isLocationSelectMode && onLocationSelect) {
                        onLocationSelect(x, y);
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
      </div>
    </>
  );
}

