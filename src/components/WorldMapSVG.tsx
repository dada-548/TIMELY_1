import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { Sun, Moon, Sunrise, Sunset } from "lucide-react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
  Line,
} from "react-simple-maps";
import { City } from "@/data/cities";
import { useWorldClock } from "@/hooks/useWorldClock";
import { getTerminatorPath } from "@/utils/solar";
import {
  formatTime,
  getTimezoneAbbreviation,
  getTimeOfDay,
  getOffsetMinutes,
} from "@/utils/timezone";

// Timezone-boundary-builder simplified TopoJSON with tzid properties
const TZ_GEO_URL = "/timezones.json";
// Country outlines for land border rendering
const COUNTRY_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";

interface WorldMapSVGProps {
  now: Date;
  selectedCities: City[];
  allCities?: City[];
  hoveredCity: City | null;
  onHoverCity: (city: City | null) => void;
  highlightColor: string;
  hoveredTimezone: number | null;
  onHoverTimezone: (tz: number | null) => void;
  showNightShade?: boolean;
}

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: h * 360, s, l };
}

// Meridian longitudes for timezone lines
const TIMEZONE_OFFSETS = Array.from({ length: 25 }, (_, i) => i - 12);
const OCEAN_BOUNDARIES = Array.from({ length: 24 }, (_, i) => -172.5 + i * 15);

// Cache for tzid → UTC offset (in whole hours)
const tzidOffsetCache: Record<string, number> = {};

function getTzidOffset(tzid: string, now: Date): number {
  // Use cache for performance
  const cacheKey = tzid;
  if (tzidOffsetCache[cacheKey] !== undefined) return tzidOffsetCache[cacheKey];
  
  try {
    const offsetMin = getOffsetMinutes(tzid, now);
    const offsetHours = offsetMin / 60;
    tzidOffsetCache[cacheKey] = offsetHours;
    return offsetHours;
  } catch {
    // Fallback for Etc/ zones
    if (tzid.startsWith("Etc/GMT")) {
      const match = tzid.match(/GMT([+-]?\d+)/);
      if (match) {
        // Etc/GMT zones have inverted sign
        const val = -parseInt(match[1]);
        tzidOffsetCache[cacheKey] = val;
        return val;
      }
    }
    tzidOffsetCache[cacheKey] = 0;
    return 0;
  }
}

type LabelPlacement = "top" | "bottom" | "left" | "right";

function computeLabelPlacements(cities: City[]): Record<string, LabelPlacement> {
  const placements: Record<string, LabelPlacement> = {};
  const options: LabelPlacement[] = ["top", "bottom", "right", "left"];
  const placed: { labelLng: number; labelLat: number }[] = [];
  const LABEL_W = 8;
  const LABEL_H = 4;

  for (const city of cities) {
    let bestOption: LabelPlacement = "top";
    let minOverlaps = Infinity;

    for (const option of options) {
      let lLng = city.lng || city.coordinates[0],
        lLat = city.lat || city.coordinates[1];
      if (option === "top") lLat += LABEL_H;
      else if (option === "bottom") lLat -= LABEL_H;
      else if (option === "right") lLng += LABEL_W;
      else if (option === "left") lLng -= LABEL_W;

      let overlaps = 0;
      for (const p of placed) {
        if (Math.abs(lLng - p.labelLng) < LABEL_W && Math.abs(lLat - p.labelLat) < LABEL_H)
          overlaps++;
      }
      if (overlaps < minOverlaps) {
        minOverlaps = overlaps;
        bestOption = option;
      }
      if (overlaps === 0) break;
    }

    placements[city.id] = bestOption;
    let fLng = city.lng || city.coordinates[0],
      fLat = city.lat || city.coordinates[1];
    if (bestOption === "top") fLat += LABEL_H;
    else if (bestOption === "bottom") fLat -= LABEL_H;
    else if (bestOption === "right") fLng += LABEL_W;
    else if (bestOption === "left") fLng -= LABEL_W;
    placed.push({ labelLng: fLng, labelLat: fLat });
  }
  return placements;
}

function getLabelOffset(placement: LabelPlacement, s: number): { x: number; y: number; anchor: string } {
  switch (placement) {
    case "top": return { x: 0, y: -10 / s, anchor: "middle" };
    case "bottom": return { x: 0, y: 14 / s, anchor: "middle" };
    case "right": return { x: 8 / s, y: 3 / s, anchor: "start" };
    case "left": return { x: -8 / s, y: 3 / s, anchor: "end" };
  }
}

// Projection constants
const PROJ_SCALE = 120;
const MAP_W = 754;
const MAP_H = 380;
const CX = MAP_W / 2;
const PX_PER_DEG = (PROJ_SCALE * Math.PI) / 180;
const STRIP_W = 15 * PX_PER_DEG;

const BAR_H = 22;
const TOP_BAR_Y = 5;
const BOTTOM_BAR_Y = 353;

export function WorldMapSVG({
  now,
  selectedCities,
  allCities = [],
  hoveredCity,
  onHoverCity,
  highlightColor,
  hoveredTimezone,
  onHoverTimezone,
  showNightShade = false,
}: WorldMapSVGProps) {
  const [tooltipCity, setTooltipCity] = useState<{
    city: City;
    screenX: number;
    screenY: number;
  } | null>(null);
  const { use24h } = useWorldClock();
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 0]);
  const [isTwoFingerTouch, setIsTwoFingerTouch] = useState(false);
  const isTwoFingerRef = useRef(false);
  const [showTwoFingerOverlay, setShowTwoFingerOverlay] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const labelPlacements = useMemo(
    () => computeLabelPlacements(selectedCities),
    [selectedCities],
  );

  const hsl = useMemo(() => hexToHsl(highlightColor), [highlightColor]);

  const landFill = useMemo(() => {
    if (!hsl) return highlightColor;
    return `hsl(${hsl.h}, ${Math.round(hsl.s * 60)}%, ${Math.round(hsl.l * 100 + 15)}%)`;
  }, [hsl, highlightColor]);

  const landStroke = useMemo(() => {
    if (!hsl) return "white";
    return `hsl(${hsl.h}, ${Math.round(hsl.s * 30)}%, 95%)`;
  }, [hsl]);

  const tzLineColor = useMemo(() => `${highlightColor}40`, [highlightColor]);
  const tzLabelColor = useMemo(() => `${highlightColor}90`, [highlightColor]);

  const getTzFill = useCallback((offset: number, isHovered: boolean) => {
    if (isHovered) return `${highlightColor}60`;
    // Generate a distinct but subtle color for each timezone offset
    const hue = ((offset + 12) * 137.5) % 360; // Use golden angle for distribution
    return `hsla(${hue}, 45%, 45%, 0.12)`;
  }, [highlightColor]);

  const handlePinEnter = useCallback(
    (city: City, e: React.MouseEvent) => {
      e.stopPropagation();
      onHoverCity(city);
      setTooltipCity({ city, screenX: e.clientX, screenY: e.clientY });
    },
    [onHoverCity],
  );

  const handlePinLeave = useCallback(() => {
    onHoverCity(null);
    setTooltipCity(null);
  }, [onHoverCity]);

  const handlePinTouch = useCallback(
    (city: City, e: React.TouchEvent) => {
      e.stopPropagation();
      const touch = e.touches[0];
      if (tooltipCity?.city.id === city.id) {
        onHoverCity(null);
        setTooltipCity(null);
      } else {
        onHoverCity(city);
        setTooltipCity({ city, screenX: touch.clientX, screenY: touch.clientY });
      }
    },
    [onHoverCity, tooltipCity],
  );

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length >= 2) {
      setIsTwoFingerTouch(true);
      isTwoFingerRef.current = true;
      setShowTwoFingerOverlay(false);
      if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
    } else {
      setIsTwoFingerTouch(false);
      isTwoFingerRef.current = false;
      if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
      overlayTimeoutRef.current = setTimeout(() => {
        if (!isTwoFingerRef.current) setShowTwoFingerOverlay(true);
      }, 400);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsTwoFingerTouch(false);
    isTwoFingerRef.current = false;
    if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
    setShowTwoFingerOverlay(false);
  }, []);

  const hoveredId = hoveredCity?.id;
  const nightPoints = useMemo(() => getTerminatorPath(now, MAP_W, MAP_H), [now]);

  // Wheel zoom handler
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => Math.min(8, Math.max(1, z - e.deltaY * 0.002)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div
      className={`relative touch-pan-y sm:touch-auto ${zoom > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-default"}`}
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={(e) => {
        if (e.touches.length >= 2) {
          setIsTwoFingerTouch(true);
          isTwoFingerRef.current = true;
          setShowTwoFingerOverlay(false);
          if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
        }
      }}
    >
      {/* Two-finger overlay for mobile */}
      {showTwoFingerOverlay && (
        <div className="absolute inset-0 z-20 bg-black/40 backdrop-blur-[2px] flex items-center justify-center pointer-events-none transition-opacity duration-300 rounded-lg">
          <div className="bg-card/90 border border-border px-4 py-3 rounded-xl shadow-2xl flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-300">
            <div className="flex gap-2">
              <div className="w-2 h-8 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-8 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            </div>
            <p className="text-sm font-medium text-foreground">Use two fingers to move the map</p>
          </div>
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-2 sm:gap-1">
        <button
          onClick={() => setZoom((z) => Math.min(8, z * 1.5))}
          className="w-10 h-10 sm:w-7 sm:h-7 rounded-md bg-card/80 border border-border text-foreground text-sm font-bold hover:bg-secondary/80 backdrop-blur-sm flex items-center justify-center"
        >
          +
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(1, z / 1.5))}
          className="w-10 h-10 sm:w-7 sm:h-7 rounded-md bg-card/80 border border-border text-foreground text-sm font-bold hover:bg-secondary/80 backdrop-blur-sm flex items-center justify-center"
        >
          −
        </button>
        {zoom > 1 && (
          <button
            onClick={() => { setZoom(1); setCenter([0, 0]); }}
            className="w-10 h-10 sm:w-7 sm:h-7 rounded-md bg-card/80 border border-border text-muted-foreground text-[10px] font-medium hover:bg-secondary/80 backdrop-blur-sm flex items-center justify-center"
            title="Reset zoom"
          >
            ↺
          </button>
        )}
      </div>

      <ComposableMap
        projection="geoEquirectangular"
        projectionConfig={{ scale: PROJ_SCALE, center: [0, 12] }}
        width={MAP_W}
        height={MAP_H}
        className="w-full h-auto rounded-lg"
        style={{ backgroundColor: "hsl(var(--card))" }}
        onClick={() => { onHoverCity(null); setTooltipCity(null); }}
      >
        <defs>
          <pattern
            id="pattern-stripes"
            width="8"
            height="8"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="8"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="2"
            />
          </pattern>
          <pattern
            id="pattern-stripes-hover"
            width="8"
            height="8"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="8"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="2"
            />
          </pattern>
        </defs>
        <ZoomableGroup
          zoom={zoom}
          center={center}
          onMoveEnd={({ coordinates, zoom: z }) => {
            setCenter(coordinates as [number, number]);
            setZoom(z);
          }}
          minZoom={1}
          maxZoom={8}
          filterZoomEvent={(e) => {
            if (e.type === "wheel") return true;
            if (e.type === "mousedown") return true;
            if (e.type.startsWith("touch")) return isTwoFingerRef.current;
            return true;
          }}
        >
          {/* Ocean Timezone Lines */}
          {OCEAN_BOUNDARIES.map((lon) => (
            <Line
              key={`ocean-line-${lon}`}
              from={[lon, -90]}
              to={[lon, 90]}
              stroke={tzLineColor}
              strokeWidth={0.5 / zoom}
              className="pointer-events-none"
            />
          ))}

          {/* Base Country layer for continent/country shapes */}
          <Geographies geography={COUNTRY_URL}>
            {({ geographies }) =>
              geographies
                .filter((geo) => geo.properties?.name !== "Antarctica" && geo.id !== "010")
                .map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={landFill}
                  stroke={landStroke}
                  strokeWidth={0.2 / zoom}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none" },
                    pressed: { outline: "none" },
                  }}
                  className="pointer-events-none"
                />
              ))
            }
          </Geographies>

          {/* Timezone shapes from timezone-boundary-builder (jagged political borders) */}
          <Geographies geography={TZ_GEO_URL}>
            {({ geographies }) => {
              // Group geometries by their UTC offset for synchronized highlighting
              const offsetGroups: Record<number, { tzid: string; geo: any }[]> = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
              geographies.forEach((geo) => {
                const tzid = geo.properties?.tzid;
                if (!tzid) return;
                // Skip Antarctica-related zones
                if (tzid === "Antarctica/McMurdo" || tzid === "Antarctica/South_Pole" || tzid.startsWith("Antarctica/")) return;
                const offset = getTzidOffset(tzid, now);
                if (!offsetGroups[offset]) offsetGroups[offset] = [];
                offsetGroups[offset].push({ tzid, geo });
              });

              return Object.entries(offsetGroups)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([offsetStr, items]) => {
                  const offset = Number(offsetStr);
                  const isOffsetHovered = hoveredTimezone === offset;
                  const isFractional = offset % 1 !== 0;

                  return (
                    <g key={`tz-offset-${offset}`} id={`zone-${offset}`} data-timezone={offset}>
                      {items.map(({ tzid, geo }) => (
                        <React.Fragment key={geo.rsmKey}>
                          <Geography
                            geography={geo}
                            data-timezone={offset}
                            data-tzid={tzid}
                            fill={getTzFill(offset, isOffsetHovered)}
                            stroke={isOffsetHovered ? highlightColor : `${highlightColor}40`}
                            strokeWidth={(isOffsetHovered ? 0.8 : 0.3) / zoom}
                            style={{
                              default: {
                                outline: "none",
                                transition: "fill 0.2s ease, stroke 0.2s ease",
                                cursor: "pointer",
                              },
                              hover: {
                                outline: "none",
                                fill: `${highlightColor}60`,
                                stroke: highlightColor,
                                strokeWidth: 0.8 / zoom,
                                transition: "fill 0.2s ease, stroke 0.2s ease",
                                cursor: "pointer",
                              },
                              pressed: { outline: "none" },
                            }}
                            onMouseEnter={() => onHoverTimezone(offset)}
                            onMouseLeave={() => onHoverTimezone(null)}
                          />
                          {isFractional && (
                            <Geography
                              geography={geo}
                              fill={isOffsetHovered ? "url(#pattern-stripes-hover)" : "url(#pattern-stripes)"}
                              stroke="transparent"
                              className="pointer-events-none"
                              style={{
                                default: { outline: "none" },
                                hover: { outline: "none" },
                                pressed: { outline: "none" },
                              }}
                            />
                          )}
                        </React.Fragment>
                      ))}
                    </g>
                  );
                });
            }}
          </Geographies>

          {/* US State boundaries overlay removed */}

          {/* Top and bottom UTC offset bars */}
          {TIMEZONE_OFFSETS.map((offset) => {
            const isHovered = hoveredTimezone !== null && Math.abs(hoveredTimezone - offset) < 0.75;
            const isEdge = offset === -12 || offset === 12;
            const width = isEdge ? STRIP_W / 2 : STRIP_W;
            
            // Calculate x position based on longitude
            // -12 is from -180 to -172.5
            // -11 is from -172.5 to -157.5
            const lonStart = offset === -12 ? -180 : -172.5 + (offset + 11) * 15;
            const xPx = CX + lonStart * PX_PER_DEG;
            
            const isEven = Math.abs(offset) % 2 === 0;
            const barBgColor = isEven ? `${highlightColor}25` : `${highlightColor}12`;
            const hoveredBarBg = isEven ? `${highlightColor}50` : `${highlightColor}35`;
            const label = offset === 0 ? "0" : `${offset > 0 ? "+" : ""}${offset}`;
            const fSize = isEdge ? 7 : 9;

            return (
              <React.Fragment key={`tz-bar-${offset}`}>
                <rect
                  x={xPx}
                  y={TOP_BAR_Y}
                  width={width}
                  height={BAR_H}
                  fill={isHovered ? hoveredBarBg : barBgColor}
                  onMouseEnter={() => onHoverTimezone(offset)}
                  onMouseLeave={() => onHoverTimezone(null)}
                  className="cursor-pointer transition-colors duration-200"
                />
                <text
                  x={xPx + width / 2}
                  y={TOP_BAR_Y + BAR_H / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={fSize}
                  fill={isHovered ? highlightColor : tzLabelColor}
                  fontFamily="'Inter', sans-serif"
                  fontWeight={isHovered || offset === 0 ? 800 : 500}
                  className="pointer-events-none select-none transition-colors duration-200"
                  style={{ textShadow: isHovered ? `0 0 8px ${highlightColor}40` : 'none' }}
                >
                  {label}
                </text>
                <rect
                  x={xPx}
                  y={BOTTOM_BAR_Y}
                  width={width}
                  height={BAR_H}
                  fill={isHovered ? hoveredBarBg : barBgColor}
                  onMouseEnter={() => onHoverTimezone(offset)}
                  onMouseLeave={() => onHoverTimezone(null)}
                  className="cursor-pointer transition-colors duration-200"
                />
                <text
                  x={xPx + width / 2}
                  y={BOTTOM_BAR_Y + BAR_H / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={fSize}
                  fill={isHovered ? highlightColor : tzLabelColor}
                  fontFamily="'Inter', sans-serif"
                  fontWeight={isHovered || offset === 0 ? 800 : 500}
                  className="pointer-events-none select-none transition-colors duration-200"
                  style={{ textShadow: isHovered ? `0 0 8px ${highlightColor}40` : 'none' }}
                >
                  {label}
                </text>
              </React.Fragment>
            );
          })}

          {/* Night overlay */}
          {showNightShade && (
            <polygon
              points={nightPoints}
              fill="hsla(220, 25%, 8%, 0.35)"
              className="pointer-events-none"
            />
          )}

          {/* All cities (secondary pins) */}
          {allCities
            .filter((c) => !selectedCities.some((sc) => sc.id === c.id))
            .map((city) => {
              const isHovered = hoveredId === city.id;
              const s = Math.pow(zoom, 0.6);
              return (
                <Marker
                  key={`all-${city.id}`}
                  coordinates={[city.lng || city.coordinates[0], city.lat || city.coordinates[1]]}
                  onMouseEnter={(e) => handlePinEnter(city, e as unknown as React.MouseEvent)}
                  onMouseLeave={handlePinLeave}
                  onTouchStart={(e: React.TouchEvent) => handlePinTouch(city, e)}
                  className="cursor-pointer"
                >
                  <circle r={12 / s} fill="transparent" />
                  <circle
                    r={(isHovered ? 6 : 3.5) / s}
                    fill={isHovered ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))"}
                    opacity={isHovered ? 0.9 : 0.55}
                  />
                  <circle r={(isHovered ? 3.5 : 2) / s} fill="hsl(var(--card))" />
                  {isHovered && (
                    <text
                      y={-8 / s}
                      textAnchor="middle"
                      fontSize={8 / s}
                      fontWeight={500}
                      fontFamily="'Inter', sans-serif"
                      fill="hsl(var(--foreground))"
                      stroke="hsl(var(--card))"
                      strokeWidth={2 / s}
                      paintOrder="stroke"
                      className="pointer-events-none select-none"
                    >
                      {city.name}
                    </text>
                  )}
                </Marker>
              );
            })}

          {/* Selected city markers */}
          {selectedCities.map((city) => {
            const isHovered = hoveredId === city.id;
            const tod = getTimeOfDay(city.timezone, now);
            const pinColor = tod === "night" ? "#94a3b8" : highlightColor;
            const s = Math.pow(zoom, 0.6);
            const placement = labelPlacements[city.id] || "top";
            const offset = getLabelOffset(placement, s);
            const cityOffset = Math.round((city.lng || city.coordinates[0]) / 15);
            const isInHoveredTz = hoveredTimezone === cityOffset;

            return (
              <Marker
                key={city.id}
                coordinates={[city.lng || city.coordinates[0], city.lat || city.coordinates[1]]}
                onMouseEnter={(e) => handlePinEnter(city, e as unknown as React.MouseEvent)}
                onMouseLeave={handlePinLeave}
                onTouchStart={(e: React.TouchEvent) => handlePinTouch(city, e)}
                className="cursor-pointer"
              >
                <circle r={15 / s} fill="transparent" />
                <circle r={(isHovered || isInHoveredTz ? 8 : 5) / s} fill={`${isHovered || isInHoveredTz ? highlightColor : pinColor}30`} />
                <circle
                  r={(isHovered || isInHoveredTz ? 4 : 2.5) / s}
                  fill={isHovered || isInHoveredTz ? highlightColor : pinColor}
                  stroke="white"
                  strokeWidth={1.2 / s}
                />
                <text
                  x={offset.x}
                  y={offset.y}
                  textAnchor={offset.anchor}
                  fontSize={9 / s}
                  fontWeight={isHovered || isInHoveredTz ? 700 : 600}
                  fontFamily="'Inter', sans-serif"
                  fill={isHovered || isInHoveredTz ? highlightColor : "hsl(var(--foreground))"}
                  stroke="hsl(var(--card))"
                  strokeWidth={2.5 / s}
                  paintOrder="stroke"
                  className="pointer-events-none select-none"
                >
                  {city.name}
                </text>
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>

      {/* HTML Tooltip */}
      {tooltipCity && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ left: tooltipCity.screenX + 12, top: tooltipCity.screenY - 20 }}
        >
          <div className="bg-card border border-border rounded-lg shadow-lg px-3 py-2 min-w-[130px]">
            <p className="text-xs font-semibold text-foreground">
              {tooltipCity.city.name}, {tooltipCity.city.country}
            </p>
            <p className="text-sm font-mono font-semibold mt-0.5" style={{ color: highlightColor }}>
              {formatTime(tooltipCity.city.timezone, now, use24h)}
            </p>
            <p className="text-[10px] text-muted-foreground font-medium">
              {now.toLocaleDateString(undefined, {
                timeZone: tooltipCity.city.timezone,
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {getTimezoneAbbreviation(tooltipCity.city.timezone, now)} ·{" "}
              {(() => {
                const tod = getTimeOfDay(tooltipCity.city.timezone, now);
                const TodIcon =
                  tod === "day" ? Sun : tod === "afternoon" ? Sun : tod === "night" ? Moon : tod === "dawn" ? Sunrise : Sunset;
                const iconColor =
                  tod === "day" ? "#edb423" : tod === "afternoon" ? "#fbbf24" : tod === "night" ? "#72708e" : tod === "dawn" ? "#e26f71" : "#9e6ae2";
                const label =
                  tod === "day" ? "Morning" : tod === "afternoon" ? "Afternoon" : tod === "night" ? "Night" : tod === "dawn" ? "Dawn" : "Evening";
                return (
                  <span className="inline-flex items-center gap-0.5">
                    <TodIcon size={10} color={iconColor} strokeWidth={2} /> {label}
                  </span>
                );
              })()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
