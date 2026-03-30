import { useState } from "react";
import { Sun, Moon, Sunrise, Sunset } from "lucide-react";
import { ChevronDown, ChevronUp, MapPin, Globe, Clock } from "lucide-react";
import { useClock } from "@/hooks/useClock";
import { useWorldClock } from "@/hooks/useWorldClock";
import { CITIES, City } from "@/data/cities";
import { formatTime, getTimeOfDay } from "@/utils/timezone";
import { WorldMapSVG } from "./WorldMapSVG";

const TZ_OFFSETS = Array.from({ length: 25 }, (_, i) => i - 12);

export function WorldMapSection() {
  const [visible, setVisible] = useState(true);
  const [showAllCities, setShowAllCities] = useState(false);
  const [showTimezones, setShowTimezones] = useState(false);
  const now = useClock();
  const { selectedCities, highlightColor, use24h } = useWorldClock();
  const [hoveredCity, setHoveredCity] = useState<City | null>(null);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setVisible((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-foreground hover:bg-secondary/50 rounded-xl"
      >
        <span className="flex items-center gap-2">
          <MapPin className="h-4 w-4" style={{ color: highlightColor }} />
          WORLD MAP
        </span>
        {visible ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {visible && (
        <div className="px-2 sm:px-4 pb-4">
          {/* Toggles */}
          <div className="flex items-center justify-end gap-2 mb-2">
            <button
              onClick={() => setShowTimezones((v) => !v)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border"
              style={
                showTimezones
                  ? {
                      backgroundColor: `${highlightColor}20`,
                      borderColor: `${highlightColor}50`,
                      color: highlightColor,
                    }
                  : {
                      borderColor: "hsl(var(--border))",
                      color: "hsl(var(--muted-foreground))",
                    }
              }
            >
              <Clock className="h-3 w-3" />
              Time zones
            </button>
            <button
              onClick={() => setShowAllCities((v) => !v)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border"
              style={
                showAllCities
                  ? {
                      backgroundColor: `${highlightColor}20`,
                      borderColor: `${highlightColor}50`,
                      color: highlightColor,
                    }
                  : {
                      borderColor: "hsl(var(--border))",
                      color: "hsl(var(--muted-foreground))",
                    }
              }
            >
              <Globe className="h-3 w-3" />
              Show all cities
            </button>
          </div>

          <div className="relative rounded-lg overflow-hidden border border-border">
            <WorldMapSVG
              now={now}
              selectedCities={selectedCities}
              allCities={showAllCities ? CITIES : []}
              hoveredCity={hoveredCity}
              onHoverCity={setHoveredCity}
              highlightColor={highlightColor}
              showTimezones={showTimezones}
            />

            {/* UTC offset label bar at the bottom */}
            {showTimezones && (
              <div className="flex w-full min-w-0 overflow-hidden border-t border-border/50">
                {TZ_OFFSETS.map((offset, i) => (
                  <div
                    key={offset}
                    className="flex-1 text-center py-1 text-[7px] sm:text-[9px] font-mono font-semibold select-none truncate"
                    style={{
                      backgroundColor:
                        i % 2 === 0
                          ? `${highlightColor}25`
                          : `${highlightColor}12`,
                      color: "hsl(var(--muted-foreground))",
                    }}
                  >
                    {offset === 0 ? "GMT" : `${offset > 0 ? "+" : ""}${offset}`}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* City status bar */}
          {selectedCities.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 max-h-[120px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-border">
              {selectedCities.map((city) => {
                const tod = getTimeOfDay(city.timezone, now);
                const TodIcon =
                  tod === "day"
                    ? Sun
                    : tod === "afternoon"
                      ? Sun
                      : tod === "night"
                        ? Moon
                        : tod === "dawn"
                          ? Sunrise
                          : Sunset;
                const iconColorClass =
                  tod === "day"
                    ? "text-dayicon"
                    : tod === "afternoon"
                      ? "text-dayicon"
                      : tod === "night"
                        ? "text-nighticon"
                        : tod === "dawn"
                          ? "text-sunriseicon"
                          : "text-sunseticon";
                return (
                  <button
                    key={city.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-background text-xs hover:bg-secondary"
                    onMouseEnter={() => setHoveredCity(city)}
                    onMouseLeave={() => setHoveredCity(null)}
                  >
                    <TodIcon
                      size={13}
                      className={iconColorClass}
                      strokeWidth={1.8}
                    />
                    <span className="font-medium text-foreground">
                      {city.name}
                    </span>
                    <span className="text-muted-foreground font-mono">
                      {formatTime(city.timezone, now, use24h)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
