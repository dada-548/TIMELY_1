import { useState, useMemo, useCallback } from "react";
import { isSameDay, startOfDay } from "date-fns";
import { ChevronDown, ChevronUp, Grid3X3 } from "lucide-react";
import { useWorldClock } from "@/hooks/useWorldClock";
import { useClock } from "@/hooks/useClock";
import { getTimeInTimezone, getOffsetMinutes } from "@/utils/timezone";
import { ScrollableTimeline } from "@/components/planner/ScrollableTimeline";

export function DashboardTimeline() {
  const { selectedCities, highlightColor } = useWorldClock();
  const now = useClock();

  const [visible, setVisible] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(
    startOfDay(new Date()),
  );
  const [selectedHour, setSelectedHour] = useState(() => new Date().getHours());
  const [selectedMinute] = useState(0);
  const [duration, setDuration] = useState(1);

  const fromCity = selectedCities[0];

  const isToday = isSameDay(selectedDate, new Date());
  const currentHourInBase =
    isToday && fromCity
      ? getTimeInTimezone(fromCity.timezone, now).getHours()
      : null;

  const cityOffsets = useMemo(() => {
    if (!fromCity) return [];
    return selectedCities.map((city) => {
      const diff =
        getOffsetMinutes(city.timezone, now) -
        getOffsetMinutes(fromCity.timezone, now);
      return Math.round(diff / 60);
    });
  }, [selectedCities, fromCity, now]);

  const getDiffLabel = useCallback((offset: number) => {
    if (offset === 0) return "";
    const sign = offset > 0 ? "+" : "";
    return `${sign}${offset}h`;
  }, []);

  const handleDragMove = useCallback((newStart: number) => {
    setSelectedHour(newStart);
  }, []);

  const handleResizeEnd = useCallback((newDuration: number) => {
    setDuration(newDuration);
  }, []);

  if (selectedCities.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        onClick={() => setVisible((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-foreground hover:bg-secondary/50 rounded-xl"
      >
        <span className="flex items-center gap-2">
          <Grid3X3 className="h-4 w-4" style={{ color: highlightColor }} />
          TIMELINE
        </span>
        {visible ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {visible && fromCity && (
        <div className="px-1 pb-3">
          <ScrollableTimeline
            selectedCities={selectedCities}
            fromCityIdx={0}
            fromCity={fromCity}
            cityOffsets={cityOffsets}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            selectedHour={selectedHour}
            onSelectHour={setSelectedHour}
            selectedMinute={selectedMinute}
            duration={duration}
            currentHourInBase={currentHourInBase}
            now={now}
            getDiffLabel={getDiffLabel}
            onDragMove={handleDragMove}
            onResizeEnd={handleResizeEnd}
          />
        </div>
      )}
    </div>
  );
}
