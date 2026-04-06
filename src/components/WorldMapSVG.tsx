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
} from "@/utils/timezone";

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const US_STATES_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

interface WorldMapSVGProps {
  now: Date;
  selectedCities: City[];
  allCities?: City[];
  hoveredCity: City | null;
  onHoverCity: (city: City | null) => void;
  highlightColor: string;
  showTimezones?: boolean;
  hoveredTimezone: number | null;
  onHoverTimezone: (tz: number | null) => void;
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

// Generate timezone meridian lines (every 15° = 1 hour)
const TIMEZONE_LONGITUDES = Array.from({ length: 25 }, (_, i) => -180 + i * 15);

// US timezone boundary approximate longitudes
// const US_TZ_BOUNDARIES: {
//   from: [number, number];
//   to: [number, number];
//   label: string;
// }[] = [
//   // Eastern / Central boundary (roughly along IN/OH/GA line)
//   { from: [-85, 47], to: [-85, 30], label: "Eastern" },
//   // Central / Mountain boundary (roughly along ND/SD/NE/KS/TX line)
//   { from: [-100, 49], to: [-100, 26], label: "Central" },
//   // Mountain / Pacific boundary (roughly along MT/ID/NV/CA line)
//   { from: [-115, 49], to: [-115, 32], label: "Mountain" },
// ];

// US state label positions (approximate centroids with abbreviations)
const US_STATE_LABELS: { abbr: string; lng: number; lat: number }[] = [
  { abbr: "WA", lng: -120.5, lat: 47.4 },
  { abbr: "OR", lng: -120.5, lat: 44 },
  { abbr: "CA", lng: -119.5, lat: 37 },
  { abbr: "NV", lng: -116.8, lat: 39 },
  { abbr: "ID", lng: -114.5, lat: 44.5 },
  { abbr: "MT", lng: -109.5, lat: 47 },
  { abbr: "WY", lng: -107.5, lat: 43 },
  { abbr: "UT", lng: -111.5, lat: 39.5 },
  { abbr: "CO", lng: -105.5, lat: 39 },
  { abbr: "AZ", lng: -111.5, lat: 34 },
  { abbr: "NM", lng: -106, lat: 34.5 },
  { abbr: "ND", lng: -100.5, lat: 47.5 },
  { abbr: "SD", lng: -100, lat: 44.5 },
  { abbr: "NE", lng: -99.8, lat: 41.5 },
  { abbr: "KS", lng: -98.5, lat: 38.5 },
  { abbr: "OK", lng: -97.5, lat: 35.5 },
  { abbr: "TX", lng: -99, lat: 31 },
  { abbr: "MN", lng: -94.5, lat: 46 },
  { abbr: "IA", lng: -93.5, lat: 42 },
  { abbr: "MO", lng: -92.5, lat: 38.5 },
  { abbr: "AR", lng: -92.5, lat: 35 },
  { abbr: "LA", lng: -92, lat: 31 },
  { abbr: "WI", lng: -89.5, lat: 44.5 },
  { abbr: "IL", lng: -89, lat: 40 },
  { abbr: "MS", lng: -89.5, lat: 32.5 },
  { abbr: "MI", lng: -84.5, lat: 44.5 },
  { abbr: "IN", lng: -86.2, lat: 40 },
  { abbr: "OH", lng: -82.5, lat: 40.5 },
  { abbr: "KY", lng: -85.5, lat: 37.5 },
  { abbr: "TN", lng: -86, lat: 36 },
  { abbr: "AL", lng: -86.8, lat: 32.8 },
  { abbr: "GA", lng: -83.5, lat: 33 },
  { abbr: "FL", lng: -81.5, lat: 28.5 },
  { abbr: "SC", lng: -81, lat: 34 },
  { abbr: "NC", lng: -79.5, lat: 35.5 },
  { abbr: "VA", lng: -79, lat: 37.5 },
  { abbr: "WV", lng: -80.5, lat: 38.5 },
  { abbr: "PA", lng: -77.5, lat: 41 },
  { abbr: "NY", lng: -75.5, lat: 43 },
  { abbr: "ME", lng: -69, lat: 45.5 },
  { abbr: "VT", lng: -72.5, lat: 44 },
  { abbr: "NH", lng: -71.5, lat: 43.5 },
  { abbr: "MA", lng: -71.8, lat: 42.3 },
  { abbr: "CT", lng: -72.7, lat: 41.6 },
  { abbr: "NJ", lng: -74.5, lat: 40.2 },
  { abbr: "DE", lng: -75.5, lat: 39 },
  { abbr: "MD", lng: -76.7, lat: 39.2 },
];

// Compute label placements to avoid overlaps
type LabelPlacement = "top" | "bottom" | "left" | "right";

function computeLabelPlacements(
  cities: City[],
): Record<string, LabelPlacement> {
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
        if (
          Math.abs(lLng - p.labelLng) < LABEL_W &&
          Math.abs(lLat - p.labelLat) < LABEL_H
        )
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

function getLabelOffset(
  placement: LabelPlacement,
  s: number,
): { x: number; y: number; anchor: string } {
  switch (placement) {
    case "top":
      return { x: 0, y: -10 / s, anchor: "middle" };
    case "bottom":
      return { x: 0, y: 14 / s, anchor: "middle" };
    case "right":
      return { x: 8 / s, y: 3 / s, anchor: "start" };
    case "left":
      return { x: -8 / s, y: 3 / s, anchor: "end" };
  }
}

export function WorldMapSVG({
  now,
  selectedCities,
  allCities = [],
  hoveredCity,
  onHoverCity,
  highlightColor,
  showTimezones = false,
  hoveredTimezone,
  onHoverTimezone,
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

  const tzLineColor = useMemo(() => `${highlightColor}70`, [highlightColor]);
  const tzLabelColor = useMemo(() => `${highlightColor}90`, [highlightColor]);

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

  // Touch support for tooltips on mobile
  const handlePinTouch = useCallback(
    (city: City, e: React.TouchEvent) => {
      e.stopPropagation();
      // Don't prevent default here to allow two-finger gesture to work
      // and to allow page scrolling if not a direct tap
      const touch = e.touches[0];
      if (tooltipCity?.city.id === city.id) {
        onHoverCity(null);
        setTooltipCity(null);
      } else {
        onHoverCity(city);
        setTooltipCity({
          city,
          screenX: touch.clientX,
          screenY: touch.clientY,
        });
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
      // Show overlay if they try to move with one finger
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

  const nightPoints = useMemo(() => getTerminatorPath(now, 800, 400), [now]);

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
      className={`relative touch-pan-y sm:touch-auto ${zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`} 
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
              <div className="w-2 h-8 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-8 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
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
            onClick={() => {
              setZoom(1);
              setCenter([0, 0]);
            }}
            className="w-10 h-10 sm:w-7 sm:h-7 rounded-md bg-card/80 border border-border text-muted-foreground text-[10px] font-medium hover:bg-secondary/80 backdrop-blur-sm flex items-center justify-center"
            title="Reset zoom"
          >
            ↺
          </button>
        )}
      </div>

      <ComposableMap
        projection="geoEquirectangular"
        projectionConfig={{ scale: 130, center: [0, 0] }}
        width={800}
        height={400}
        className="w-full h-auto rounded-lg"
        style={{ backgroundColor: "hsl(var(--card))" }}
        onClick={() => {
          onHoverCity(null);
          setTooltipCity(null);
        }}
      >
        <ZoomableGroup
          zoom={zoom}
          center={center}
          onMoveEnd={({ coordinates, zoom: z }) => {
            setCenter(coordinates as [number, number]);
            setZoom(z);
          }}
          minZoom={1}
          maxZoom={8}
          // Only allow panning/zooming with two fingers on mobile
          // or always on desktop
          filterZoomEvent={(e) => {
            if (e.type === 'wheel') return true;
            if (e.type === 'mousedown') return true;
            if (e.type.startsWith('touch')) return isTwoFingerRef.current;
            return true;
          }}
        >
          {/* Land */}
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const isUS = geo.properties.name === "United States of America";
                const isUSHovered = isUS && zoom === 1 && hoveredCity?.id === "usa-continent";
                
                // Rough center longitude for timezone highlighting
                // We'll use the bounding box center if available, or just the first coordinate
                let centerLng = 0;
                if (geo.geometry.type === "Polygon") {
                  centerLng = geo.geometry.coordinates[0][0][0];
                } else if (geo.geometry.type === "MultiPolygon") {
                  centerLng = geo.geometry.coordinates[0][0][0][0];
                }
                
                const countryTz = Math.round(centerLng / 15);
                const isInHoveredTz = showTimezones && hoveredTimezone === countryTz;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={isUSHovered || isInHoveredTz ? highlightColor : landFill}
                    stroke={isInHoveredTz ? highlightColor : landStroke}
                    strokeWidth={isInHoveredTz ? 1.5 : 0.5}
                    opacity={isInHoveredTz ? 0.6 : 1}
                    onMouseEnter={() => {
                      if (isUS && zoom === 1) {
                        onHoverCity({ id: "usa-continent", name: "USA", country: "USA", timezone: "America/New_York", coordinates: [-98, 38] } as City);
                      }
                    }}
                    onMouseLeave={() => {
                      if (isUS && zoom === 1) onHoverCity(null);
                    }}
                    style={{
                      default: { outline: "none" },
                      hover: {
                        outline: "none",
                        fill: highlightColor,
                        opacity: 0.8,
                      },
                      pressed: { outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>

          {/* US State boundaries with individual hover */}
          <Geographies geography={US_STATES_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const isUSHovered = zoom === 1 && hoveredCity?.id === "usa-continent";
                if (isUSHovered) return null; // Hide state lines when US continent is hovered at zoom 1

                // Calculate state timezone
                let centerLng = 0;
                if (geo.geometry.type === "Polygon") {
                  centerLng = geo.geometry.coordinates[0][0][0];
                } else if (geo.geometry.type === "MultiPolygon") {
                  centerLng = geo.geometry.coordinates[0][0][0][0];
                }
                const stateTz = Math.round(centerLng / 15);
                const isInHoveredTz = showTimezones && hoveredTimezone === stateTz;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={isInHoveredTz ? `${highlightColor}30` : "transparent"}
                    stroke={isInHoveredTz ? highlightColor : landStroke}
                    strokeWidth={isInHoveredTz ? 1 / zoom : 0.3 / zoom}
                    style={{
                      default: { outline: "none" },
                      hover: {
                        outline: "none",
                        fill: `${highlightColor}50`,
                        stroke: highlightColor,
                        strokeWidth: 1 / zoom,
                      },
                      pressed: { outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>

          {/* US timezone boundary lines */}
          {/* {showTimezones &&
            US_TZ_BOUNDARIES.map((tz, i) => (
              <Line
                key={`us-tz-${i}`}
                from={tz.from}
                to={tz.to}
                stroke={highlightColor}
                strokeWidth={1.2 / zoom}
                strokeDasharray="4 2"
                strokeLinecap="round"
              />
            ))} */}

          {/* US state abbreviation labels */}
          {zoom >= 2.5 &&
            US_STATE_LABELS.map(({ abbr, lng, lat }) => {
              const s = Math.pow(zoom, 0.6);
              return (
                <Marker key={`st-${abbr}`} coordinates={[lng, lat]}>
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={6 / s}
                    fontWeight={600}
                    fontFamily="'Inter', sans-serif"
                    fill="hsl(var(--foreground))"
                    stroke="hsl(var(--card))"
                    strokeWidth={1.5 / s}
                    paintOrder="stroke"
                    className="pointer-events-none select-none"
                  >
                    {abbr}
                  </text>
                </Marker>
              );
            })}

          {/* Timezone meridian lines and interactive strips */}
          {showTimezones &&
            TIMEZONE_LONGITUDES.map((lng, i) => {
              const offset = Math.round(lng / 15);
              const isHovered = hoveredTimezone === offset;
              const stripColor = i % 2 === 0 ? `${highlightColor}25` : `${highlightColor}12`;
              
              return (
                <React.Fragment key={`tz-group-${lng}`}>
                  {/* Interactive strip for hover */}
                  <rect
                    x={lng}
                    y={-90}
                    width={15}
                    height={180}
                    fill={isHovered ? `${highlightColor}40` : stripColor}
                    opacity={isHovered ? 0.6 : 0.3}
                    onMouseEnter={() => onHoverTimezone(offset)}
                    onMouseLeave={() => onHoverTimezone(null)}
                    className="cursor-pointer transition-all duration-200"
                  />
                  <Line
                    from={[lng, -85]}
                    to={[lng, 85]}
                    stroke={tzLineColor}
                    strokeWidth={0.8 / zoom}
                  />
                </React.Fragment>
              );
            })}

          {/* UTC labels on timezone lines */}
          {showTimezones &&
            TIMEZONE_LONGITUDES.filter((lng) => lng >= -180 && lng < 180).map(
              (lng) => {
                const utcOffset = Math.round(lng / 15);
                const isHovered = hoveredTimezone === utcOffset;
                const label =
                  utcOffset === 0
                    ? "GMT"
                    : `${utcOffset > 0 ? "+" : ""}${utcOffset}`;
                const s = Math.pow(zoom, 0.6);
                return (
                  <Marker key={`tz-label-${lng}`} coordinates={[lng, -78]}>
                    <text
                      textAnchor="middle"
                      fontSize={Math.max(5, 7 * Math.pow(zoom, 0.3)) / zoom}
                      fill={isHovered ? highlightColor : tzLabelColor}
                      fontFamily="'Inter', sans-serif"
                      fontWeight={isHovered || utcOffset === 0 ? 600 : 400}
                      className="pointer-events-none select-none transition-colors duration-200"
                    >
                      {label}
                    </text>
                  </Marker>
                );
              },
            )}

          {/* Night overlay */}
          <polygon
            points={nightPoints}
            fill="hsla(220, 25%, 8%, 0.35)"
            className="pointer-events-none"
          />

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
                  onMouseEnter={(e) =>
                    handlePinEnter(city, e as unknown as React.MouseEvent)
                  }
                  onMouseLeave={handlePinLeave}
                  onTouchStart={(e: React.TouchEvent) => handlePinTouch(city, e)}
                  className="cursor-pointer"
                >
                  {/* Larger hit area for touch */}
                  <circle r={12 / s} fill="transparent" />
                  <circle
                    r={(isHovered ? 6 : 3.5) / s}
                    fill={
                      isHovered
                        ? "hsl(var(--foreground))"
                        : "hsl(var(--muted-foreground))"
                    }
                    opacity={isHovered ? 0.9 : 0.55}
                  />
                  <circle
                    r={(isHovered ? 3.5 : 2) / s}
                    fill="hsl(var(--card))"
                  />
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

            // Check if city is in hovered timezone
            const cityOffset = Math.round((city.lng || city.coordinates[0]) / 15);
            const isInHoveredTz = showTimezones && hoveredTimezone === cityOffset;

            return (
              <Marker
                key={city.id}
                coordinates={[city.lng || city.coordinates[0], city.lat || city.coordinates[1]]}
                onMouseEnter={(e) =>
                  handlePinEnter(city, e as unknown as React.MouseEvent)
                }
                onMouseLeave={handlePinLeave}
                onTouchStart={(e: React.TouchEvent) => handlePinTouch(city, e)}
                className="cursor-pointer"
              >
                {/* Larger hit area for touch */}
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
          style={{
            left: tooltipCity.screenX + 12,
            top: tooltipCity.screenY - 20,
          }}
        >
          <div className="bg-card border border-border rounded-lg shadow-lg px-3 py-2 min-w-[130px]">
            <p className="text-xs font-semibold text-foreground">
              {tooltipCity.city.name}, {tooltipCity.city.country}
            </p>
            <p
              className="text-sm font-mono font-semibold mt-0.5"
              style={{ color: highlightColor }}
            >
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
                  tod === "day"
                    ? Sun
                    : tod === "afternoon"
                      ? Sun
                      : tod === "night"
                        ? Moon
                        : tod === "dawn"
                          ? Sunrise
                          : Sunset;
                const iconColor =
                  tod === "day"
                    ? "#edb423"
                    : tod === "afternoon"
                      ? "#fbbf24"
                      : tod === "night"
                        ? "#72708e"
                        : tod === "dawn"
                          ? "#e26f71"
                          : "#9e6ae2";
                const label =
                  tod === "day"
                    ? "Morning"
                    : tod === "afternoon"
                      ? "Afternoon"
                      : tod === "night"
                        ? "Night"
                        : tod === "dawn"
                          ? "Dawn"
                          : "Evening";
                return (
                  <span className="inline-flex items-center gap-0.5">
                    <TodIcon size={10} color={iconColor} strokeWidth={2} />{" "}
                    {label}
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
