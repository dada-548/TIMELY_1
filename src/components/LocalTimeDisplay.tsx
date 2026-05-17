import { useState, useEffect } from "react";
import { useClock } from "@/hooks/useClock";
import {
  formatTime,
  formatDate,
  getLocalTimezone,
  getTimezoneAbbreviation,
  getLocalCityName,
} from "@/utils/timezone";
import { MapPin, ChevronDown, ChevronUp, Minimize2, Maximize2 } from "lucide-react";
import { useWorldClock } from "@/hooks/useWorldClock";
import { cn } from "@/lib/utils";

export function LocalTimeDisplay() {
  const now = useClock();
  const tz = getLocalTimezone();
  const info = getLocalCityName();
  const [showOtherCities, setShowOtherCities] = useState(false);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [geoError, setGeoError] = useState(false);
  const { highlightColor, use24h, isCompactView, setIsCompactView } = useWorldClock();

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`,
          );
          const data = await res.json();
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            "";
          const state = data.address?.state || "";
          const country = data.address?.country || "";
          if (city) {
            setLocationName(
              state ? `${city}, ${state}` : `${city}, ${country}`,
            );
          } else {
            setLocationName(state || country || null);
          }
        } catch {
          setGeoError(true);
        }
      },
      () => setGeoError(true),
      { timeout: 5000 },
    );
  }, []);

  const displayLocation = locationName || "My location";

  return (
    <div className={cn(
      "rounded-xl border border-border bg-card overflow-hidden transition-all duration-300",
      isCompactView ? "pt-3 px-4 pb-3 sm:p-4" : "pt-4 px-4 pb-5 sm:p-6"
    )}
    style={{ willChange: "transform", backfaceVisibility: "hidden" }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-foreground text-sm font-bold">
          <MapPin className="h-4 w-4" style={{ color: highlightColor }} />
          <span>MY TIME</span>
        </div>
        <button
          onClick={() => setIsCompactView(!isCompactView)}
          className={cn(
            "p-1.5 rounded-lg border border-border transition-colors",
            isCompactView 
              ? "text-foreground" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
          style={isCompactView ? { backgroundColor: `${highlightColor}25` } : undefined}
          title={isCompactView ? "Expand view" : "Compact view"}
        >
          {isCompactView ? (
            <Maximize2 className="h-3.5 w-3.5" />
          ) : (
            <Minimize2 className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {!isCompactView && (
        <p className="text-sm sm:text-base text-muted-foreground mb-1">
          <span className="font-bold text-foreground">{displayLocation}</span>
          {info.timezoneName && (
            <span className="text-muted-foreground"> | {getTimezoneAbbreviation(tz, now)}</span>
          )}
        </p>
      )}

      <div className={cn(
        "flex flex-row items-baseline font-mono font-semibold tracking-tight text-foreground min-w-0 whitespace-nowrap",
        isCompactView ? "gap-2 text-xl sm:text-2xl" : "gap-1.5 sm:gap-4 text-lg sm:text-4xl lg:text-5xl"
      )}>
        <span className="shrink-0">{formatTime(tz, now, use24h)}</span>
        <span className={cn(
          "text-muted-foreground/30 font-light",
          isCompactView ? "text-sm" : ""
        )}>|</span>
        <span className="shrink-0">
          {formatDate(tz, now, true).toUpperCase()}
        </span>
      </div>

      {info.otherCities.length > 0 && !isCompactView && (
        <div className="mt-3">
          <button
            onClick={() => setShowOtherCities((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <span>Other cities in this timezone</span>
            {showOtherCities ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
          {showOtherCities && (
            <p className="text-xs text-muted-foreground mt-1.5">
              {info.otherCities.join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
