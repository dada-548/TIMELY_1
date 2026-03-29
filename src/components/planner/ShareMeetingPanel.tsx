import { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";
import { useWorldClock } from "@/hooks/useWorldClock";
import { convertTime } from "@/utils/timezone";
import { format } from "date-fns";
import type { City } from "@/data/cities";

const COUNTRY_FLAGS: Record<string, string> = {
  "United States": "🇺🇸",
  "United Kingdom": "🇬🇧",
  Canada: "🇨🇦",
  Australia: "🇦🇺",
  Germany: "🇩🇪",
  France: "🇫🇷",
  Japan: "🇯🇵",
  "South Korea": "🇰🇷",
  China: "🇨🇳",
  India: "🇮🇳",
  Brazil: "🇧🇷",
  Mexico: "🇲🇽",
  Russia: "🇷🇺",
  Italy: "🇮🇹",
  Spain: "🇪🇸",
  Netherlands: "🇳🇱",
  Sweden: "🇸🇪",
  Norway: "🇳🇴",
  Denmark: "🇩🇰",
  Finland: "🇫🇮",
  Switzerland: "🇨🇭",
  Austria: "🇦🇹",
  Belgium: "🇧🇪",
  Ireland: "🇮🇪",
  Portugal: "🇵🇹",
  Poland: "🇵🇱",
  "Czech Republic": "🇨🇿",
  Greece: "🇬🇷",
  Turkey: "🇹🇷",
  Israel: "🇮🇱",
  "Saudi Arabia": "🇸🇦",
  UAE: "🇦🇪",
  "South Africa": "🇿🇦",
  Egypt: "🇪🇬",
  Nigeria: "🇳🇬",
  Kenya: "🇰🇪",
  Singapore: "🇸🇬",
  Malaysia: "🇲🇾",
  Thailand: "🇹🇭",
  Vietnam: "🇻🇳",
  Indonesia: "🇮🇩",
  Philippines: "🇵🇭",
  Taiwan: "🇹🇼",
  "Hong Kong": "🇭🇰",
  "New Zealand": "🇳🇿",
  Argentina: "🇦🇷",
  Chile: "🇨🇱",
  Colombia: "🇨🇴",
  Peru: "🇵🇪",
  Pakistan: "🇵🇰",
  Bangladesh: "🇧🇩",
  "Sri Lanka": "🇱🇰",
  Romania: "🇷🇴",
  Hungary: "🇭🇺",
  Ukraine: "🇺🇦",
  Morocco: "🇲🇦",
  Ethiopia: "🇪🇹",
  Ghana: "🇬🇭",
  Tanzania: "🇹🇿",
  Fiji: "🇫🇯",
  Iceland: "🇮🇸",
  Qatar: "🇶🇦",
  Kuwait: "🇰🇼",
  Bahrain: "🇧🇭",
  Oman: "🇴🇲",
  Jordan: "🇯🇴",
  Lebanon: "🇱🇧",
  Iraq: "🇮🇶",
  Nepal: "🇳🇵",
  Myanmar: "🇲🇲",
  Cambodia: "🇰🇭",
};

function getFlag(country: string): string {
  return COUNTRY_FLAGS[country] || "🌍";
}

interface ShareMeetingPanelProps {
  selectedCities: City[];
  fromCity: City;
  selectedHour: number;
  selectedMinute: number;
  selectedDate: Date;
  duration: number;
  now: Date;
}

export function ShareMeetingPanel({
  selectedCities,
  fromCity,
  selectedHour,
  selectedMinute,
  selectedDate,
  duration,
  now,
}: ShareMeetingPanelProps) {
  const { highlightColor } = useWorldClock();
  const [copied, setCopied] = useState(false);

  if (selectedCities.length < 1) return null;

  const otherTimezones = selectedCities
    .filter((c) => c.id !== fromCity.id)
    .map((c) => c.timezone);
  const conversions = convertTime(
    fromCity.timezone,
    otherTimezones,
    selectedHour,
    selectedMinute,
    now,
  );

  const formatTime = (hour: number, minute: number) => {
    const h = hour % 12 || 12;
    const ampm = hour >= 12 ? "PM" : "AM";
    return `${h}:${minute.toString().padStart(2, "0")} ${ampm}`;
  };

  const endHour = (selectedHour + duration) % 24;
  const dateStr = format(selectedDate, "EEEE, MMMM d, yyyy");

  const lines = [
    `📅 ${dateStr}`,
    `⏱️ Duration: ${duration} hour${duration > 1 ? "s" : ""}`,
    "",
    `${getFlag(fromCity.country)} ${fromCity.name}: ${formatTime(selectedHour, selectedMinute)} - ${formatTime(endHour, selectedMinute)}`,
    ...selectedCities
      .filter((c) => c.id !== fromCity.id)
      .map((city, i) => {
        const conv = conversions[i];
        const endConvHour = (conv.hour + duration) % 24;
        const dayDiff = conv.dayOffset;
        return `${getFlag(city.country)} ${city.name}: ${formatTime(conv.hour, conv.minute)} - ${formatTime(endConvHour, conv.minute)}${dayDiff !== 0 ? ` (${dayDiff > 0 ? "+" : ""}${dayDiff} day)` : ""}`;
      }),
  ];

  const textToCopy = lines.join("\n");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 text-muted-foreground">
          <Share2 className="h-3.5 w-3.5" style={{ color: highlightColor }} />{" "}
          SHARE MEETING TIME
        </h3>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border"
          style={
            copied
              ? {
                  borderColor: highlightColor,
                  backgroundColor: `${highlightColor}1a`,
                  color: "hsl(var(--muted-foreground))",
                }
              : {
                  borderColor: "hsl(var(--border))",
                  backgroundColor: "transparent",
                  color: "hsl(var(--muted-foreground))",
                }
          }
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy
            </>
          )}
        </button>
      </div>

      <div className="bg-secondary/50 rounded-lg p-3 font-mono text-xs text-foreground whitespace-pre-line select-text">
        {textToCopy}
      </div>
    </div>
  );
}
