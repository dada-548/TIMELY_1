import {
  useRef,
  useEffect,
  useCallback,
  useState,
  useMemo,
  useLayoutEffect,
} from "react";
import {
  format,
  addDays,
  isSameDay,
  startOfDay,
  differenceInCalendarMonths,
  differenceInCalendarDays,
  addMonths,
  subMonths,
  startOfMonth,
  isSameMonth,
} from "date-fns";
import { ChevronLeft, ChevronRight, CalendarCheck, CalendarDays, LayoutGrid } from "lucide-react";
import { useWorldClock } from "@/hooks/useWorldClock";
import { CalendarGrid } from "./CalendarGrid";
import { motion, AnimatePresence } from "motion/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CalendarStripProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onJumpToNow: () => void;
  now: Date;
}

const BUFFER = 30;
const LOAD_THRESHOLD = 200;

export function CalendarStrip({
  selectedDate,
  onSelectDate,
  onJumpToNow,
  now,
}: CalendarStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);
  const pendingPrependRef = useRef<{
    prevScrollWidth: number;
    prevScrollLeft: number;
  } | null>(null);

  const nowTime = now.getTime();
  const today = useMemo(() => startOfDay(new Date(nowTime)), [nowTime]);
  const { highlightColor, timeBarMode, setTimeBarMode } = useWorldClock();
  const [todayFlash, setTodayFlash] = useState(false);
  const [monthFlash, setMonthFlash] = useState(false);
  
  // Lift viewDate for Grid mode to synchronize with header navigation
  const [viewDate, setViewDate] = useState(() => startOfMonth(selectedDate));

  const [forceCenterDate, setForceCenterDate] = useState<string | null>(null);
  
  // Sync viewDate when selectedDate changes to a different month (useful when switching modes)
  const lastSelectedMonthRef = useRef(startOfMonth(selectedDate).toISOString());
  useEffect(() => {
    const currentMonthStr = startOfMonth(selectedDate).toISOString();
    if (currentMonthStr !== lastSelectedMonthRef.current) {
      setViewDate(new Date(currentMonthStr));
      lastSelectedMonthRef.current = currentMonthStr;
    }
  }, [selectedDate, setViewDate]);

  useEffect(() => {
    setMonthFlash(true);
    const timer = setTimeout(() => setMonthFlash(false), 500);
    return () => clearTimeout(timer);
  }, [viewDate]);

  const handleTodayClick = useCallback(() => {
    if (onJumpToNow) {
      onJumpToNow();
    } else {
      onSelectDate(today);
    }
    setViewDate(startOfMonth(today));
    setTodayFlash(true);
    if (timeBarMode === "strip") {
      setForceCenterDate(today.toISOString());
    }
    setTimeout(() => setTodayFlash(false), 500);
  }, [onSelectDate, onJumpToNow, today, timeBarMode]);

  const handlePrevMonth = useCallback(() => {
    onSelectDate(subMonths(selectedDate, 1));
  }, [selectedDate, onSelectDate]);

  const handleNextMonth = useCallback(() => {
    onSelectDate(addMonths(selectedDate, 1));
  }, [selectedDate, onSelectDate]);

  const initialDiff = useMemo(
    () => differenceInCalendarDays(startOfDay(selectedDate), today),
    [selectedDate, today],
  );
  const [startOffset, setStartOffset] = useState(() => initialDiff - 7);
  const [endOffset, setEndOffset] = useState(() => initialDiff + BUFFER);

  const selectedDiff = useMemo(
    () => differenceInCalendarDays(startOfDay(selectedDate), today),
    [selectedDate, today],
  );

  // Keep the selected date comfortably inside the rendered range (avoid setState during render).
  useLayoutEffect(() => {
    if (selectedDiff < startOffset + 3 || selectedDiff > endOffset - 3) {
      setStartOffset(selectedDiff - BUFFER);
      setEndOffset(selectedDiff + BUFFER);
    }
  }, [selectedDiff, startOffset, endOffset]);

  // If we prepend days, restore scroll position after the DOM updates.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    const pending = pendingPrependRef.current;
    if (!el || !pending) return;

    const delta = el.scrollWidth - pending.prevScrollWidth;
    el.scrollLeft = pending.prevScrollLeft + delta;
    pendingPrependRef.current = null;
  }, [startOffset]);

  const days = useMemo(() => {
    const arr = [];
    for (let i = startOffset; i <= endOffset; i++) {
      arr.push(addDays(today, i));
    }
    return arr;
  }, [startOffset, endOffset, today]);

  const lastCenteringDate = useRef<string>("");
  const isFirstStripRender = useRef(true);

  // Scroll selected date into view whenever it changes (after range updates).
  useLayoutEffect(() => {
    if (timeBarMode !== "strip") {
      isFirstStripRender.current = true;
      return;
    }

    const node = selectedRef.current;
    const dateKey = selectedDate.toISOString();
    const shouldCenter =
      lastCenteringDate.current !== dateKey ||
      forceCenterDate === dateKey ||
      isFirstStripRender.current;

    if (shouldCenter) {
      const doScroll = (behaviorOverride?: ScrollBehavior) => {
        const node = selectedRef.current;
        if (node) {
          node.scrollIntoView({
            behavior: behaviorOverride || (isFirstStripRender.current ? "auto" : "smooth"),
            inline: "center",
            block: "nearest",
          });
          return true;
        }
        return false;
      };

      // Immediate attempt
      const success = doScroll();

      // For mode switch or first render, retry multiple times to overcome animation delays
      const t1 = setTimeout(() => doScroll(isFirstStripRender.current ? "auto" : "smooth"), 50);
      const t2 = setTimeout(() => doScroll("auto"), 200);
      const t3 = setTimeout(() => doScroll("auto"), 500);
      const t4 = setTimeout(() => doScroll("auto"), 1000);
      
      if (isFirstStripRender.current) {
        isFirstStripRender.current = false;
      }

      if (success) {
        lastCenteringDate.current = dateKey;
        if (forceCenterDate === dateKey) {
          setForceCenterDate(null);
        }
      }

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    }
  }, [selectedDate, startOffset, endOffset, forceCenterDate, timeBarMode]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    if (el.scrollLeft < LOAD_THRESHOLD) {
      pendingPrependRef.current = {
        prevScrollWidth: el.scrollWidth,
        prevScrollLeft: el.scrollLeft,
      };
      setStartOffset((prev) => prev - BUFFER);
    }

    if (el.scrollLeft + el.clientWidth > el.scrollWidth - LOAD_THRESHOLD) {
      setEndOffset((prev) => prev + BUFFER);
    }

    // Sync viewDate (Month Header) when scrolling the strip
    if (timeBarMode === "strip") {
      const dayWidth = 52; // roughly 48px + 4px gap
      const index = Math.floor((el.scrollLeft + el.clientWidth / 2) / dayWidth);
      const visibleDay = days[Math.min(Math.max(0, index), days.length - 1)];
      if (visibleDay && !isSameMonth(visibleDay, viewDate)) {
        setViewDate(startOfMonth(visibleDay));
      }
    }
  }, [days, timeBarMode, viewDate, setViewDate]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  let lastMonth = -1;

  return (
    <div className="rounded-xl border border-border bg-card pt-4 px-5 pb-5 sm:p-6 space-y-4 transition-all duration-300">
      {/* Header */}
      <div className="w-full flex sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-0 mb-4 px-0.5 sm:px-0">
        <div className="flex flex-col items-start text-left">
          <div className="flex items-center gap-2 text-foreground text-sm font-bold">
            <CalendarDays
              className="h-4 w-4"
              style={{ color: highlightColor }}
            />
            <span>TIME BAR</span>
          </div>
          <span
            className="text-xs sm:text-sm font-medium mt-1.5 rounded-lg py-0.5 whitespace-nowrap px-2 -ml-2 transition-all duration-300"
            style={{
              fontFamily: "'Inter', sans-serif",
              color: (todayFlash || monthFlash) ? highlightColor : undefined,
              backgroundColor: (todayFlash || monthFlash) ? `${highlightColor}26` : undefined,
              border: (todayFlash || monthFlash)
                ? `1px solid ${highlightColor}54`
                : "1px solid transparent",
            }}
          >
            {timeBarMode === "grid"
              ? format(viewDate, "MMMM yyyy")
              : format(selectedDate, "EEEE, MMMM d, yyyy")}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 ml-auto sm:ml-0 justify-end">
          <div className="flex items-center rounded-lg border border-border overflow-hidden bg-card mr-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      const diff = differenceInCalendarMonths(viewDate, selectedDate);
                      if (diff !== 0) {
                        onSelectDate(addMonths(selectedDate, diff));
                      }
                      setTimeBarMode("strip");
                    }}
                    className={`p-1.5 transition-colors border-r border-border ${
                      timeBarMode === "strip"
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    style={
                      timeBarMode === "strip"
                        ? { backgroundColor: `${highlightColor}25` }
                        : undefined
                    }
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Strip View</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      setViewDate(startOfMonth(selectedDate));
                      setTimeBarMode("grid");
                    }}
                    className={`p-1.5 transition-colors ${
                      timeBarMode === "grid"
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    style={
                      timeBarMode === "grid"
                        ? { backgroundColor: `${highlightColor}25` }
                        : undefined
                    }
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Calendar View</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex items-center gap-1.5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handlePrevMonth}
                    className="p-1 rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {timeBarMode === "grid" ? "Previous Month" : "Previous Day"}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleTodayClick}
                    className="p-1 rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                    style={{
                      borderColor: todayFlash ? highlightColor : undefined,
                      backgroundColor: todayFlash
                        ? `${highlightColor}20`
                        : undefined,
                      boxShadow: todayFlash
                        ? `0 0 8px ${highlightColor}40`
                        : undefined,
                    }}
                  >
                    <CalendarCheck className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Today</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleNextMonth}
                    className="p-1 rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {timeBarMode === "grid" ? "Next Month" : "Next Day"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

        <AnimatePresence mode="wait">
          {timeBarMode === "grid" ? (
            <CalendarGrid
              key="grid"
              selectedDate={selectedDate}
              onSelectDate={onSelectDate}
              now={now}
              todayFlash={todayFlash}
              viewDate={viewDate}
              setViewDate={setViewDate}
            />
          ) : (
            <motion.div
              key="strip"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center gap-3"
            >
              <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex gap-1 overflow-x-auto scrollbar-hide py-0.5 flex-1"
              >
                {days.map((day) => {
                  const isDayToday = isSameDay(day, today);
                  const isSelected = isSameDay(day, selectedDate);
                  const month = day.getMonth();
                  const showMonthLabel = month !== lastMonth;
                  lastMonth = month;

                  return (
                    <div
                      key={day.toISOString()}
                      className="flex flex-col items-center flex-shrink-0"
                    >
                      {showMonthLabel && (
                        <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest mb-0.5">
                          {format(day, "MMM")}
                        </span>
                      )}
                      {!showMonthLabel && (
                        <span className="text-[9px] mb-0.5 invisible">X</span>
                      )}
                      <button
                        ref={isSelected ? selectedRef : undefined}
                        onClick={() => onSelectDate(day)}
                        className={`relative flex flex-col items-center px-2.5 py-1.5 rounded-xl text-center min-w-[48px] ${
                          isDayToday
                            ? "text-foreground shadow-md scale-105 border"
                            : "bg-background border border-border text-foreground hover:bg-secondary"
                        }`}
                        style={
                          isDayToday
                            ? {
                                backgroundColor: `${highlightColor}26`,
                                borderColor: `${highlightColor}54`,
                              }
                            : undefined
                        }
                      >
                        <span
                          className={`text-[9px] font-semibold uppercase tracking-wider leading-none ${
                            isDayToday
                              ? "text-foreground/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {format(day, "EEE")}
                        </span>
                        <span className="text-base font-bold font-mono leading-tight mt-0.5">
                          {format(day, "d")}
                        </span>
                        {isSelected && (
                          <div
                            className="absolute inset-0 rounded-xl pointer-events-none"
                            style={{ border: `2px solid ${highlightColor}` }}
                          />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
}
