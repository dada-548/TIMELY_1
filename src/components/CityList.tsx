import React, { useState } from "react";
import { City } from "@/data/cities";
import { useClock } from "@/hooks/useClock";
import {
  formatTime,
  formatDate,
  getUTCOffset,
  getDiffFromLocal,
  getTimeOfDay,
  isDSTActive,
  observesDST,
  getTimezoneAbbreviation,
} from "@/utils/timezone";
import { useWorldClock } from "@/hooks/useWorldClock";
import { X, GripVertical, Sun, Moon, Sunrise, Sunset } from "lucide-react";
import {
  motion,
  AnimatePresence,
  Reorder,
  useDragControls,
} from "framer-motion";

function TimeOfDayIcon({ tod }: { tod: string }) {
  switch (tod) {
    case "day":
      return <Sun className="h-4 w-4 text-dayicon" />;
    case "afternoon":
      return <Sun className="h-4 w-4 text-dayicon" />;
    case "night":
      return <Moon className="h-4 w-4 text-nighticon" />;
    case "dawn":
      return <Sunrise className="h-4 w-4 text-sunriseicon" />;
    case "dusk":
      return <Sunset className="h-4 w-4 text-sunseticon" />;
    default:
      return null;
  }
}

function CityCard({ city }: { city: City; key?: React.Key }) {
  const now = useClock();
  const { removeCity } = useWorldClock();
  const [expanded, setExpanded] = useState(false);
  const dragControls = useDragControls();
  const tod = getTimeOfDay(city.timezone, now);
  const isNight = tod === "night";
  const { highlightColor } = useWorldClock();

  return (
    <Reorder.Item
      value={city}
      dragListener={false}
      dragControls={dragControls}
      className={`group rounded-xl border border-border p-3 sm:p-4 ${
        isNight ? "bg-night/30" : "bg-card"
      }`}
      whileDrag={{ scale: 1.02, boxShadow: "0 8px 30px -10px rgba(0,0,0,0.3)" }}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onPointerDown={(e) => dragControls.start(e)}
          className="h-6 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 sm:flex hidden cursor-grab active:cursor-grabbing flex-shrink-0"
          style={{ touchAction: "none" }}
          aria-label={`Reorder ${city.name}`}
        >
          <GripVertical className="h-4 w-4" style={{ color: highlightColor }} />
        </button>
        <button
          type="button"
          onPointerDown={(e) => dragControls.start(e)}
          className="h-5 w-5 flex items-center justify-center sm:hidden flex-shrink-0 cursor-grab active:cursor-grabbing"
          style={{ touchAction: "none" }}
          aria-label={`Reorder ${city.name}`}
        >
          <GripVertical
            className="h-3.5 w-3.5"
            style={{ color: highlightColor }}
          />
        </button>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 text-left min-w-0"
        >
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="min-w-0">
              <div className="sm:flex sm:items-baseline sm:gap-2 sm:flex-nowrap">
                <span className="font-semibold text-foreground whitespace-nowrap text-sm sm:text-base">
                  {city.name}
                </span>
                <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap block sm:inline">
                  {city.country}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] sm:text-xs text-muted-foreground">
                  {getDiffFromLocal(city.timezone, now)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <TimeOfDayIcon tod={tod} />
              <span className="text-lg sm:text-2xl font-mono font-semibold tabular-nums text-foreground">
                {formatTime(city.timezone, now)}
              </span>
            </div>
          </div>
        </button>
        <button
          onClick={() => removeCity(city.id)}
          className="text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive flex-shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm pl-8">
              <div>
                <span className="text-muted-foreground text-xs">Date</span>
                <p className="text-foreground font-medium">
                  {formatDate(city.timezone, now)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">
                  UTC Offset
                </span>
                <p className="text-foreground font-medium">
                  {getUTCOffset(city.timezone, now)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">
                  Abbreviation
                </span>
                <p className="text-foreground font-medium">
                  {getTimezoneAbbreviation(city.timezone, now)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">DST</span>
                <p className="text-foreground font-medium">
                  {observesDST(city.timezone)
                    ? isDSTActive(city.timezone)
                      ? "☀️ Active"
                      : "❄️ Inactive"
                    : "Not observed"}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Reorder.Item>
  );
}

export function CityList() {
  const { selectedCities, reorderCities } = useWorldClock();

  if (selectedCities.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">No cities added yet</p>
        <p className="text-sm mt-1">Search and add cities above</p>
      </div>
    );
  }

  return (
    <Reorder.Group
      axis="y"
      values={selectedCities}
      onReorder={reorderCities}
      className="space-y-2"
    >
      {selectedCities.map((city) => (
        <CityCard key={city.id} city={city} />
      ))}
    </Reorder.Group>
  );
}
