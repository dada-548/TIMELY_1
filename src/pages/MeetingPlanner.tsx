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
import { Clock, LayoutGrid } from "lucide-react";
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
    setFromCityIdx
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

  const orderedCities = useMemo(() => {
    if (!fromCity) return selectedCities;
    const others = selectedCities.filter((_, i) => i !== fromCityIdx);
    return [fromCity, ...others];
  }, [selectedCities, fromCity, fromCityIdx]);

  const cityOffsets = useMemo(() => {
    if (!fromCity) return [];
    return orderedCities.map((city) => {
      const diff =
        getOffsetMinutes(city.timezone, now) -
        getOffsetMinutes(fromCity.timezone, now);
      return Math.round(diff / 60);
    });
  }, [orderedCities, fromCity, now]);

  const conversions = fromCity
    ? convertTime(
        fromCity.timezone,
        otherCities.map((c) => c.timezone),
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
  }, [fromCity, now]);

  const handleDragMove = useCallback((newStart: number) => {
    setSelectedHour(newStart);
  }, []);

  const handleResizeEnd = useCallback((newDuration: number) => {
    setDuration(newDuration);
  }, []);

  const getDiffLabel = useCallback((offset: number) => {
    if (offset === 0) return "";
    const sign = offset > 0 ? "+" : "";
    return `${sign}${offset}h`;
  }, []);

  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      <Header />
      <main className="w-full max-w-5xl mx-auto py-6 space-y-4 px-4 sm:px-6 lg:px-8 box-border overflow-hidden">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <LayoutGrid className="h-6 w-6" style={{ color: highlightColor }} />
            TIMELINE
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Find the perfect meeting time across time zones.
          </p>
        </div>

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
              selectedCities={orderedCities}
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {fromCity && (
                <ConversionPanel
                  fromCity={fromCity}
                  otherCities={otherCities}
                  conversions={conversions}
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
