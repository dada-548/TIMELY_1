import React, { useRef, useCallback, useEffect, useState, useLayoutEffect } from "react";
import { addDays, format, isSameDay, startOfDay } from "date-fns";
import {
  getTimeOfDay,
  getTimezoneAbbreviation,
  convertTime,
} from "@/utils/timezone";
import { useWorldClock } from "@/hooks/useWorldClock";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  Sun,
  Moon,
  Sunrise,
  Sunset,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  MessageSquare,
  Briefcase,
  Clock,
  X,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  maxHeight?: string;
}

function TimeOfDayIcon({ tod, className }: { tod: string; className?: string }) {
  const colorClass = {
    dawn: "text-sunriseicon",
    day: "text-dayicon",
    afternoon: "text-dayicon",
    dusk: "text-sunseticon",
    night: "text-nighticon",
  }[tod as keyof typeof colorClass] || "";

  switch (tod) {
    case "day":
    case "afternoon":
      return <Sun className={cn("h-3 w-3", colorClass, className)} />;
    case "night":
      return <Moon className={cn("h-3 w-3", colorClass, className)} />;
    case "dawn":
      return <Sunrise className={cn("h-3 w-3", colorClass, className)} />;
    case "dusk":
      return <Sunset className={cn("h-3 w-3", colorClass, className)} />;
    default:
      return null;
  }
}

const TOTAL_CELLS = 120; // 5 days
const DAY_CELLS = 24;
const CENTER_START = 48; // current day starts at cell 48

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
  maxHeight,
}: ScrollableTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAdjusting = useRef(false);
  const dateChangedByScroll = useRef(false);
  const wheelTargetRef = useRef<number | null>(null);
  const wheelRafRef = useRef<number | null>(null);

  const {
    highlightColor,
    timelineHighlightColor,
    dayIndicationColor,
    theme,
    use24h,
    timelineMode,
    setTimelineMode,
    removeCity,
  } = useWorldClock();
  const isMobile = useIsMobile();
  const cellWidth = isMobile ? 32 : 36;
  const isDarkMode = theme === "dark";
  const [dateFlash, setDateFlash] = useState(false);
  const [visible, setVisible] = useState(true);

  // Drag state
  const [dragging, setDragging] = useState<
    "move" | "resize" | "resize-start" | null
  >(null);
  const dragStartX = useRef(0);
  const dragStartValue = useRef(0);
  const dragStartValue2 = useRef(0);

  const isToday = isSameDay(selectedDate, new Date());

  // Center scroll on current day or current hour
  const centerScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    
    isAdjusting.current = true;
    // If we have a current hour, center on it to show "12 hours in the future"
    // Otherwise center on the start of the current day
    const startHour = currentHourInBase !== null ? currentHourInBase : 0;
    const scrollLeft = (CENTER_START + startHour) * cellWidth - el.clientWidth / 2 + cellWidth / 2;
    el.scrollLeft = scrollLeft;
    wheelTargetRef.current = scrollLeft;
    
    requestAnimationFrame(() => {
      isAdjusting.current = false;
    });
  }, [currentHourInBase, cellWidth]);

  // On mount, attach smooth wheel handler
  useEffect(() => {
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

      isAdjusting.current = true;
      el.scrollLeft += diff * 0.22;
      wheelRafRef.current = requestAnimationFrame(animate);
      requestAnimationFrame(() => {
        isAdjusting.current = false;
      });
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
  }, [cellWidth]);

  // Initial center on mount
  useEffect(() => {
    centerScroll();
  }, []); // Only once on mount

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

    const oneDay = 24 * cellWidth;

    // Thresholds for 5-day buffer:
    // We want to stay roughly between day 1.5 and 3.5
    if (el.scrollLeft < oneDay * 1.5) {
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
    } else if (el.scrollLeft > oneDay * 3.5) {
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
  }, [selectedDate, onSelectDate, cellWidth]);

  // Click on a cell
  const handleCellClick = useCallback(
    (cellIndex: number) => {
      const dayOffset = Math.floor(cellIndex / 24);
      const hour = cellIndex % 24;

      // If we click a cell in a different day (Yesterday or Tomorrow), 
      // we need to shift the scroll position to keep the clicked hour under the mouse
      if (dayOffset !== 2) {
        dateChangedByScroll.current = true;
        if (scrollRef.current) {
          // A full day is 24 cells + the 2px margin between days
          const oneDay = 24 * cellWidth + 2;
          isAdjusting.current = true;
          
          // Calculate the shift: 
          // If we click Yesterday (dayOffset 1), we move 1 day forward (+oneDay)
          // If we click Tomorrow (dayOffset 3), we move 1 day backward (-oneDay)
          const daysToShift = 2 - dayOffset;
          const shiftAmount = daysToShift * oneDay;
          
          scrollRef.current.scrollLeft += shiftAmount;
          if (wheelTargetRef.current !== null) {
            wheelTargetRef.current += shiftAmount;
          }
          
          requestAnimationFrame(() => {
            isAdjusting.current = false;
          });
        }
        onSelectDate(addDays(selectedDate, dayOffset - 2));
      }
      
      // Select the hour. This should NOT trigger a re-center because of the 
      // check in the useEffect that watches selectedDate.
      onSelectHour(hour);
    },
    [selectedDate, onSelectDate, onSelectHour, cellWidth],
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

  // Compute selection overlay position in pixels
  const getCellLeft = (idx: number) => {
    const marginOffset = Math.floor(idx / 24) * 2;
    return idx * cellWidth + marginOffset;
  };

  const selLeft = getCellLeft(selectionAbsStart);
  const selWidth = getCellLeft(selectionAbsStart + duration) - selLeft;

  return (
    <div className="rounded-xl border border-border bg-card p-1.5 sm:p-5 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-0 mb-3">
        <button
          onClick={() => setVisible((v) => !v)}
          className="flex flex-col items-start hover:text-foreground/80 transition-colors text-left"
        >
          <div className="flex items-center gap-2 text-foreground text-sm font-bold mb-2 px-2">
            <LayoutGrid
              className="h-4 w-4"
              style={{ color: highlightColor }}
            />
            <span>TIME GRID</span>
          </div>
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
        </button>
        <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
          {/* Timeline Modes */}
          <div className="flex items-center rounded-lg border border-border overflow-hidden bg-card mr-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setTimelineMode("default")}
                    className={`p-1.5 transition-colors ${
                      timelineMode === "default"
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    style={
                      timelineMode === "default"
                        ? { backgroundColor: `${highlightColor}25` }
                        : undefined
                    }
                  >
                    <Clock className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Default Grid</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setTimelineMode("tod")}
                    className={`p-1.5 border-l border-border transition-colors ${
                      timelineMode === "tod"
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    style={
                      timelineMode === "tod"
                        ? { backgroundColor: `${highlightColor}25` }
                        : undefined
                    }
                  >
                    <Sun className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Time of Day</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setTimelineMode("friendly")}
                    className={`p-1.5 border-l border-border transition-colors ${
                      timelineMode === "friendly"
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    style={
                      timelineMode === "friendly"
                        ? { backgroundColor: `${highlightColor}25` }
                        : undefined
                    }
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Friendly Hours (9 AM - 9 PM)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setTimelineMode("working")}
                    className={`p-1.5 border-l border-border transition-colors ${
                      timelineMode === "working"
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    style={
                      timelineMode === "working"
                        ? { backgroundColor: `${highlightColor}25` }
                        : undefined
                    }
                  >
                    <Briefcase className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Working Hours (9 AM - 6 PM)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
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

          <button
            onClick={() => setVisible((v) => !v)}
            className="p-1 text-muted-foreground hover:text-foreground ml-1"
          >
            {visible ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Two-column layout: fixed labels + scrollable cells */}
      {visible && (
        <>
          <div 
            className="flex w-full min-w-0 overflow-y-auto scrollbar-thin scrollbar-thumb-border"
            style={maxHeight ? { maxHeight } : undefined}
          >
        {/* Fixed labels column */}
        <div className="w-16 sm:w-44 flex-shrink-0 border-r border-border/50 bg-card/50">
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
                  className="h-[44px] flex items-center group/label relative px-2 sm:px-3"
                >
                  <div className="flex flex-col justify-center min-w-0 flex-1">
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

                  {/* Remove button - positioned to the right of the city name */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCity(city.id);
                    }}
                    className="opacity-0 group-hover/label:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-opacity flex-shrink-0 ml-1"
                    title="Remove city"
                  >
                    <X className="h-3 w-3" />
                  </button>
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
          <div style={{ width: getCellLeft(TOTAL_CELLS) }}>
            {/* City rows + selection overlay */}
            <div className="relative group space-y-0.5 pt-6">
              {/* Selection overlay */}
              <div
                className={`absolute top-6 bottom-0 pointer-events-none z-30`}
                style={{ left: selLeft, width: selWidth }}
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
                  <div key={city.id} className="flex">
                    {Array.from({ length: TOTAL_CELLS }, (_, cellIdx) => {
                      const baseHour = cellIdx % 24;
                      const dayIdx = Math.floor(cellIdx / 24);
                      const cityHour = (((baseHour + offset) % 24) + 24) % 24;
                      const isCurrent =
                        dayIdx === 2 &&
                        isToday &&
                        currentHourInBase !== null &&
                        baseHour === currentHourInBase;
                      const inSelection =
                        cellIdx >= selectionAbsStart &&
                        cellIdx < selectionAbsEnd;
                      const isDimmed = dayIdx !== 2;

                      const opacity = getTimeOfDayOpacity(cityHour, isDarkMode);
                      const effectiveOpacity = isDimmed
                        ? opacity * 0.35
                        : opacity;

                      // Hide background color when a mode is selected
                      const showBg = timelineMode === "default";
                      const cellStyle = {
                        backgroundColor: showBg
                          ? `rgba(${hexToRgb(timelineHighlightColor)}, ${effectiveOpacity})`
                          : isDimmed
                            ? isDarkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"
                            : "transparent",
                        border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"}`,
                        backgroundClip: "padding-box",
                        transition: "none",
                      };

                      // Mode-specific logic
                      const isFriendly = cityHour >= 9 && cityHour < 21;
                      const isWorking = cityHour >= 9 && cityHour < 18;

                      return (
                        <button
                          key={cellIdx}
                          onClick={() => handleCellClick(cellIdx)}
                          className={`h-[44px] rounded-sm relative group/cell focus:outline-none focus-visible:outline-none hover:brightness-110 overflow-hidden ${
                            cellIdx % 24 === 0 && cellIdx > 0 ? "ml-0.5" : ""
                          }`}
                          style={{
                            ...cellStyle,
                            minWidth: cellWidth,
                            flex: `0 0 ${cellWidth}px`,
                          }}
                          title={`${city.name}: ${formatHourFull(cityHour, use24h)}`}
                        >
                          {/* Next day indicator line at 00 hour */}
                          {cityHour === 0 && (
                            <div
                              className="absolute left-0 top-0 bottom-0 w-[2px] pointer-events-none z-20"
                              style={{ backgroundColor: dayIndicationColor }}
                            />
                          )}

                          <div
                            className={`absolute inset-0 flex flex-col items-center justify-center font-mono ${
                              inSelection
                                ? "font-semibold"
                                : isDimmed
                                  ? "text-foreground/30"
                                  : "text-foreground/70 group-hover/cell:text-foreground/90"
                            }`}
                            style={
                              inSelection
                                ? { color: highlightColor }
                                : undefined
                            }
                          >
                            <span className="text-[11px]">
                              {formatHour(cityHour, use24h)}
                            </span>
                            {!use24h && (
                              <span className="text-[11px] font-extrabold leading-none">
                                {formatHourAmPm(cityHour)}
                              </span>
                            )}

                            {/* Mode Icons */}
                            {timelineMode === "tod" && (
                              <div className="mt-0.5">
                                <TimeOfDayIcon
                                  tod={getTimeOfDay(city.timezone, now, cityHour)}
                                  className={`h-2.5 w-2.5 ${isDimmed ? "opacity-30" : ""}`}
                                />
                              </div>
                            )}
                            {timelineMode === "friendly" && isFriendly && (
                              <div className="mt-0.5">
                                <MessageSquare
                                  className={`h-2.5 w-2.5 text-green-500 ${isDimmed ? "opacity-30" : ""}`}
                                />
                              </div>
                            )}
                            {timelineMode === "working" && isWorking && (
                              <div className="mt-0.5">
                                <Briefcase
                                  className={`h-2.5 w-2.5 text-blue-500 ${isDimmed ? "opacity-30" : ""}`}
                                />
                              </div>
                            )}
                          </div>

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
        {timelineMode === "default" ? (
          <>
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
          </>
        ) : timelineMode === "tod" ? (
          <>
            <div className="flex items-center gap-1.5">
              <Sunrise className="h-3 w-3 text-sunriseicon" />
              <span className="text-[10px] text-muted-foreground">Dawn</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sun className="h-3 w-3 text-dayicon" />
              <span className="text-[10px] text-muted-foreground">Day</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sunset className="h-3 w-3 text-sunseticon" />
              <span className="text-[10px] text-muted-foreground">Dusk</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Moon className="h-3 w-3 text-nighticon" />
              <span className="text-[10px] text-muted-foreground">Night</span>
            </div>
          </>
        ) : timelineMode === "friendly" ? (
          <div className="flex items-center gap-1.5">
            <MessageSquare className="h-3 w-3 text-green-500" />
            <span className="text-[10px] text-muted-foreground">
              Friendly (9 AM - 9 PM)
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <Briefcase className="h-3 w-3 text-blue-500" />
            <span className="text-[10px] text-muted-foreground">
              Working (9 AM - 6 PM)
            </span>
          </div>
        )}
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
    </>
  )}
</div>
);
}
