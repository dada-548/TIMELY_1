import React, { useRef, useCallback, useState } from "react";
import {
  isWorkingHour,
  getTimeOfDay,
  getTimezoneAbbreviation,
} from "@/utils/timezone";
import { Sun, Moon, Sunrise, Sunset } from "lucide-react";
import { useWorldClock } from "@/hooks/useWorldClock";

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

interface TimelineRowProps {
  cityName: string;
  timezone: string;
  offsetFromBase: number;
  selectionStart: number;
  selectionDuration: number;
  currentHourInBase: number | null;
  now: Date;
  isBase?: boolean;
  dayOffset?: number;
  diffLabel?: string; // e.g. "+16h"
  onHourClick?: (hour: number) => void;
}

export function TimelineRow({
  cityName,
  timezone,
  offsetFromBase,
  selectionStart,
  selectionDuration,
  currentHourInBase,
  now,
  isBase = false,
  dayOffset = 0,
  diffLabel,
  onHourClick,
}: TimelineRowProps) {
  const { highlightColor, dayIndicationColor } = useWorldClock();
  const tod = getTimeOfDay(timezone, now);
  const abbrev = getTimezoneAbbreviation(timezone, now);

  return (
    <div className="flex items-center group/row">
      {/* City label */}
      <div className="w-36 sm:w-44 flex-shrink-0 pr-3">
        <div className="flex items-center gap-1.5">
          <TimeOfDayIcon tod={tod} />
          <span
            className={`text-xs font-medium truncate ${isBase ? "" : "text-foreground"}`}
            style={isBase ? { color: highlightColor } : undefined}
          >
            {cityName}
          </span>
        </div>
        <div className="flex items-center gap-1.5 ml-[18px]">
          <span className="text-[10px] text-muted-foreground font-mono">
            {abbrev}
          </span>
          {diffLabel && !isBase && (
            <span className="text-[10px] text-muted-foreground">
              {diffLabel}
            </span>
          )}
          {dayOffset !== 0 && (
            <span
              className="text-[10px] font-semibold"
              style={{ color: dayIndicationColor }}
            >
              {dayOffset > 0 ? `+${dayOffset}d` : `${dayOffset}d`}
            </span>
          )}
        </div>
      </div>

      {/* Timeline cells */}
      <div className="flex-1 flex gap-px relative">
        {Array.from({ length: 24 }, (_, baseHour) => {
          const cityHour = (((baseHour + offsetFromBase) % 24) + 24) % 24;
          const working = isWorkingHour(cityHour);
          const isCurrent =
            currentHourInBase !== null && baseHour === currentHourInBase;
          const inSelection =
            baseHour >= selectionStart &&
            baseHour < selectionStart + selectionDuration;
          // Day boundary: city crosses midnight
          const crossesMidnight = cityHour === 0 && offsetFromBase !== 0;

          return (
            <button
              key={baseHour}
              onClick={() => onHourClick?.(baseHour)}
              className={`flex-1 h-9 rounded-sm relative group/cell ${
                working ? "working-hour-cell-active" : "bg-muted/30"
              } ${inSelection ? "selection-cell" : ""} ${
                isCurrent ? "" : ""
              } hover:brightness-110`}
              title={`${cityName}: ${cityHour.toString().padStart(2, "0")}:00${working ? " (Working)" : ""}`}
            >
              {/* City-local hour label */}
              <span
                className={`absolute inset-0 flex items-center justify-center font-mono ${
                  inSelection
                    ? "text-[9px] font-semibold"
                    : "text-[8px] text-foreground/30 group-hover/cell:text-foreground/60"
                }`}
                style={inSelection ? { color: highlightColor } : undefined}
              >
                {cityHour.toString().padStart(2, "0")}
              </span>

              {/* NOW marker */}
              {isCurrent && (
                <div
                  className="absolute inset-x-0 top-0 bottom-0 border-x-2 rounded-sm pointer-events-none z-20"
                  style={{ borderColor: `${highlightColor}99` }}
                />
              )}

              {/* Day boundary marker */}
              {crossesMidnight && (
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-overlap-warning pointer-events-none z-10" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Draggable selection overlay for the timeline container
interface DragSelectionOverlayProps {
  selectionStart: number;
  selectionDuration: number;
  onDragMove: (newStart: number) => void;
  onResizeEnd: (newDuration: number) => void;
}

export function DragSelectionOverlay({
  selectionStart,
  selectionDuration,
  onDragMove,
  onResizeEnd,
}: DragSelectionOverlayProps) {
  const { highlightColor } = useWorldClock();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<"move" | "resize-end" | null>(null);
  const dragStartX = useRef(0);
  const dragStartValue = useRef(0);

  const getHourFromX = useCallback((clientX: number) => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(23, Math.round(ratio * 24)));
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, type: "move" | "resize-end") => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(type);
      dragStartX.current = e.clientX;
      dragStartValue.current =
        type === "move" ? selectionStart : selectionDuration;

      const handleMouseMove = (ev: MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const cellWidth = rect.width / 24;
        const dx = ev.clientX - dragStartX.current;
        const dHours = Math.round(dx / cellWidth);

        if (type === "move") {
          const newStart = Math.max(
            0,
            Math.min(23, dragStartValue.current + dHours),
          );
          onDragMove(newStart);
        } else {
          const newDur = Math.max(
            1,
            Math.min(24, dragStartValue.current + dHours),
          );
          onResizeEnd(newDur);
        }
      };

      const handleMouseUp = () => {
        setDragging(null);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [selectionStart, selectionDuration, onDragMove, onResizeEnd],
  );

  const leftPercent = (selectionStart / 24) * 100;
  const widthPercent = (selectionDuration / 24) * 100;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none z-30"
    >
      {/* Selection bar */}
      <div
        className={`absolute top-0 bottom-0 pointer-events-auto ${
          dragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
        onMouseDown={(e) => handleMouseDown(e, "move")}
      >
        {/* Selection highlight */}
        <div
          className="absolute inset-0 border-2 rounded-md"
          style={{
            borderColor: highlightColor,
            backgroundColor: `${highlightColor}1a`,
          }}
        />

        {/* Top label */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span
            className="text-[10px] font-mono font-semibold bg-card border rounded px-1.5 py-0.5 shadow-sm"
            style={{
              color: highlightColor,
              borderColor: `${highlightColor}4d`,
            }}
          >
            {selectionStart.toString().padStart(2, "0")}:00 –{" "}
            {((selectionStart + selectionDuration) % 24)
              .toString()
              .padStart(2, "0")}
            :00
          </span>
        </div>

        {/* Left handle */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-6 rounded-full pointer-events-auto cursor-col-resize opacity-0 group-hover:opacity-100 hover:!opacity-100 bg-accent" />

        {/* Right handle (resize) */}
        <div
          className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-6 rounded-full pointer-events-auto cursor-col-resize hover:scale-110 bg-accent ${
            dragging === "resize-end" ? "scale-110" : ""
          }`}
          onMouseDown={(e) => handleMouseDown(e, "resize-end")}
        />
      </div>
    </div>
  );
}
