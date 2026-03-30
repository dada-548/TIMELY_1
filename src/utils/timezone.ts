import { CITIES } from "@/data/cities";

export function getTimeInTimezone(
  timezone: string,
  date: Date = new Date(),
): Date {
  const str = date.toLocaleString("en-US", { timeZone: timezone });
  return new Date(str);
}

export function getUTCOffset(
  timezone: string,
  date: Date = new Date(),
): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    timeZoneName: "shortOffset",
  });
  const parts = formatter.formatToParts(date);
  const tzPart = parts.find((p) => p.type === "timeZoneName");
  return tzPart?.value?.replace("GMT", "UTC") || "UTC";
}

// Mapping for timezones where Intl returns unhelpful "GMT+X" format
const TZ_ABBREV_MAP: Record<string, string> = {
  "Asia/Kolkata": "IST",
  "Asia/Calcutta": "IST",
  "Asia/Seoul": "KST",
  "Asia/Tokyo": "JST",
  "Asia/Shanghai": "CST",
  "Asia/Hong_Kong": "HKT",
  "Asia/Taipei": "CST",
  "Asia/Singapore": "SGT",
  "Asia/Kuala_Lumpur": "MYT",
  "Asia/Bangkok": "ICT",
  "Asia/Ho_Chi_Minh": "ICT",
  "Asia/Jakarta": "WIB",
  "Asia/Makassar": "WITA",
  "Asia/Manila": "PHT",
  "Asia/Dhaka": "BST",
  "Asia/Karachi": "PKT",
  "Asia/Colombo": "IST",
  "Asia/Kathmandu": "NPT",
  "Asia/Yangon": "MMT",
  "Asia/Dubai": "GST",
  "Asia/Riyadh": "AST",
  "Asia/Qatar": "AST",
  "Asia/Kuwait": "AST",
  "Asia/Bahrain": "AST",
  "Asia/Muscat": "GST",
  "Asia/Tehran": "IRST",
  "Asia/Baghdad": "AST",
  "Asia/Beirut": "EET",
  "Asia/Amman": "EET",
  "Asia/Jerusalem": "IST",
  "Africa/Johannesburg": "SAST",
  "Africa/Cairo": "EET",
  "Africa/Lagos": "WAT",
  "Africa/Nairobi": "EAT",
  "Africa/Casablanca": "WET",
  "Africa/Accra": "GMT",
  "Africa/Addis_Ababa": "EAT",
  "Africa/Dar_es_Salaam": "EAT",
  "Pacific/Auckland": "NZST",
  "Pacific/Fiji": "FJT",
  "Pacific/Honolulu": "HST",
  "Europe/Istanbul": "TRT",
  "Europe/Moscow": "MSK",
  "Europe/Bucharest": "EET",
  "Europe/Athens": "EET",
  "Europe/Helsinki": "EET",
  "Europe/Kiev": "EET",
  "Europe/Kyiv": "EET",
  "Atlantic/Reykjavik": "GMT",
  "America/Sao_Paulo": "BRT",
  "America/Argentina/Buenos_Aires": "ART",
  "America/Santiago": "CLT",
  "America/Bogota": "COT",
  "America/Lima": "PET",
  "America/Mexico_City": "CST",
};

export function getTimezoneAbbreviation(
  timezone: string,
  date: Date = new Date(),
): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    timeZoneName: "short",
  });
  const parts = formatter.formatToParts(date);
  const intlAbbrev = parts.find((p) => p.type === "timeZoneName")?.value || "";
  // If Intl returns a proper abbreviation (not GMT+X format), use it
  if (
    intlAbbrev &&
    !intlAbbrev.startsWith("GMT+") &&
    !intlAbbrev.startsWith("GMT-")
  ) {
    return intlAbbrev;
  }
  // Fall back to our curated map
  return TZ_ABBREV_MAP[timezone] || intlAbbrev;
}

export function getOffsetMinutes(
  timezone: string,
  date: Date = new Date(),
): number {
  const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
  const tzDate = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
  return (tzDate.getTime() - utcDate.getTime()) / 60000;
}

export function formatTime(
  timezone: string,
  date: Date = new Date(),
  use24h: boolean = false,
): string {
  return date.toLocaleTimeString("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: !use24h,
  });
}

export function formatDate(timezone: string, date: Date = new Date()): string {
  return date.toLocaleDateString("en-US", {
    timeZone: timezone,
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function isDaytime(timezone: string, date: Date = new Date()): boolean {
  const time = getTimeInTimezone(timezone, date);
  const hour = time.getHours();
  return hour >= 6 && hour < 20;
}

export function getTimeOfDay(
  timezone: string,
  date: Date = new Date(),
  hour?: number,
): "night" | "dawn" | "day" | "afternoon" | "dusk" {
  const h =
    hour !== undefined ? hour : getTimeInTimezone(timezone, date).getHours();
  if (h >= 5 && h < 8) return "dawn";
  if (h >= 8 && h < 13) return "day";
  if (h >= 13 && h < 18) return "afternoon";
  if (h >= 18 && h < 22) return "dusk";
  return "night";
}

export function isWorkingHour(hour: number): boolean {
  return hour >= 9 && hour < 17;
}

export function getHourInTimezone(
  timezone: string,
  baseTimezone: string,
  baseHour: number,
  date: Date = new Date(),
): number {
  const offsetDiff =
    getOffsetMinutes(timezone, date) - getOffsetMinutes(baseTimezone, date);
  return (((baseHour + Math.round(offsetDiff / 60)) % 24) + 24) % 24;
}

export function getDiffFromLocal(
  timezone: string,
  date: Date = new Date(),
): string {
  const localOffset = -date.getTimezoneOffset();
  const tzOffset = getOffsetMinutes(timezone, date);
  const diffHours = (tzOffset - localOffset) / 60;
  if (diffHours === 0) return "Current time";
  const sign = diffHours > 0 ? "+" : "";
  const abs = Math.abs(diffHours);
  if (abs % 1 === 0) return `${sign}${diffHours}h`;
  return `${sign}${Math.floor(diffHours)}h ${Math.round((abs % 1) * 60)}m`;
}

export function isDSTActive(timezone: string): boolean {
  const jan = new Date(new Date().getFullYear(), 0, 1);
  const jul = new Date(new Date().getFullYear(), 6, 1);
  const janOffset = getOffsetMinutes(timezone, jan);
  const julOffset = getOffsetMinutes(timezone, jul);
  if (janOffset === julOffset) return false;
  const now = getOffsetMinutes(timezone);
  return now === Math.max(janOffset, julOffset);
}

export function observesDST(timezone: string): boolean {
  const jan = new Date(new Date().getFullYear(), 0, 1);
  const jul = new Date(new Date().getFullYear(), 6, 1);
  return getOffsetMinutes(timezone, jan) !== getOffsetMinutes(timezone, jul);
}

export function getLocalTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function getLocalCityName(): {
  timezoneName: string;
  otherCities: string[];
} {
  const tz = getLocalTimezone();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    timeZoneName: "long",
  });
  const parts = formatter.formatToParts(new Date());
  const tzName = parts.find((p) => p.type === "timeZoneName")?.value || "";

  const matchingCities = CITIES.filter((c) => c.timezone === tz);
  const cityNames = matchingCities.map((c) => c.name);

  return {
    timezoneName: tzName || tz.split("/").pop()?.replace(/_/g, " ") || "",
    otherCities: cityNames,
  };
}

export function findOverlappingWorkingHours(
  timezones: string[],
  date: Date = new Date(),
): { hour: number; allWorking: boolean }[] {
  const results: { hour: number; allWorking: boolean }[] = [];
  const baseTimezone = timezones[0];

  for (let baseHour = 0; baseHour < 24; baseHour++) {
    const allWorking = timezones.every((tz) => {
      const h = getHourInTimezone(tz, baseTimezone, baseHour, date);
      return isWorkingHour(h);
    });
    results.push({ hour: baseHour, allWorking });
  }
  return results;
}

export function convertTime(
  fromTimezone: string,
  toTimezones: string[],
  hour: number,
  minute: number = 0,
  date: Date = new Date(),
): { timezone: string; hour: number; minute: number; dayOffset: number }[] {
  const fromOffset = getOffsetMinutes(fromTimezone, date);
  return toTimezones.map((tz) => {
    const toOffset = getOffsetMinutes(tz, date);
    const diffMinutes = toOffset - fromOffset;
    let totalMinutes = hour * 60 + minute + diffMinutes;
    let dayOffset = 0;
    while (totalMinutes < 0) {
      totalMinutes += 1440;
      dayOffset--;
    }
    while (totalMinutes >= 1440) {
      totalMinutes -= 1440;
      dayOffset++;
    }
    return {
      timezone: tz,
      hour: Math.floor(totalMinutes / 60),
      minute: totalMinutes % 60,
      dayOffset,
    };
  });
}
