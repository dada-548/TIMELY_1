export function sanitizeTimezone(tz: string): string {
  if (!tz) return "UTC";
  if (typeof tz !== "string") return "UTC";

  // Handle FIXED strings like "FIXED:-480:PST:America/Los_Angeles"
  if (tz.startsWith("FIXED:")) {
    const parts = tz.split(":");
    // If it has enough parts, the 4th part should be the IANA name
    if (parts.length >= 4 && parts[3].includes("/")) {
      return parts[3];
    }
    // Fallback search for IANA-like part
    const ianaPart = parts.find((p) => p.includes("/"));
    if (ianaPart) return ianaPart;

    // Fallback to UTC if no IANA name found
    return "UTC";
  }

  // Some browsers/environments might return other weird formats. 
  // Standard timezone names usually don't have colons (except the FIXED: prefix we handled).
  if (tz.includes(":")) return "UTC";

  return tz;
}

export function getOffsetMinutes(
  timezone: string,
  date: Date = new Date(),
): number {
  // If it's a fixed offset string, return the offset directly
  if (timezone && timezone.startsWith("FIXED:")) {
    const parts = timezone.split(":");
    if (parts.length >= 2) {
      const offset = parseInt(parts[1]);
      if (!isNaN(offset)) return offset;
    }
  }

  const sanitizedTz = sanitizeTimezone(timezone);
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: sanitizedTz,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hourCycle: "h23",
    });

    const parts = formatter.formatToParts(date);
    const p: Record<string, string> = {};
    parts.forEach((part) => {
      p[part.type] = part.value;
    });

    const year = parseInt(p.year);
    const month = parseInt(p.month) - 1;
    const day = parseInt(p.day);
    const hour = parseInt(p.hour);
    const minute = parseInt(p.minute);
    const second = parseInt(p.second);

    const tzTimeAsUTC = Date.UTC(year, month, day, hour, minute, second);
    const utcTimeAsUTC = Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
    );

    return Math.round((tzTimeAsUTC - utcTimeAsUTC) / 60000);
  } catch (e) {
    console.error(
      `Error calculating offset for timezone: ${timezone} (sanitized: ${sanitizedTz})`,
      e,
    );
    return 0;
  }
}

export function isDSTActive(
  timezone: string,
  date: Date = new Date(),
): boolean {
  const jan = new Date(date.getFullYear(), 0, 1);
  const jul = new Date(date.getFullYear(), 6, 1);
  const janOffset = getOffsetMinutes(timezone, jan);
  const julOffset = getOffsetMinutes(timezone, jul);
  if (janOffset === julOffset) return false;
  const currentOffset = getOffsetMinutes(timezone, date);
  return currentOffset === Math.max(janOffset, julOffset);
}
