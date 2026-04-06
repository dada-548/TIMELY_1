import { useState, useMemo, useCallback } from "react";
import { isSameDay, startOfDay } from "date-fns";
import { 
  ChevronDown, 
  ChevronUp, 
  Grid3X3
} from "lucide-react";
import { useWorldClock } from "@/hooks/useWorldClock";
import { useClock } from "@/hooks/useClock";
import { getTimeInTimezone, getOffsetMinutes } from "@/utils/timezone";
import { ScrollableTimeline } from "@/components/planner/ScrollableTimeline";

export function DashboardTimeline() {
  const { 
    selectedCities, 
    highlightColor, 
    selectedDate, 
    setSelectedDate, 
    selectedHour, 
    setSelectedHour, 
    duration, 
    setDuration,
    fromCityIdx,
    setFromCityIdx,
    timelineMode,
    setTimelineMode
  } = useWorldClock();
  const now = useClock();

  const [visible, setVisible] = useState(true);
  const [selectedMinute] = useState(0);

  const fromCity = selectedCities[fromCityIdx] || selectedCities[0];

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

  if (selectedCities.length === 0 || !fromCity) return null;

  return (
    <div className="min-w-0">
      <ScrollableTimeline
        selectedCities={selectedCities}
        fromCityIdx={fromCityIdx}
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
        maxHeight="300px"
      />
    </div>
  );
}
