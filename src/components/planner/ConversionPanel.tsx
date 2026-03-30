import { getTimezoneAbbreviation, getDiffFromLocal } from "@/utils/timezone";
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
  fromCity: City;
  otherCities: City[];
  conversions: ConversionResult[];
  selectedHour: number;
  selectedMinute: number;
  duration: number;
  now: Date;
}

export function ConversionPanel({
  fromCity,
  otherCities,
  conversions,
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

  const sourceTimeIcon =
    selectedHour >= 5 && selectedHour < 8 ? (
      <Sunrise className="h-3.5 w-3.5 text-sunriseicon" />
    ) : selectedHour >= 8 && selectedHour < 13 ? (
      <Sun className="h-3.5 w-3.5 text-dayicon" />
    ) : selectedHour >= 13 && selectedHour < 18 ? (
      <Sun className="h-3.5 w-3.5 text-dayicon" />
    ) : selectedHour >= 18 && selectedHour < 22 ? (
      <Sunset className="h-3.5 w-3.5 text-sunseticon" />
    ) : (
      <Moon className="h-3.5 w-3.5 text-nighticon" />
    );

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <ArrowLeftRight
          className="h-3.5 w-3.5"
          style={{ color: highlightColor }}
        />{" "}
        CONVERTED TIMES
      </h3>

      {/* Source */}
      <div
        className="flex items-center justify-between p-3 rounded-lg mb-2"
        style={{
          backgroundColor: `${highlightColor}0d`,
          border: `1px solid ${highlightColor}33`,
        }}
      >
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-foreground">
            {fromCity.name}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {getTimezoneAbbreviation(fromCity.timezone, now)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs flex items-center">{sourceTimeIcon}</span>
          <span className="font-mono text-sm font-semibold">
            {formatTimeRange(selectedHour, selectedMinute, duration)}
          </span>
        </div>
      </div>

      <div className="flex justify-center py-1">
        <ArrowDown className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      {/* Converted */}
      <div className="space-y-1.5">
        {conversions.map((conv, i) => {
          const city = otherCities[i];
          if (!city) return null;
          const h = conv.hour;
          const timeIcon =
            h >= 5 && h < 8 ? (
              <Sunrise className="h-3.5 w-3.5 text-sunriseicon" />
            ) : h >= 8 && h < 13 ? (
              <Sun className="h-3.5 w-3.5 text-dayicon" />
            ) : h >= 13 && h < 18 ? (
              <Sun className="h-3.5 w-3.5 text-dayicon" />
            ) : h >= 18 && h < 22 ? (
              <Sunset className="h-3.5 w-3.5 text-sunseticon" />
            ) : (
              <Moon className="h-3.5 w-3.5 text-nighticon" />
            );
          return (
            <div
              key={city.id}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-foreground">
                  {city.name}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {getTimezoneAbbreviation(city.timezone, now)}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  ({getDiffFromLocal(city.timezone, now)})
                </span>
                {conv.dayOffset !== 0 && (
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: dayIndicationColor }}
                  >
                    {conv.dayOffset > 0
                      ? `+${conv.dayOffset}d`
                      : `${conv.dayOffset}d`}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs flex items-center">{timeIcon}</span>
                <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
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
