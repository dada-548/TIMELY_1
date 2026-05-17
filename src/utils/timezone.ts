import { CITIES } from "@/data/cities";
import { getOffsetMinutes, isDSTActive, sanitizeTimezone } from "./timezone_base";

export function getTimeInTimezone(
  timezone: string,
  date: Date = new Date(),
): Date {
  if (timezone && timezone.startsWith("FIXED:")) {
    const offset = getOffsetMinutes(timezone, date);
    // Convert current local date to its UTC timestamp, then add offset
    const utcTimestamp = date.getTime();
    // We create a Date that represents the absolute time in that zone
    // But since the rest of the app expects a Date object that "looks" like the local time in that zone
    // when formatted as UTC, we'll do that.
    return new Date(utcTimestamp + offset * 60000);
  }

  const sanitizedTz = sanitizeTimezone(timezone);
  try {
    const str = date.toLocaleString("en-US", { timeZone: sanitizedTz });
    return new Date(str);
  } catch (e) {
    console.error(`Error in getTimeInTimezone: ${timezone}`, e);
    return date;
  }
}

export function getUTCOffset(
  timezone: string,
  date: Date = new Date(),
): string {
  if (timezone && timezone.startsWith("FIXED:")) {
    const offset = getOffsetMinutes(timezone, date);
    const absOffset = Math.abs(offset);
    const hours = Math.floor(absOffset / 60);
    const mins = absOffset % 60;
    const sign = offset >= 0 ? "+" : "-";
    const hoursStr = hours.toString();
    const minsStr = mins > 0 ? `:${mins.toString().padStart(2, "0")}` : "";
    return `UTC${sign}${hoursStr}${minsStr}`;
  }

  const sanitizedTz = sanitizeTimezone(timezone);
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: sanitizedTz,
      timeZoneName: "shortOffset",
    });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    return tzPart?.value?.replace("GMT", "UTC") || "UTC";
  } catch (e) {
    console.error(`Error in getUTCOffset: ${timezone}`, e);
    return "UTC";
  }
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

const SEASONAL_TZ_MAP: Record<string, { standard: string; daylight: string }> = {
  "Australia/Sydney": { standard: "AEST", daylight: "AEDT" },
  "Australia/Melbourne": { standard: "AEST", daylight: "AEDT" },
  "Australia/Adelaide": { standard: "ACST", daylight: "ACDT" },
  "Australia/Canberra": { standard: "AEST", daylight: "AEDT" },
  "Australia/Hobart": { standard: "AEST", daylight: "AEDT" },
  "Australia/Brisbane": { standard: "AEST", daylight: "AEST" },
  "Australia/Perth": { standard: "AWST", daylight: "AWST" },
  "Australia/Darwin": { standard: "ACST", daylight: "ACST" },
  "America/New_York": { standard: "EST", daylight: "EDT" },
  "America/Chicago": { standard: "CST", daylight: "CDT" },
  "America/Denver": { standard: "MST", daylight: "MDT" },
  "America/Los_Angeles": { standard: "PST", daylight: "PDT" },
  "America/Phoenix": { standard: "MST", daylight: "MST" },
  "Europe/London": { standard: "GMT", daylight: "BST" },
  "Europe/Paris": { standard: "CET", daylight: "CEST" },
  "Europe/Berlin": { standard: "CET", daylight: "CEST" },
  "Europe/Rome": { standard: "CET", daylight: "CEST" },
  "Europe/Madrid": { standard: "CET", daylight: "CEST" },
  "Europe/Amsterdam": { standard: "CET", daylight: "CEST" },
  "Europe/Brussels": { standard: "CET", daylight: "CEST" },
  "Europe/Vienna": { standard: "CET", daylight: "CEST" },
  "Europe/Zurich": { standard: "CET", daylight: "CEST" },
  "Europe/Stockholm": { standard: "CET", daylight: "CEST" },
  "Europe/Oslo": { standard: "CET", daylight: "CEST" },
  "Europe/Copenhagen": { standard: "CET", daylight: "CEST" },
  "Europe/Prague": { standard: "CET", daylight: "CEST" },
  "Europe/Warsaw": { standard: "CET", daylight: "CEST" },
  "Europe/Budapest": { standard: "CET", daylight: "CEST" },
  "Europe/Lisbon": { standard: "WET", daylight: "WEST" },
  "Europe/Dublin": { standard: "GMT", daylight: "IST" },
  "America/Toronto": { standard: "EST", daylight: "EDT" },
  "America/Vancouver": { standard: "PST", daylight: "PDT" },
  "Asia/Jerusalem": { standard: "IST", daylight: "IDT" },
  "Asia/Beirut": { standard: "EET", daylight: "EEST" },
  "Asia/Amman": { standard: "EET", daylight: "EEST" },
  "Asia/Damascus": { standard: "EET", daylight: "EEST" },
};

export function getTimezoneAbbreviation(
  timezone: string,
  date: Date = new Date(),
): string {
  if (timezone && timezone.startsWith("FIXED:")) {
    const parts = timezone.split(":");
    if (parts.length >= 3 && parts[2]) return parts[2];
  }

  const sanitizedTz = sanitizeTimezone(timezone);
  const seasonal = SEASONAL_TZ_MAP[sanitizedTz];
  if (seasonal) {
    return isDSTActive(sanitizedTz, date) ? seasonal.daylight : seasonal.standard;
  }

  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: sanitizedTz,
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
    return TZ_ABBREV_MAP[sanitizedTz] || intlAbbrev;
  } catch (e) {
    console.error(`Error in getTimezoneAbbreviation: ${timezone}`, e);
    return "";
  }
}

export { getOffsetMinutes };

export function formatTime(
  timezone: string,
  date: Date = new Date(),
  use24h: boolean = false,
): string {
  if (timezone && timezone.startsWith("FIXED:")) {
    const offset = getOffsetMinutes(timezone, date);
    const utcDate = new Date(date.getTime() + offset * 60000);
    return utcDate.toLocaleTimeString("en-US", {
      timeZone: "UTC",
      hour: "2-digit",
      minute: "2-digit",
      hour12: !use24h,
    });
  }

  const sanitizedTz = sanitizeTimezone(timezone);
  try {
    return date.toLocaleTimeString("en-US", {
      timeZone: sanitizedTz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: !use24h,
    });
  } catch (e) {
    console.error(`Error in formatTime: ${timezone}`, e);
    return date.toLocaleTimeString();
  }
}

export function formatDate(
  timezone: string,
  date: Date = new Date(),
  includeYear: boolean = false
): string {
  if (timezone && timezone.startsWith("FIXED:")) {
    const offset = getOffsetMinutes(timezone, date);
    const utcDate = new Date(date.getTime() + offset * 60000);
    return utcDate.toLocaleDateString("en-US", {
      timeZone: "UTC",
      weekday: "short",
      month: "short",
      day: "numeric",
      year: includeYear ? "numeric" : undefined,
    });
  }

  const sanitizedTz = sanitizeTimezone(timezone);
  try {
    return date.toLocaleDateString("en-US", {
      timeZone: sanitizedTz,
      weekday: "short",
      month: "short",
      day: "numeric",
      year: includeYear ? "numeric" : undefined,
    });
  } catch (e) {
    console.error(`Error in formatDate: ${timezone}`, e);
    return date.toLocaleDateString();
  }
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
  if (h >= 13 && h < 19) return "afternoon";
  if (h >= 19 && h < 22) return "dusk";
  return "night";
}

export function isWorkingHour(hour: number): boolean {
  return hour >= 9 && hour < 18;
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

export interface TimeDiff {
  timeDiff: string;
  dayOffset: number;
}

export function getDiffFromLocal(
  timezone: string,
  date: Date = new Date(),
): TimeDiff {
  const sanitizedTz = sanitizeTimezone(timezone);
  const localTz = getLocalTimezone();

  try {
    const localOffset = -date.getTimezoneOffset();
    const tzOffset = getOffsetMinutes(timezone, date);
    const diffHours = (tzOffset - localOffset) / 60;

    // Calculate day offset
    const localDateStr = date.toLocaleDateString("en-US", {
      timeZone: localTz,
    });
    
    let targetDateStr: string;
    if (timezone && timezone.startsWith("FIXED:")) {
      const utcDate = new Date(date.getTime() + tzOffset * 60000);
      targetDateStr = utcDate.toLocaleDateString("en-US", {
        timeZone: "UTC",
      });
    } else {
      targetDateStr = date.toLocaleDateString("en-US", {
        timeZone: sanitizedTz,
      });
    }

    const localDate = new Date(localDateStr);
    const targetDate = new Date(targetDateStr);

    const diffTime = targetDate.getTime() - localDate.getTime();
    const dayOffset = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (Math.abs(diffHours) < 0.01) return { timeDiff: "My time", dayOffset };
    const sign = diffHours > 0 ? "+" : "";
    const abs = Math.abs(diffHours);

    let timeDiffStr = "";
    if (abs % 1 === 0) {
      timeDiffStr = `${sign}${diffHours}h`;
    } else {
      timeDiffStr = `${sign}${Math.floor(diffHours)}h ${Math.round(
        (abs % 1) * 60,
      )}m`;
    }

    return { timeDiff: timeDiffStr, dayOffset };
  } catch (e) {
    console.error(`Error in getDiffFromLocal for ${timezone}:`, e);
    return { timeDiff: "0h", dayOffset: 0 };
  }
}

export { isDSTActive };

export function observesDST(timezone: string): boolean {
  const jan = new Date(new Date().getFullYear(), 0, 1);
  const jul = new Date(new Date().getFullYear(), 6, 1);
  return getOffsetMinutes(timezone, jan) !== getOffsetMinutes(timezone, jul);
}

export function getLocalTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return sanitizeTimezone(tz);
  } catch (e) {
    console.error("Error getting local timezone", e);
    return "UTC";
  }
}

export function getTimezoneName(
  timezone: string,
  date: Date = new Date(),
): string {
  const sanitizedTz = sanitizeTimezone(timezone);
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: sanitizedTz,
      timeZoneName: "long",
    });
    const parts = formatter.formatToParts(date);
    return parts.find((p) => p.type === "timeZoneName")?.value || sanitizedTz;
  } catch (e) {
    console.error(`Error in getTimezoneName: ${timezone}`, e);
    return sanitizedTz;
  }
}

export function getLocalCityName(): {
  timezoneName: string;
  otherCities: string[];
} {
  const tz = getLocalTimezone();
  try {
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
  } catch (e) {
    console.error(`Error in getLocalCityName: ${tz}`, e);
    const matchingCities = CITIES.filter((c) => c.timezone === tz);
    return {
      timezoneName: tz.split("/").pop()?.replace(/_/g, " ") || "Local Time",
      otherCities: matchingCities.map((c) => c.name),
    };
  }
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
