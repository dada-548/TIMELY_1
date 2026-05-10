import { getTimezoneAbbreviation, getUTCOffset, getOffsetMinutes } from "@/utils/timezone";
import { cn } from "@/lib/utils";
import {
  ArrowDown,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  ArrowLeftRight,
} from "lucide-react";
import { useWorldClock } from "@/hooks/useWorldClock";
import type { City } from "@/data/cities";

interface ConversionResult {
  timezone: string;
  hour: number;
  minute: number;
  dayOffset: number;
}

interface ConversionPanelProps {
  selectedCities: City[];
  conversions: ConversionResult[];
  fromCityIdx: number;
  selectedHour: number;
  selectedMinute: number;
  duration: number;
  now: Date;
}

export function ConversionPanel({
  selectedCities,
  conversions,
  fromCityIdx,
  selectedHour,
  selectedMinute,
  duration,
  now,
}: ConversionPanelProps) {
  const { highlightColor, dayIndicationColor, use24h } = useWorldClock();

  const formatTimeRange = (h: number, m: number, dur: number) => {
    const formatSingleTime = (hour: number, minute: number) => {
      if (use24h) {
        return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      }
      const displayH = hour % 12 || 12;
      const ampm = hour >= 12 ? "PM" : "AM";
      return `${displayH}:${minute.toString().padStart(2, "0")} ${ampm}`;
    };

    const startStr = formatSingleTime(h, m);
    const endMinutes = h * 60 + m + dur * 60;
    const endH = Math.floor(endMinutes / 60) % 24;
    const endM = endMinutes % 60;
    const endStr = formatSingleTime(endH, endM);
    return `${startStr} – ${endStr}`;
  };

  const getSourceOffset = () => {
    const fromCity = selectedCities[fromCityIdx];
    return fromCity ? getOffsetMinutes(fromCity.timezone, now) : 0;
  };

  const fromOffset = getSourceOffset();

  return (
    <div className="rounded-xl border border-border bg-card pt-4 px-5 pb-5 sm:p-6">
      <div className="flex flex-col items-start mb-3 sm:mb-4">
        <div className="flex items-center gap-2 text-foreground text-sm font-bold">
          <ArrowLeftRight
            className="h-4 w-4"
            style={{ color: highlightColor }}
          />
          <span>CONVERTED TIMES</span>
        </div>
      </div>

      {/* Converted */}
      <div className="space-y-1.5">
        {selectedCities.map((city, i) => {
          const conv = conversions[i];
          if (!conv) return null;
          const h = conv.hour;
          const timeIcon =
            h >= 5 && h < 8 ? (
              <Sunrise className="h-3.5 w-3.5 text-sunriseicon" />
            ) : h >= 8 && h < 13 ? (
              <Sun className="h-3.5 w-3.5 text-dayicon" />
            ) : h >= 13 && h < 19 ? (
              <Sun className="h-3.5 w-3.5 text-dayicon" />
            ) : h >= 19 && h < 22 ? (
              <Sunset className="h-3.5 w-3.5 text-sunseticon" />
            ) : (
              <Moon className="h-3.5 w-3.5 text-nighticon" />
            );

          const toOffset = getOffsetMinutes(city.timezone, now);
          const diffHours = Math.round((toOffset - fromOffset) / 60);
          const diffLabel = diffHours === 0 ? "" : `(${diffHours > 0 ? "+" : ""}${diffHours}h)`;
          const isTop = i === 0;

          return (
            <div
              key={city.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg transition-all",
                isTop 
                  ? "border-2 shadow-sm"
                  : "bg-secondary/50 border border-transparent"
              )}
              style={isTop ? { 
                backgroundColor: `${highlightColor}15`, 
                borderColor: `${highlightColor}40` 
              } : undefined}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                <span className={cn(
                  "font-medium text-sm",
                  isTop ? "text-foreground" : "text-foreground/90"
                )}>
                  {city.name}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {getTimezoneAbbreviation(city.timezone, now)}
                  </span>
                  {(diffLabel || conv.dayOffset !== 0) && (
                    <span className="text-[10px] text-muted-foreground">
                      {diffLabel}
                      {conv.dayOffset !== 0 && (
                        <span 
                          className="ml-1 font-bold"
                          style={{ color: dayIndicationColor }}
                        >
                          {conv.dayOffset > 0 ? "+" : ""}{conv.dayOffset}d
                        </span>
                      )}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs flex items-center">{timeIcon}</span>
                <span className={cn(
                  "font-mono text-sm font-semibold tabular-nums",
                  isTop ? "text-foreground" : "text-foreground/90"
                )}
                style={isTop ? { color: highlightColor } : undefined}
                >
                  {formatTimeRange(conv.hour, conv.minute, duration)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
