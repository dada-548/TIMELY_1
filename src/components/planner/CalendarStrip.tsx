import { useRef, useEffect, useCallback, useState, useMemo, useLayoutEffect } from 'react';
import { format, addDays, isSameDay, startOfDay, differenceInCalendarDays } from 'date-fns';
import { CalendarDays, LocateFixed } from 'lucide-react';
import { useWorldClock } from '@/hooks/useWorldClock';

interface CalendarStripProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onJumpToNow: () => void;
  now: Date;
}

const BUFFER = 30;
const LOAD_THRESHOLD = 200;

export function CalendarStrip({ selectedDate, onSelectDate, onJumpToNow, now }: CalendarStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);
  const pendingPrependRef = useRef<{ prevScrollWidth: number; prevScrollLeft: number } | null>(null);

  const today = useMemo(() => startOfDay(now), [startOfDay(now).getTime()]);
  const { highlightColor } = useWorldClock();
  const [todayFlash, setTodayFlash] = useState(false);
  const [nowFlash, setNowFlash] = useState(false);

  const handleTodayClick = useCallback(() => {
    onSelectDate(today);
    setTodayFlash(true);
    setTimeout(() => setTodayFlash(false), 500);
  }, [onSelectDate, today]);

  const handleNowClick = useCallback(() => {
    onJumpToNow();
    setNowFlash(true);
    setTimeout(() => setNowFlash(false), 500);
  }, [onJumpToNow]);

  const initialDiff = useMemo(() => differenceInCalendarDays(startOfDay(selectedDate), today), [selectedDate, today]);
  const [startOffset, setStartOffset] = useState(() => initialDiff - 7);
  const [endOffset, setEndOffset] = useState(() => initialDiff + BUFFER);

  const selectedDiff = useMemo(
    () => differenceInCalendarDays(startOfDay(selectedDate), today),
    [selectedDate, today]
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

  // Scroll selected date into view whenever it changes (after range updates).
  useLayoutEffect(() => {
    const node = selectedRef.current;
    if (!node) return;
    node.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [selectedDate, startOffset, endOffset]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    if (el.scrollLeft < LOAD_THRESHOLD) {
      pendingPrependRef.current = { prevScrollWidth: el.scrollWidth, prevScrollLeft: el.scrollLeft };
      setStartOffset(prev => prev - BUFFER);
    }

    if (el.scrollLeft + el.clientWidth > el.scrollWidth - LOAD_THRESHOLD) {
      setEndOffset(prev => prev + BUFFER);
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  let lastMonth = -1;

  return (
    <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <button
            onClick={handleTodayClick}
            className="px-3 py-1.5 text-[11px] font-medium rounded-lg border bg-background text-foreground hover:bg-secondary flex items-center gap-1.5"
            style={{
              borderColor: todayFlash ? highlightColor : undefined,
              backgroundColor: todayFlash ? `${highlightColor}20` : undefined,
              boxShadow: todayFlash ? `0 0 8px ${highlightColor}40` : undefined,
            }}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Today
          </button>
          <button
            onClick={handleNowClick}
            className="px-3 py-1.5 text-[11px] font-medium rounded-lg border bg-card text-foreground hover:bg-secondary flex items-center gap-1.5"
            style={{
              borderColor: nowFlash ? highlightColor : undefined,
              backgroundColor: nowFlash ? `${highlightColor}20` : undefined,
              boxShadow: nowFlash ? `0 0 8px ${highlightColor}40` : undefined,
            }}
          >
            <LocateFixed className="h-3.5 w-3.5 text-muted-foreground" />
            Now
          </button>
        </div>

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
              <div key={day.toISOString()} className="flex flex-col items-center flex-shrink-0">
                {showMonthLabel && (
                  <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest mb-0.5">
                    {format(day, 'MMM')}
                  </span>
                )}
                {!showMonthLabel && <span className="text-[9px] mb-0.5 invisible">X</span>}
                <button
                  ref={isSelected ? selectedRef : undefined}
                  onClick={() => onSelectDate(day)}
                  className={`relative flex flex-col items-center px-2.5 py-1.5 rounded-xl text-center min-w-[48px] ${
                    isDayToday
                      ? 'text-foreground shadow-md scale-105 border'
                      : 'bg-background border border-border text-foreground hover:bg-secondary'
                  }`}
                  style={
                    isDayToday
                      ? { backgroundColor: `${highlightColor}26`, borderColor: `${highlightColor}54` }
                      : undefined
                  }
                >
                  <span className={`text-[9px] font-semibold uppercase tracking-wider leading-none ${
                    isDayToday ? 'text-foreground/70' : 'text-muted-foreground'
                  }`}>
                    {format(day, 'EEE')}
                  </span>
                  <span className="text-base font-bold font-mono leading-tight mt-0.5">
                    {format(day, 'd')}
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
      </div>
    </div>
  );
}
