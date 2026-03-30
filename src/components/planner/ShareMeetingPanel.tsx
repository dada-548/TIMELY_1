import { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";
import { useWorldClock } from "@/hooks/useWorldClock";
import { convertTime } from "@/utils/timezone";
import { format, addDays } from "date-fns";
import type { City } from "@/data/cities";
import ReactCountryFlag from "react-country-flag";

const COUNTRY_CODES: Record<string, string> = {
  "United States": "US",
  "USA": "US",
  "United Kingdom": "GB",
  "UK": "GB",
  Canada: "CA",
  Australia: "AU",
  Germany: "DE",
  France: "FR",
  Japan: "JP",
  "South Korea": "KR",
  China: "CN",
  India: "IN",
  Brazil: "BR",
  Mexico: "MX",
  Russia: "RU",
  Italy: "IT",
  Spain: "ES",
  Netherlands: "NL",
  Sweden: "SE",
  Norway: "NO",
  Denmark: "DK",
  Finland: "FI",
  Switzerland: "CH",
  Austria: "AT",
  Belgium: "BE",
  Ireland: "IE",
  Portugal: "PT",
  Poland: "PL",
  "Czech Republic": "CZ",
  Greece: "GR",
  Turkey: "TR",
  Israel: "IL",
  "Saudi Arabia": "SA",
  UAE: "AE",
  "South Africa": "ZA",
  Egypt: "EG",
  Nigeria: "NG",
  Kenya: "KE",
  Singapore: "SG",
  Malaysia: "MY",
  Thailand: "TH",
  Vietnam: "VN",
  Indonesia: "ID",
  Philippines: "PH",
  Taiwan: "TW",
  "Hong Kong": "HK",
  "New Zealand": "NZ",
  Argentina: "AR",
  Chile: "CL",
  Colombia: "CO",
  Peru: "PE",
  Pakistan: "PK",
  Bangladesh: "BD",
  "Sri Lanka": "LK",
  Romania: "RO",
  Hungary: "HU",
  Ukraine: "UA",
  Morocco: "MA",
  Ethiopia: "ET",
  Ghana: "GH",
  Tanzania: "TZ",
  Fiji: "FJ",
  Iceland: "IS",
  Qatar: "QA",
  Kuwait: "KW",
  Bahrain: "BH",
  Oman: "OM",
  Jordan: "JO",
  Lebanon: "LB",
  Iraq: "IQ",
  Nepal: "NP",
  Myanmar: "MM",
  Cambodia: "KH",
};

function getCountryCode(country: string): string {
  return COUNTRY_CODES[country] || "US"; // Default to US if not found
}

// Helper to get emoji flag for clipboard (still better than nothing, and many apps handle it)
const getEmojiFlag = (country: string): string => {
  const code = getCountryCode(country);
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(char.charCodeAt(0) + 127397));
};

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
  const { highlightColor, use24h } = useWorldClock();
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
    if (use24h) {
      return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    }
    const h = hour % 12 || 12;
    const ampm = hour >= 12 ? "PM" : "AM";
    return `${h}:${minute.toString().padStart(2, "0")} ${ampm}`;
  };

  const formatDate = (date: Date, dayOffset: number = 0) => {
    const targetDate = dayOffset === 0 ? date : addDays(date, dayOffset);
    return format(targetDate, "EEE, MMM d");
  };

  const endHour = (selectedHour + duration) % 24;
  const mainDateStr = format(selectedDate, "EEEE, MMMM d, yyyy");

  // Generate text for clipboard
  const clipboardLines = [
    `📅 Meeting Proposal`,
    `⏱️ Duration: ${duration} hour${duration > 1 ? "s" : ""}`,
    "",
    `${getEmojiFlag(fromCity.country)} ${fromCity.name}: ${formatDate(selectedDate)} @ ${formatTime(selectedHour, selectedMinute)} - ${formatTime(endHour, selectedMinute)}`,
    ...selectedCities
      .filter((c) => c.id !== fromCity.id)
      .map((city, i) => {
        const conv = conversions[i];
        const endConvHour = (conv.hour + duration) % 24;
        return `${getEmojiFlag(city.country)} ${city.name}: ${formatDate(selectedDate, conv.dayOffset)} @ ${formatTime(conv.hour, conv.minute)} - ${formatTime(endConvHour, conv.minute)}`;
      }),
  ];

  const textToCopy = clipboardLines.join("\n");

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
        <div className="mb-1 text-muted-foreground">📅 Meeting Proposal</div>
        <div className="mb-2 text-muted-foreground">⏱️ Duration: {duration} hour{duration > 1 ? "s" : ""}</div>
        
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <ReactCountryFlag 
              countryCode={getCountryCode(fromCity.country)} 
              svg 
              style={{ width: '1.2em', height: '1.2em' }}
            />
            <span>
              <span className="font-bold">{fromCity.name}</span>: {formatDate(selectedDate)} @ {formatTime(selectedHour, selectedMinute)} - {formatTime(endHour, selectedMinute)}
            </span>
          </div>
          {selectedCities
            .filter((c) => c.id !== fromCity.id)
            .map((city, i) => {
              const conv = conversions[i];
              const endConvHour = (conv.hour + duration) % 24;
              return (
                <div key={city.id} className="flex items-center gap-2">
                  <ReactCountryFlag 
                    countryCode={getCountryCode(city.country)} 
                    svg 
                    style={{ width: '1.2em', height: '1.2em' }}
                  />
                  <span>
                    <span className="font-bold">{city.name}</span>: {formatDate(selectedDate, conv.dayOffset)} @ {formatTime(conv.hour, conv.minute)} - {formatTime(endConvHour, conv.minute)}
                  </span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
