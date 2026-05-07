// src/utils/country.ts

export const COUNTRY_MAPPINGS: Record<string, { full: string; short: string }> = {
  "USA": { full: "United States", short: "USA" },
  "UK": { full: "United Kingdom", short: "GBR" },
  "UAE": { full: "United Arab Emirates", short: "ARE" },
  "DRC": { full: "DR Congo", short: "COD" },
  "South Korea": { full: "South Korea", short: "KOR" },
  "Czech Republic": { full: "Czech Republic", short: "CZE" },
  "New Zealand": { full: "New Zealand", short: "NZL" },
  "Saudi Arabia": { full: "Saudi Arabia", short: "SAU" },
  "South Africa": { full: "South Africa", short: "ZAF" },
  "Antarctica": { full: "Antarctica", short: "ATA" },
  "Greenland": { full: "Greenland", short: "GRL" },
  "United Arab Emirates": { full: "United Arab Emirates", short: "ARE" },
  "Dominican Republic": { full: "Dominican Rep.", short: "DOM" },
  "Netherlands": { full: "Netherlands", short: "NLD" },
  "Turkey": { full: "Turkey", short: "TUR" },
  "Russia": { full: "Russia", short: "RUS" },
  "Japan": { full: "Japan", short: "JPN" },
  "France": { full: "France", short: "FRA" },
  "Canada": { full: "Canada", short: "CAN" },
  "Australia": { full: "Australia", short: "AUS" },
  "Germany": { full: "Germany", short: "DEU" },
  "Spain": { full: "Spain", short: "ESP" },
  "Italy": { full: "Italy", short: "ITA" },
  "China": { full: "China", short: "CHN" },
  "India": { full: "India", short: "IND" },
  "Brazil": { full: "Brazil", short: "BRA" },
  "Mexico": { full: "Mexico", short: "MEX" },
};

export function getCountryNames(country: string) {
  const mapped = COUNTRY_MAPPINGS[country];
  if (mapped) {
    return mapped;
  }
  
  // If no mapping, we try to create a short one if it's long
  if (country.length > 8) {
    // Basic heuristic: take first 3 chars or first letter of words
    const words = country.split(' ');
    if (words.length > 1) {
      const short = words.map(w => w[0]).join('').toUpperCase();
      return { full: country, short: short.length >= 2 ? short : country.slice(0, 3).toUpperCase() };
    }
  }

  return { full: country, short: country.length > 4 ? country.slice(0, 3).toUpperCase() : country };
}
