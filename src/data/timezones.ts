export interface TimezoneMapping {
  standard: string;
  daylight: string;
  name: string;
  iana: string;
  standardName?: string;
  daylightName?: string;
}

export const COMMON_TIMEZONES: TimezoneMapping[] = [
  { name: "Pacific Time Zone", standard: "PST", daylight: "PDT", iana: "America/Los_Angeles", standardName: "Pacific Standard Time", daylightName: "Pacific Daylight Time" },
  { name: "Mountain Time Zone", standard: "MST", daylight: "MDT", iana: "America/Denver", standardName: "Mountain Standard Time", daylightName: "Mountain Daylight Time" },
  { name: "Central Time Zone", standard: "CST", daylight: "CDT", iana: "America/Chicago", standardName: "Central Standard Time", daylightName: "Central Daylight Time" },
  { name: "Eastern Time Zone", standard: "EST", daylight: "EDT", iana: "America/New_York", standardName: "Eastern Standard Time", daylightName: "Eastern Daylight Time" },
  { name: "Atlantic Time Zone", standard: "AST", daylight: "ADT", iana: "America/Halifax", standardName: "Atlantic Standard Time", daylightName: "Atlantic Daylight Time" },
  { name: "Greenwich Mean Time", standard: "GMT", daylight: "BST", iana: "Europe/London", standardName: "Greenwich Mean Time", daylightName: "British Summer Time" },
  { name: "Central European Time", standard: "CET", daylight: "CEST", iana: "Europe/Paris", standardName: "Central European Time", daylightName: "Central European Summer Time" },
  { name: "Eastern European Time", standard: "EET", daylight: "EEST", iana: "Europe/Athens", standardName: "Eastern European Time", daylightName: "Eastern European Summer Time" },
  { name: "Western European Time", standard: "WET", daylight: "WEST", iana: "Europe/Lisbon", standardName: "Western European Time", daylightName: "Western European Summer Time" },
  { name: "India Standard Time", standard: "IST", daylight: "IST", iana: "Asia/Kolkata", standardName: "India Standard Time", daylightName: "India Standard Time" },
  { name: "China Standard Time", standard: "CST", daylight: "CST", iana: "Asia/Shanghai", standardName: "China Standard Time", daylightName: "China Standard Time" },
  { name: "Japan Standard Time", standard: "JST", daylight: "JST", iana: "Asia/Tokyo", standardName: "Japan Standard Time", daylightName: "Japan Standard Time" },
  { name: "Korea Standard Time", standard: "KST", daylight: "KST", iana: "Asia/Seoul", standardName: "Korea Standard Time", daylightName: "Korea Standard Time" },
  { name: "Australian Eastern Time", standard: "AEST", daylight: "AEDT", iana: "Australia/Sydney", standardName: "Australian Eastern Standard Time", daylightName: "Australian Eastern Daylight Time" },
  { name: "Australian Central Time", standard: "ACST", daylight: "ACDT", iana: "Australia/Adelaide", standardName: "Australian Central Standard Time", daylightName: "Australian Central Daylight Time" },
  { name: "Australian Western Time", standard: "AWST", daylight: "AWST", iana: "Australia/Perth", standardName: "Australian Western Standard Time", daylightName: "Australian Western Standard Time" },
  { name: "Singapore Standard Time", standard: "SGT", daylight: "SGT", iana: "Asia/Singapore", standardName: "Singapore Standard Time", daylightName: "Singapore Standard Time" },
  { name: "Hong Kong Time", standard: "HKT", daylight: "HKT", iana: "Asia/Hong_Kong", standardName: "Hong Kong Time", daylightName: "Hong Kong Time" },
];
