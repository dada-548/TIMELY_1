import { useState } from "react";
import { Sun, Moon, Sunrise, Sunset } from "lucide-react";
import { ChevronDown, ChevronUp, MapPin, Globe, CloudMoon } from "lucide-react";
import { useClock } from "@/hooks/useClock";
import { useWorldClock } from "@/hooks/useWorldClock";
import { CITIES, City } from "@/data/cities";
import { formatTime, getTimeOfDay } from "@/utils/timezone";
import { WorldMapSVG } from "./WorldMapSVG";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function WorldMapSection() {
  const [visible, setVisible] = useState(true);
  const [showAllCities, setShowAllCities] = useState(false);
  const now = useClock();
  const { selectedCities, highlightColor, use24h } = useWorldClock();
  const [hoveredCity, setHoveredCity] = useState<City | null>(null);
  const [hoveredTimezone, setHoveredTimezone] = useState<number | null>(null);
  const [showNightShade, setShowNightShade] = useState(true);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="w-full flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setVisible((v) => !v)}
          className="flex flex-col items-start hover:text-foreground/80 transition-colors"
        >
          <div className="flex items-center gap-2 text-foreground text-sm font-bold mb-1">
            <MapPin className="h-4 w-4" style={{ color: highlightColor }} />
            <span>WORLD MAP</span>
          </div>
          <span
            className="text-xs sm:text-sm font-medium mt-1 sm:mt-1.5 rounded-lg px-2 py-0.5"
            style={{
              fontFamily: "'Inter', sans-serif",
              border: "1px solid transparent",
            }}
          >
            {now.toLocaleDateString(undefined, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}{" "}
            · {now.toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
              hour12: !use24h,
            })}
          </span>
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-border overflow-hidden bg-card">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setShowNightShade((v) => !v)}
                    className={`p-1.5 transition-colors ${
                      showNightShade
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    style={
                      showNightShade
                        ? { backgroundColor: `${highlightColor}25` }
                        : undefined
                    }
                  >
                    <CloudMoon className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Night shade</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setShowAllCities((v) => !v)}
                    className={`p-1.5 transition-colors ${
                      showAllCities
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    style={
                      showAllCities
                        ? { backgroundColor: `${highlightColor}25` }
                        : undefined
                    }
                  >
                    <Globe className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Show all cities</TooltipContent>
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

      {visible && (
        <div className="px-2 sm:px-4 pb-4">
          <div className="relative rounded-lg overflow-hidden border border-border mt-2">
            <WorldMapSVG
              now={now}
              selectedCities={selectedCities}
              allCities={showAllCities ? CITIES : []}
              hoveredCity={hoveredCity}
              onHoverCity={setHoveredCity}
              highlightColor={highlightColor}
              hoveredTimezone={hoveredTimezone}
              onHoverTimezone={setHoveredTimezone}
              showNightShade={showNightShade}
            />
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
