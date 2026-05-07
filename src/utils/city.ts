// src/utils/city.ts

export const CITY_CODE_MAPPINGS: Record<string, string> = {
  "Seoul": "SEO",
  "London": "LON",
  "New York": "NYC",
  "Tokyo": "TYO",
  "Paris": "PAR",
  "Los Angeles": "LAX",
  "San Francisco": "SFO",
  "Chicago": "CHI",
  "Toronto": "TOR",
  "Vancouver": "VAN",
  "Mexico City": "MEX",
  "São Paulo": "SAO",
  "Buenos Aires": "BUE",
  "Madrid": "MAD",
  "Rome": "ROM",
  "Amsterdam": "AMS",
  "Dubai": "DXB",
  "Singapore": "SIN",
  "Hong Kong": "HKG",
  "Shanghai": "SHA",
  "Beijing": "PEK",
  "Mumbai": "BOM",
  "Bangkok": "BKK",
  "Istanbul": "IST",
  "Moscow": "MOW",
  "Cairo": "CAI",
  "Johannesburg": "JNB",
  "Seattle": "SEA",
  "Sydney": "SYD",
  "Berlin": "BER",
  "Washington DC": "WAS",
  "Boston": "BOS",
  "Philadelphia": "PHL",
  "Miami": "MIA",
  "Montreal": "YUL",
  "Bogotá": "BOG",
  "Lima": "LIM",
  "Santiago": "SCL",
  "Barcelona": "BCN",
  "Milan": "MIL",
  "Vienna": "VIE",
  "Prague": "PRG",
  "Budapest": "BUD",
  "Athens": "ATH",
  "Helsinki": "HEL",
  "Stockholm": "STO",
  "Oslo": "OSL",
  "Copenhagen": "CPH",
  "Munich": "MUC",
  "Zurich": "ZRH",
  "Geneva": "GVA",
  "Kyiv": "KYI",
  "Dubai": "DXB",
  "Riyadh": "RUH",
  "Tehran": "THR",
  "Karachi": "KHI",
  "Delhi": "DEL",
  "Dhaka": "DAC",
  "Jakarta": "JKT",
  "Manila": "MNL",
  "Taipei": "TPE",
  "Auckland": "AKL",
  "Wellington": "WLG",
  "Perth": "PER",
  "Melbourne": "MEL",
  "Brisbane": "BNE",
  "Adelaide": "ADL",
};

export function getCityCode(cityName: string, airportCode?: string): string {
  const mapped = CITY_CODE_MAPPINGS[cityName];
  if (mapped) return mapped;

  // If we have an airport code and it's not a multi-airport city that the user might find confusing
  // For Seoul, we explicitly mapped it to SEO to avoid ICN.
  // For others, if it's 3 letters and we don't have a mapping, we might use it or just use city name first 3 letters.
  
  // Default fallback: first 3 letters of city name
  return cityName.slice(0, 3).toUpperCase();
}
