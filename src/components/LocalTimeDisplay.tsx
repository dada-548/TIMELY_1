import { useState, useEffect } from "react";
import { useClock } from "@/hooks/useClock";
import {
  formatTime,
  formatDate,
  getLocalTimezone,
  getLocalCityName,
} from "@/utils/timezone";
import { Timer, ChevronDown, ChevronUp } from "lucide-react";
import { useWorldClock } from "@/hooks/useWorldClock";

export function LocalTimeDisplay() {
  const now = useClock();
  const tz = getLocalTimezone();
  const info = getLocalCityName();
  const [showOtherCities, setShowOtherCities] = useState(false);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [geoError, setGeoError] = useState(false);
  const { highlightColor, use24h } = useWorldClock();

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
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6 overflow-hidden">
      <div className="flex items-center gap-2 text-foreground text-sm font-bold mb-2">
        <Timer className="h-4 w-4" style={{ color: highlightColor }} />
        <span>MY TIME</span>
      </div>
      <p className="text-sm sm:text-base text-muted-foreground mb-1">
        <span className="font-bold text-foreground">{displayLocation}</span>
        {info.timezoneName && (
          <span className="text-muted-foreground"> | {info.timezoneName}</span>
        )}
      </p>
      <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 text-xl sm:text-4xl lg:text-5xl font-mono font-semibold tracking-tight text-foreground min-w-0">
        <span className="min-w-0 truncate">{formatDate(tz, now).toUpperCase()}</span>
        <span className="hidden sm:block w-px h-8 bg-border self-center shrink-0" />
        <span className="min-w-0 truncate">{formatTime(tz, now, use24h)}</span>
      </div>

      {info.otherCities.length > 0 && (
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
