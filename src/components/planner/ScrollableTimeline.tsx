import React, { useRef, useCallback, useEffect, useState } from "react";
import { addDays, format, isSameDay } from "date-fns";
import {
  getTimeOfDay,
  getTimezoneAbbreviation,
  convertTime,
} from "@/utils/timezone";
import { useWorldClock } from "@/hooks/useWorldClock";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sun,
  Moon,
  Sunrise,
  Sunset,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
} from "lucide-react";

// Returns opacity based on time-of-day, with inverted values for light mode
function getTimeOfDayOpacity(cityHour: number, isDarkMode: boolean): number {
  if (isDarkMode) {
    // Dark mode opacities
    if (cityHour >= 5 && cityHour < 8) return 0.4; // Dawn
    if (cityHour >= 8 && cityHour < 13) return 1; // Morning
    if (cityHour >= 13 && cityHour < 18) return 0.8; // Afternoon
    if (cityHour >= 18 && cityHour < 22) return 0.6; // Evening
    return 0.2; // Night (10pm-4am)
  } else {
    // Light mode opacities (inverted)
    if (cityHour >= 5 && cityHour < 8) return 0.8; // Dawn
    if (cityHour >= 8 && cityHour < 13) return 0.2; // Morning
    if (cityHour >= 13 && cityHour < 18) return 0.4; // Afternoon
    if (cityHour >= 18 && cityHour < 22) return 0.6; // Evening
    return 1; // Night (10pm-4am)
  }
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

interface City {
  id: string;
  name: string;
  timezone: string;
  country: string;
}

interface ScrollableTimelineProps {
  selectedCities: City[];
  fromCityIdx: number;
  fromCity: City;
  cityOffsets: number[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  selectedHour: number;
  onSelectHour: (hour: number) => void;
  selectedMinute: number;
  duration: number;
  currentHourInBase: number | null;
  now: Date;
  getDiffLabel: (offset: number) => string;
  onDragMove: (newStart: number) => void;
  onResizeEnd: (newDuration: number) => void;
}

function TimeOfDayIcon({ tod }: { tod: string }) {
  switch (tod) {
    case "day":
      return <Sun className="h-3 w-3 text-dayicon" />;
    case "afternoon":
      return <Sun className="h-3 w-3 text-dayicon" />;
    case "night":
      return <Moon className="h-3 w-3 text-nighticon" />;
    case "dawn":
      return <Sunrise className="h-3 w-3 text-sunriseicon" />;
    case "dusk":
      return <Sunset className="h-3 w-3 text-sunseticon" />;
    default:
      return null;
  }
}

const TOTAL_CELLS = 72; // 3 days
const DAY_CELLS = 24;
const CENTER_START = 24; // current day starts at cell 24

function formatHour(hour: number, use24h: boolean): string {
  if (use24h) return hour.toString().padStart(2, "0");
  const h = hour % 12 || 12;
  return `${h}`;
}

function formatHourAmPm(hour: number): string {
  return hour < 12 ? "AM" : "PM";
}

function formatHourFull(hour: number, use24h: boolean): string {
  if (use24h) return hour.toString().padStart(2, "0") + ":00";
  const h = hour % 12 || 12;
  const ampm = hour < 12 ? "AM" : "PM";
  return `${h}:00 ${ampm}`;
}

export function ScrollableTimeline({
  selectedCities,
  fromCityIdx,
  fromCity,
  cityOffsets,
  selectedDate,
  onSelectDate,
  selectedHour,
  onSelectHour,
  selectedMinute,
  duration,
  currentHourInBase,
  now,
  getDiffLabel,
  onDragMove,
  onResizeEnd,
}: ScrollableTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAdjusting = useRef(false);
  const dateChangedByScroll = useRef(false);
  const wheelTargetRef = useRef<number | null>(null);
  const wheelRafRef = useRef<number | null>(null);

  const { highlightColor, timelineHighlightColor, dayIndicationColor, theme } =
    useWorldClock();
  const isMobile = useIsMobile();
  const isDarkMode = theme === "dark";
  const [dateFlash, setDateFlash] = useState(false);
  const [use24h, setUse24h] = useState(true);

  // Drag state
  const [dragging, setDragging] = useState<
    "move" | "resize" | "resize-start" | null
  >(null);
  const dragStartX = useRef(0);
  const dragStartValue = useRef(0);
  const dragStartValue2 = useRef(0);

  const isToday = isSameDay(selectedDate, new Date());

  // Center scroll on current day
  const centerScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = el.clientWidth;
    wheelTargetRef.current = el.scrollLeft;
  }, []);

  // On mount, center + attach smooth wheel handler
  useEffect(() => {
    centerScroll();
    const el = scrollRef.current;
    if (!el) return;

    const animate = () => {
      const target = wheelTargetRef.current ?? el.scrollLeft;
      const diff = target - el.scrollLeft;

      if (Math.abs(diff) < 0.5) {
        el.scrollLeft = target;
        wheelRafRef.current = null;
        return;
      }

      el.scrollLeft += diff * 0.22;
      wheelRafRef.current = requestAnimationFrame(animate);
    };

    const wheelHandler = (e: WheelEvent) => {
      const delta =
        Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (delta === 0) return;

      e.preventDefault();
      const maxScroll = el.scrollWidth - el.clientWidth;
      const base = wheelTargetRef.current ?? el.scrollLeft;
      wheelTargetRef.current = Math.max(
        0,
        Math.min(maxScroll, base + delta * 0.9),
      );

      if (wheelRafRef.current === null) {
        wheelRafRef.current = requestAnimationFrame(animate);
      }
    };

    el.addEventListener("wheel", wheelHandler, { passive: false });

    return () => {
      if (wheelRafRef.current !== null) {
        cancelAnimationFrame(wheelRafRef.current);
        wheelRafRef.current = null;
      }
      el.removeEventListener("wheel", wheelHandler);
    };
  }, [centerScroll]);

  // When date changes externally (calendar strip), re-center
  const prevDateRef = useRef(selectedDate);
  useEffect(() => {
    if (prevDateRef.current.getTime() !== selectedDate.getTime()) {
      if (!dateChangedByScroll.current) {
        centerScroll();
      }
      dateChangedByScroll.current = false;
      setDateFlash(true);
      setTimeout(() => setDateFlash(false), 700);
    }
    prevDateRef.current = selectedDate;
  }, [selectedDate, centerScroll]);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (isAdjusting.current) return;
    const el = scrollRef.current;
    if (!el) return;

    const oneDay = el.clientWidth;

    if (el.scrollLeft < oneDay * 0.15) {
      isAdjusting.current = true;
      dateChangedByScroll.current = true;
      el.scrollLeft += oneDay;
      if (wheelTargetRef.current !== null) {
        wheelTargetRef.current += oneDay;
      }
      onSelectDate(addDays(selectedDate, -1));
      requestAnimationFrame(() => {
        isAdjusting.current = false;
      });
    } else if (el.scrollLeft > oneDay * 1.85) {
      isAdjusting.current = true;
      dateChangedByScroll.current = true;
      el.scrollLeft -= oneDay;
      if (wheelTargetRef.current !== null) {
        wheelTargetRef.current -= oneDay;
      }
      onSelectDate(addDays(selectedDate, 1));
      requestAnimationFrame(() => {
        isAdjusting.current = false;
      });
    }
  }, [selectedDate, onSelectDate]);

  // Click on a cell
  const handleCellClick = useCallback(
    (cellIndex: number) => {
      const dayOffset = Math.floor(cellIndex / 24);
      const hour = cellIndex % 24;

      if (dayOffset === 0) {
        // Previous day
        dateChangedByScroll.current = true;
        onSelectDate(addDays(selectedDate, -1));
      } else if (dayOffset === 2) {
        // Next day
        dateChangedByScroll.current = true;
        onSelectDate(addDays(selectedDate, 1));
      }
      onSelectHour(hour);
    },
    [selectedDate, onSelectDate, onSelectHour],
  );

  // Selection position in 72-cell space (current day = cells 24-47)
  const selectionAbsStart = CENTER_START + selectedHour;
  const selectionAbsEnd = selectionAbsStart + duration;

  // Unified drag handler for mouse and touch
  const startDrag = useCallback(
    (startX: number, type: "move" | "resize" | "resize-start") => {
      setDragging(type);
      dragStartX.current = startX;
      dragStartValue.current =
        type === "move"
          ? selectedHour
          : type === "resize"
            ? duration
            : selectedHour;
      dragStartValue2.current = duration; // used for resize-start

      const el = scrollRef.current;
      if (!el) return;
      const cellWidth = el.scrollWidth / TOTAL_CELLS;
      const halfCellWidth = cellWidth / 2;

      const handleMove = (clientX: number) => {
        const dx = clientX - dragStartX.current;
        if (type === "move") {
          const dHours = Math.round(dx / cellWidth);
          const newHour = Math.max(
            0,
            Math.min(23, dragStartValue.current + dHours),
          );
          onDragMove(newHour);
        } else if (type === "resize") {
          const dHalfHours = Math.round(dx / halfCellWidth);
          const newDur = Math.max(
            0.5,
            Math.min(24, dragStartValue.current + dHalfHours * 0.5),
          );
          onResizeEnd(newDur);
        } else {
          // resize-start: moving left handle adjusts start AND duration inversely
          const dHalfHours = Math.round(dx / halfCellWidth);
          const delta = dHalfHours * 0.5;
          const newStart = Math.max(
            0,
            Math.min(23, dragStartValue.current + delta),
          );
          const actualDelta = newStart - dragStartValue.current;
          const newDur = Math.max(0.5, dragStartValue2.current - actualDelta);
          onDragMove(newStart);
          onResizeEnd(newDur);
        }
      };

      const handleMouseMove = (ev: MouseEvent) => handleMove(ev.clientX);
      const handleTouchMove = (ev: TouchEvent) => {
        ev.preventDefault();
        handleMove(ev.touches[0].clientX);
      };

      const cleanup = () => {
        setDragging(null);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", cleanup);
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("touchend", cleanup);
        window.removeEventListener("touchcancel", cleanup);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", cleanup);
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("touchend", cleanup);
      window.addEventListener("touchcancel", cleanup);
    },
    [selectedHour, duration, onDragMove, onResizeEnd],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, type: "move" | "resize" | "resize-start") => {
      e.preventDefault();
      e.stopPropagation();
      startDrag(e.clientX, type);
    },
    [startDrag],
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent, type: "move" | "resize" | "resize-start") => {
      e.stopPropagation();
      startDrag(e.touches[0].clientX, type);
    },
    [startDrag],
  );

  // Compute selection overlay percentages
  const selLeftPct = (selectionAbsStart / TOTAL_CELLS) * 100;
  const selWidthPct = (duration / TOTAL_CELLS) * 100;

  return (
    <div className="rounded-xl border border-border bg-card p-1.5 sm:p-5 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-0 mb-3">
        <div className="flex flex-col">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-0.5 flex items-center gap-1.5">
            <LayoutGrid
              className="h-3.5 w-3.5"
              style={{ color: highlightColor }}
            />
            TIME GRID
          </h3>
          <span
            className="text-xs  sm:text-sm font-medium mt-1 sm:mt-1.5 rounded-lg px-2 py-0.5"
            style={{
              fontFamily: "'Inter', sans-serif",
              color: dateFlash ? highlightColor : undefined,
              backgroundColor: dateFlash ? `${highlightColor}26` : undefined,
              border: dateFlash
                ? `1px solid ${highlightColor}54`
                : "1px solid transparent",
            }}
          >
            {format(selectedDate, "EEEE, MMMM d, yyyy")}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* 12/24h toggle */}
          <div className="flex items-center rounded-lg border border-border overflow-hidden mr-2">
            <button
              onClick={() => setUse24h(false)}
              className={`px-2 py-1 text-[10px] font-medium ${
                !use24h
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              style={
                !use24h ? { backgroundColor: `${highlightColor}25` } : undefined
              }
            >
              12h
            </button>
            <button
              onClick={() => setUse24h(true)}
              className={`px-2 py-1 text-[10px] font-medium ${
                use24h
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              style={
                use24h ? { backgroundColor: `${highlightColor}25` } : undefined
              }
            >
              24h
            </button>
          </div>
          <button
            onClick={() => onSelectDate(addDays(selectedDate, -1))}
            className="p-1 rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onSelectDate(addDays(selectedDate, 1))}
            className="p-1 rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <span className="text-[10px] text-muted-foreground ml-2 hidden sm:inline">
            Scroll to navigate days
          </span>
        </div>
      </div>

      {/* Two-column layout: fixed labels + scrollable cells */}
      <div className="flex w-full min-w-0">
        {/* Fixed labels column */}
        <div className="w-16 sm:w-44 flex-shrink-0">
          <div className="h-6" />
          {/* City labels */}
          <div className="space-y-0.5">
            {selectedCities.map((city, idx) => {
              const tod = getTimeOfDay(city.timezone, now);
              const abbrev = getTimezoneAbbreviation(city.timezone, now);
              const offset = cityOffsets[idx] ?? 0;
              const isBase = idx === fromCityIdx;
              const conv = convertTime(
                fromCity.timezone,
                [city.timezone],
                selectedHour,
                selectedMinute,
                now,
              );
              const dayOff = isBase ? 0 : (conv[0]?.dayOffset ?? 0);

              return (
                <div
                  key={city.id}
                  className="h-9 sm:h-9 flex flex-col justify-center pr-1 sm:pr-3"
                >
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <span className="hidden sm:inline">
                      <TimeOfDayIcon tod={tod} />
                    </span>
                    <span
                      className={`text-[9px] sm:text-xs font-medium truncate ${isBase ? "" : "text-foreground"}`}
                      style={isBase ? { color: highlightColor } : undefined}
                    >
                      {city.name}
                    </span>
                  </div>
                  {/* Country name on mobile, abbreviation on desktop */}
                  <div className="flex items-center gap-1 sm:gap-1.5 sm:ml-[18px]">
                    <span className="text-[7px] text-muted-foreground truncate sm:hidden">
                      {city.country}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono hidden sm:inline">
                      {abbrev}
                    </span>
                    {!isBase && getDiffLabel(offset) && (
                      <span className="text-[8px] sm:text-[10px] text-muted-foreground">
                        {getDiffLabel(offset)}
                      </span>
                    )}
                    {dayOff !== 0 && (
                      <span
                        className="text-[8px] sm:text-[10px] font-semibold"
                        style={{ color: dayIndicationColor }}
                      >
                        {dayOff > 0 ? `+${dayOff}d` : `${dayOff}d`}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scrollable cells column */}
        <div
          ref={scrollRef}
          className="flex-1 min-w-0 overflow-x-auto scrollbar-hide"
          onScroll={handleScroll}
        >
          <div style={{ width: "300%" }}>
            {/* City rows + selection overlay */}
            <div className="relative group space-y-0.5 pt-6">
              {/* Selection overlay */}
              <div
                className={`absolute top-6 bottom-0 pointer-events-none z-30`}
                style={{ left: `${selLeftPct}%`, width: `${selWidthPct}%` }}
              >
                <div
                  className={`absolute inset-0 pointer-events-auto ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
                  onMouseDown={(e) => handleMouseDown(e, "move")}
                  onTouchStart={(e) => handleTouchStart(e, "move")}
                >
                  <div
                    className="absolute inset-0 rounded-md"
                    style={{
                      border: `2px solid ${highlightColor}`,
                      backgroundColor: `${highlightColor}1a`,
                    }}
                  />
                  {/* Duration label above the bar */}
                  <div className="absolute -top-6 sm:-top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span
                      className="text-[9px] sm:text-xs font-mono font-semibold bg-card rounded px-1 sm:px-1.5 py-0.5 shadow-sm"
                      style={{
                        color: highlightColor,
                        borderColor: `${highlightColor}4d`,
                        borderWidth: 1,
                        borderStyle: "solid",
                      }}
                    >
                      {formatHourFull(selectedHour, use24h)} –{" "}
                      {formatHourFull(
                        Math.floor((selectedHour + duration) % 24),
                        use24h,
                      )}
                    </span>
                  </div>
                  {/* Left handle (resize from start) */}
                  <div
                    className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-6 rounded-full pointer-events-auto cursor-col-resize hover:scale-110 ${
                      dragging === "resize-start" ? "scale-110" : ""
                    }`}
                    style={{ backgroundColor: highlightColor }}
                    onMouseDown={(e) => handleMouseDown(e, "resize-start")}
                    onTouchStart={(e) => handleTouchStart(e, "resize-start")}
                  />
                  {/* Right resize handle */}
                  <div
                    className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-6 rounded-full pointer-events-auto cursor-col-resize hover:scale-110 ${
                      dragging === "resize" ? "scale-110" : ""
                    }`}
                    style={{ backgroundColor: highlightColor }}
                    onMouseDown={(e) => handleMouseDown(e, "resize")}
                    onTouchStart={(e) => handleTouchStart(e, "resize")}
                  />
                </div>
              </div>

              {/* City rows */}
              {selectedCities.map((city, idx) => {
                const offset = cityOffsets[idx] ?? 0;

                return (
                  <div key={city.id} className="flex gap-px">
                    {Array.from({ length: TOTAL_CELLS }, (_, cellIdx) => {
                      const baseHour = cellIdx % 24;
                      const dayIdx = Math.floor(cellIdx / 24);
                      const cityHour = (((baseHour + offset) % 24) + 24) % 24;
                      const isCurrent =
                        dayIdx === 1 &&
                        isToday &&
                        currentHourInBase !== null &&
                        baseHour === currentHourInBase;
                      const inSelection =
                        cellIdx >= selectionAbsStart &&
                        cellIdx < selectionAbsEnd;
                      const isDimmed = dayIdx !== 1;

                      const opacity = getTimeOfDayOpacity(cityHour, isDarkMode);
                      const effectiveOpacity = isDimmed
                        ? opacity * 0.35
                        : opacity;
                      const cellStyle = {
                        backgroundColor: `rgba(${hexToRgb(timelineHighlightColor)}, ${effectiveOpacity})`,
                      };

                      return (
                        <button
                          key={cellIdx}
                          onClick={() => handleCellClick(cellIdx)}
                          className={`flex-1 h-9 sm:h-9 rounded-sm relative group/cell focus:outline-none focus-visible:outline-none hover:brightness-110 ${
                            cellIdx % 24 === 0 && cellIdx > 0 ? "ml-0.5" : ""
                          }`}
                          style={cellStyle}
                          title={`${city.name}: ${formatHourFull(cityHour, use24h)}`}
                        >
                          {/* Next day indicator line at 00 hour */}
                          {cityHour === 0 && (
                            <div
                              className="absolute left-0 top-0 bottom-0 w-[2px] pointer-events-none z-20"
                              style={{ backgroundColor: dayIndicationColor }}
                            />
                          )}

                          <span
                            className={`absolute inset-0 flex flex-col items-center justify-center font-mono ${
                              inSelection
                                ? "text-[8px] sm:text-[11px] font-semibold"
                                : isDimmed
                                  ? "text-[8px] sm:text-[11px] text-foreground/30"
                                  : "text-[8px] sm:text-[11px] text-foreground/70 group-hover/cell:text-foreground/90"
                            }`}
                            style={
                              inSelection
                                ? { color: highlightColor }
                                : undefined
                            }
                          >
                            {formatHour(cityHour, use24h)}
                            {!use24h && (
                              <span className="text-[8px] sm:text-[10px] leading-none opacity-80">
                                {formatHourAmPm(cityHour)}
                              </span>
                            )}
                          </span>

                          {isCurrent && (
                            <div
                              className="absolute inset-x-0 top-0 bottom-0 rounded-sm pointer-events-none z-20"
                              style={{
                                borderLeft: `2px solid ${highlightColor}99`,
                                borderRight: `2px solid ${highlightColor}99`,
                              }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Overlap row removed - replaced by time-of-day coloring */}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-sm"
            style={{
              backgroundColor: `rgba(${hexToRgb(timelineHighlightColor)}, ${isDarkMode ? 0.4 : 0.8})`,
            }}
          />
          <span className="text-[10px] text-muted-foreground">Dawn</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-sm"
            style={{
              backgroundColor: `rgba(${hexToRgb(timelineHighlightColor)}, ${isDarkMode ? 1 : 0.2})`,
            }}
          />
          <span className="text-[10px] text-muted-foreground">Morning</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-sm"
            style={{
              backgroundColor: `rgba(${hexToRgb(timelineHighlightColor)}, ${isDarkMode ? 0.8 : 0.4})`,
            }}
          />
          <span className="text-[10px] text-muted-foreground">Afternoon</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-sm"
            style={{
              backgroundColor: `rgba(${hexToRgb(timelineHighlightColor)}, ${isDarkMode ? 0.6 : 0.6})`,
            }}
          />
          <span className="text-[10px] text-muted-foreground">Evening</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-sm"
            style={{
              backgroundColor: `rgba(${hexToRgb(timelineHighlightColor)}, ${isDarkMode ? 0.2 : 1})`,
            }}
          />
          <span className="text-[10px] text-muted-foreground">Night</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ border: `2px solid ${highlightColor}99` }}
          />
          <span className="text-[10px] text-muted-foreground">Now</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-sm border-2"
            style={{
              borderColor: highlightColor,
              backgroundColor: `${highlightColor}1a`,
            }}
          />
          <span className="text-[10px] text-muted-foreground">Selected</span>
        </div>
      </div>
    </div>
  );
}
