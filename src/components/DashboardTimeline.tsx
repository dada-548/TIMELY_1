import { useState, useMemo, useCallback } from "react";
import { isSameDay, startOfDay } from "date-fns";
import { 
  ChevronDown, 
  ChevronUp, 
  Grid3X3, 
  Clock, 
  Sun, 
  MessageSquare, 
  Briefcase 
} from "lucide-react";
import { useWorldClock } from "@/hooks/useWorldClock";
import { useClock } from "@/hooks/useClock";
import { getTimeInTimezone, getOffsetMinutes } from "@/utils/timezone";
import { ScrollableTimeline } from "@/components/planner/ScrollableTimeline";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

  if (selectedCities.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="w-full flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setVisible((v) => !v)}
          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-foreground/80"
        >
          <Grid3X3 className="h-4 w-4" style={{ color: highlightColor }} />
          TIMELINE
        </button>

        <div className="flex items-center gap-3">
          {/* Timeline Modes */}
          <div className="flex items-center rounded-lg border border-border overflow-hidden bg-card">
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
                <TooltipContent>Friendly Hours (9am-9pm)</TooltipContent>
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
                <TooltipContent>Working Hours (9am-5pm)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <button
            onClick={() => setVisible((v) => !v)}
            className="p-1 text-muted-foreground hover:text-foreground"
          >
            {visible ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {visible && fromCity && (
        <div className="pb-3">
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
      )}
    </div>
  );
}
