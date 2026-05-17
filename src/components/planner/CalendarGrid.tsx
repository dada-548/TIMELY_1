import React, { useMemo, useRef, useState, useCallback, useEffect, useLayoutEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { useWorldClock } from "@/hooks/useWorldClock";
import { motion } from "motion/react";

interface CalendarGridProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  now: Date;
  todayFlash?: boolean;
  viewDate: Date;
  setViewDate: (date: Date) => void;
}

export function CalendarGrid({
  selectedDate,
  onSelectDate,
  now,
  todayFlash,
  viewDate,
  setViewDate,
}: CalendarGridProps) {
  const { highlightColor } = useWorldClock();
  
  // We manage a list of months to render. 
  const [monthsToRender, setMonthsToRender] = useState<Date[]>(() => {
    return [startOfMonth(viewDate)];
  });

  const isInteractingRef = useRef(false);
  const isProgrammaticScrollRef = useRef(false);
  const interactionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number>(0);

  // Helper to get all days in a month grid (including padding from startOfWeek/endOfWeek)
  const getDaysInMonth = useCallback((mDate: Date) => {
    const start = startOfWeek(startOfMonth(mDate));
    const end = endOfWeek(endOfMonth(mDate));
    return eachDayOfInterval({ start, end });
  }, []);

  // Stabilize scroll when prepending months
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    
    if (prevScrollHeightRef.current > 0 && monthsToRender.length > 0) {
      const heightDiff = el.scrollHeight - prevScrollHeightRef.current;
      // Prepend check: if we added a month at the start, previous scroll height was smaller
      if (heightDiff > 0 && el.scrollTop < 10) {
        el.scrollTop = heightDiff;
      }
    }
    prevScrollHeightRef.current = el.scrollHeight;
  }, [monthsToRender]);

  useEffect(() => {
    return () => {
      if (interactionTimerRef.current) clearTimeout(interactionTimerRef.current);
    };
  }, []);

  // Sync scroll position when viewDate changes from outside (header buttons)
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const start = startOfMonth(viewDate);
    
    // Check if the month is already in our list
    const existingIdx = monthsToRender.findIndex(m => isSameMonth(m, start));
    
    if (existingIdx !== -1) {
      const targetId = start.toISOString();
      const targetEl = el.querySelector(`[data-month="${targetId}"]`) as HTMLElement;
      if (targetEl && !isInteractingRef.current) {
        const top = targetEl.offsetTop;
        if (Math.abs(el.scrollTop - top) > 5) {
          isProgrammaticScrollRef.current = true;
          el.scrollTo({ 
            top,
            behavior: "smooth"
          });
          const timer = setTimeout(() => {
            isProgrammaticScrollRef.current = false;
          }, 800); 
          return () => clearTimeout(timer);
        }
      }
    } else {
      // If month not in current list (jumped via header), reset list
      setMonthsToRender([start]);
      el.scrollTop = 0;
    }
  }, [viewDate, monthsToRender]);

  // Infinite scroll logic: append/prepend months as we scroll
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    // Set interacting flag
    if (!isProgrammaticScrollRef.current) {
      isInteractingRef.current = true;
      if (interactionTimerRef.current) clearTimeout(interactionTimerRef.current);
      interactionTimerRef.current = setTimeout(() => {
        isInteractingRef.current = false;
      }, 150);
    }

    const scrollTop = el.scrollTop;
    const scrollHeight = el.scrollHeight;
    const clientHeight = el.clientHeight;

    // Load more at bottom
    if (scrollTop + clientHeight > scrollHeight - 300) {
      setMonthsToRender((prev) => {
        const last = prev[prev.length - 1];
        const next = addMonths(last, 1);
        if (prev.some(m => isSameMonth(m, next))) return prev;
        return [...prev, next];
      });
    }

    // Load more at top (prepend)
    if (scrollTop < 300) {
      setMonthsToRender((prev) => {
        const first = prev[0];
        const prevMonth = subMonths(first, 1);
        if (prev.some(m => isSameMonth(m, prevMonth))) return prev;
        return [prevMonth, ...prev];
      });
    }
  }, []);

  // Update viewDate in parent when a month section becomes visible
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Only update viewDate when user is scrolling manually
        if (!isInteractingRef.current || isProgrammaticScrollRef.current) return;

        // Find match that is most prominent in the top 20% of the viewport
        const visible = entries.filter(e => e.isIntersecting && e.intersectionRatio > 0);
        if (visible.length === 0) return;

        // Best match: the one that covers the top of the container
        const bestMatch = visible.reduce((prev, curr) => {
          return (curr.intersectionRatio > prev.intersectionRatio) ? curr : prev;
        });

        const dateStr = bestMatch.target.getAttribute("data-month");
        if (dateStr) {
          const date = new Date(dateStr);
          if (!isSameMonth(date, viewDate)) {
            setViewDate(date);
          }
        }
      },
      {
        root: el,
        threshold: [0, 0.1, 0.2, 0.5, 0.8, 1],
        rootMargin: "-2px 0px -80% 0px" // Focus on the very top slice
      }
    );

    const sections = el.querySelectorAll(".month-section");
    sections.forEach((s) => observer.observe(s));

    return () => observer.disconnect();
  }, [monthsToRender, viewDate, setViewDate]);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col space-y-4"
    >
      {/* Weekday Labels (Sticky) */}
      <div className="grid grid-cols-7 gap-1 sticky top-0 bg-card/95 backdrop-blur-sm z-10 pb-2">
        {weekDays.map((day, idx) => {
          const isWeekend = idx === 0 || idx === 6;
          return (
            <div
              key={day}
              className={`text-[10px] font-bold text-center py-1 uppercase tracking-wider rounded-md ${
                isWeekend ? "" : "text-muted-foreground"
              }`}
              style={
                isWeekend 
                  ? { color: `${highlightColor}cc` } // 80% opacity text (brighter)
                  : undefined
              }
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Days Grid - Multi-month scrollable area */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="max-h-[320px] overflow-y-auto pr-1 -mr-1 scrollbar-hide space-y-6 relative"
      >
        {monthsToRender.map((mDate) => {
          const monthDays = getDaysInMonth(mDate);
          
          return (
            <div key={mDate.toISOString()} className="space-y-3 month-section" data-month={mDate.toISOString()}>
              <div className="grid grid-cols-7 gap-1">
                {monthDays.map((day, dayIdx) => {
                  const isSelected = isSameDay(day, selectedDate);
                  const isToday = isSameDay(day, now);
                  const isCurrentMonth = isSameMonth(day, mDate);
                  const colIdx = dayIdx % 7;
                  const isWeekend = colIdx === 0 || colIdx === 6;

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => onSelectDate(day)}
                      className={`
                        relative h-10 sm:h-12 flex flex-col items-center justify-center rounded-lg transition-all
                        ${!isCurrentMonth ? "opacity-0 pointer-events-none" : "opacity-100"}
                        ${isSelected ? "" : "border border-border/50 bg-background/50 hover:bg-secondary"}
                        ${isToday ? "shadow-sm" : ""}
                      `}
                      style={{
                        borderColor: isSelected 
                          ? highlightColor 
                          : isToday 
                            ? "transparent" 
                            : undefined,
                        backgroundColor: isToday 
                          ? `${highlightColor}26` 
                          : undefined,
                      }}
                    >
                      <span 
                        className={`text-xs font-mono font-bold transition-colors ${
                          isSelected || isToday ? "text-foreground" : "text-foreground/80"
                        }`}
                        style={
                          isWeekend && isCurrentMonth && !isSelected && !isToday 
                            ? { color: `${highlightColor}cc` } // 80% opacity text (brighter)
                            : undefined
                        }
                      >
                        {format(day, "d")}
                      </span>
                      {isSelected && (
                        <div 
                          className="absolute inset-0 rounded-lg pointer-events-none"
                          style={{ border: `1.5px solid ${highlightColor}` }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        <div className="h-4" /> {/* Spacer at bottom */}
      </div>
    </motion.div>
  );
}
