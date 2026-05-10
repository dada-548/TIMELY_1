import { useState, useMemo, useCallback } from "react";
import { isSameDay, startOfDay } from "date-fns";
import { useWorldClock } from "@/hooks/useWorldClock";
import { useClock } from "@/hooks/useClock";
import {
  convertTime,
  getLocalTimezone,
  getOffsetMinutes,
  getTimeInTimezone,
} from "@/utils/timezone";
import { Header } from "@/components/Header";
import { CitySearch } from "@/components/CitySearch";
import { CalendarStrip } from "@/components/planner/CalendarStrip";
import { DurationSelector } from "@/components/planner/DurationSelector";
import { ScrollableTimeline } from "@/components/planner/ScrollableTimeline";
import { ConversionPanel } from "@/components/planner/ConversionPanel";
import { ShareMeetingPanel } from "@/components/planner/ShareMeetingPanel";
import {
  Clock,
  Sun,
  MessageSquare,
  Briefcase,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MeetingPlanner() {
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
    setTimelineMode,
  } = useWorldClock();
  const now = useClock();
  const localTz = getLocalTimezone();

  const [selectedMinute, setSelectedMinute] = useState(0);

  const fromCity = selectedCities[fromCityIdx] || selectedCities[0];
  const otherCities = selectedCities.filter((_, i) => i !== fromCityIdx);

  const isToday = isSameDay(selectedDate, now);
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

  const conversions = fromCity
    ? convertTime(
        fromCity.timezone,
        selectedCities.map((c) => c.timezone),
        selectedHour,
        selectedMinute,
        now,
      )
    : [];

  const handleJumpToNow = useCallback(() => {
    setSelectedDate(startOfDay(now));
    if (fromCity) {
      const localNow = getTimeInTimezone(fromCity.timezone, now);
      setSelectedHour(localNow.getHours());
    }
    setSelectedMinute(0);
  }, [fromCity, now, setSelectedDate, setSelectedHour]);

  const handleDragMove = useCallback(
    (newStart: number) => {
      setSelectedHour(newStart);
    },
    [setSelectedHour],
  );

  const handleDragEnd = useCallback(() => {
    let normalizedHour = selectedHour;
    let dateShift = 0;
    while (normalizedHour < 0) {
      normalizedHour += 24;
      dateShift--;
    }
    while (normalizedHour >= 24) {
      normalizedHour -= 24;
      dateShift++;
    }

    if (dateShift !== 0) {
      setSelectedDate((prev) => addDays(prev, dateShift));
      setSelectedHour(normalizedHour);
    }
  }, [selectedHour, setSelectedDate, setSelectedHour]);

  const handleResizeEnd = useCallback(
    (newDuration: number) => {
      setDuration(newDuration);
    },
    [setDuration],
  );

  const getDiffLabel = useCallback((offset: number) => {
    if (offset === 0) return "";
    const sign = offset > 0 ? "+" : "";
    return `${sign}${offset}h`;
  }, []);

  return (
    <div className="min-h-screen bg-background w-full">
      <Header />
      <main className="w-full max-w-[1000px] mx-auto pt-3 sm:pt-10 pb-6 space-y-4 px-6 md:px-10 lg:px-16 box-border">
        {selectedCities.length === 0 ? (
          <div className="text-center py-16">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground mb-4">
              Add cities to start planning
            </p>
            <CitySearch />
          </div>
        ) : (
          <>
            <CalendarStrip
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onJumpToNow={handleJumpToNow}
              now={now}
            />

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Time Zone:
                </span>
                <Select
                  value={String(fromCityIdx)}
                  onValueChange={(value) => setFromCityIdx(Number(value))}
                >
                  <SelectTrigger
                    className="h-8 rounded-lg px-3 text-sm w-[140px] justify-between focus:outline-none focus:ring-0 focus:ring-offset-0"
                    style={{
                      backgroundColor: `${highlightColor}15`,
                      border: `1px solid ${highlightColor}33`,
                    }}
                  >
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent className="bg-background border border-border shadow-lg rounded-lg">
                    {selectedCities.map((city, i) => (
                      <SelectItem
                        key={city.id}
                        value={String(i)}
                        className="text-foreground data-[highlighted]:bg-muted data-[highlighted]:text-foreground"
                      >
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DurationSelector
                duration={duration}
                onChangeDuration={setDuration}
              />

              <div className="flex-grow" />

              <div className="flex items-center w-full sm:w-auto">
                <CitySearch />
              </div>
            </div>

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
              onDragEnd={handleDragEnd}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {fromCity && (
                <ConversionPanel
                  selectedCities={selectedCities}
                  conversions={conversions}
                  fromCityIdx={fromCityIdx}
                  selectedHour={selectedHour}
                  selectedMinute={selectedMinute}
                  duration={duration}
                  now={now}
                />
              )}
              {fromCity && (
                <ShareMeetingPanel
                  selectedCities={selectedCities}
                  fromCity={fromCity}
                  selectedHour={selectedHour}
                  selectedMinute={selectedMinute}
                  selectedDate={selectedDate}
                  duration={duration}
                  now={now}
                />
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
