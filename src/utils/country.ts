// src/utils/country.ts

export const COUNTRY_MAPPINGS: Record<string, { full: string; short: string; iso2: string }> = {
  "USA": { full: "United States", short: "USA", iso2: "us" },
  "UK": { full: "United Kingdom", short: "GBR", iso2: "gb" },
  "UAE": { full: "United Arab Emirates", short: "ARE", iso2: "ae" },
  "DRC": { full: "DR Congo", short: "COD", iso2: "cd" },
  "South Korea": { full: "South Korea", short: "KOR", iso2: "kr" },
  "Czech Republic": { full: "Czech Republic", short: "CZE", iso2: "cz" },
  "New Zealand": { full: "New Zealand", short: "NZL", iso2: "nz" },
  "Saudi Arabia": { full: "Saudi Arabia", short: "SAU", iso2: "sa" },
  "South Africa": { full: "South Africa", short: "ZAF", iso2: "za" },
  "Antarctica": { full: "Antarctica", short: "ATA", iso2: "aq" },
  "Greenland": { full: "Greenland", short: "GRL", iso2: "gl" },
  "Dominican Republic": { full: "Dominican Rep.", short: "DOM", iso2: "do" },
  "Netherlands": { full: "Netherlands", short: "NLD", iso2: "nl" },
  "Turkey": { full: "Turkey", short: "TUR", iso2: "tr" },
  "Russia": { full: "Russia", short: "RUS", iso2: "ru" },
  "Japan": { full: "Japan", short: "JPN", iso2: "jp" },
  "France": { full: "France", short: "FRA", iso2: "fr" },
  "Canada": { full: "Canada", short: "CAN", iso2: "ca" },
  "Australia": { full: "Australia", short: "AUS", iso2: "au" },
  "Germany": { full: "Germany", short: "DEU", iso2: "de" },
  "Spain": { full: "Spain", short: "ESP", iso2: "es" },
  "Italy": { full: "Italy", short: "ITA", iso2: "it" },
  "China": { full: "China", short: "CHN", iso2: "cn" },
  "India": { full: "India", short: "IND", iso2: "in" },
  "Brazil": { full: "Brazil", short: "BRA", iso2: "br" },
  "Mexico": { full: "Mexico", short: "MEX", iso2: "mx" },
  "Singapore": { full: "Singapore", short: "SGP", iso2: "sg" },
  "Thailand": { full: "Thailand", short: "THA", iso2: "th" },
  "Argentina": { full: "Argentina", short: "ARG", iso2: "ar" },
  "Israel": { full: "Israel", short: "ISR", iso2: "il" },
  "Egypt": { full: "Egypt", short: "EGY", iso2: "eg" },
  "Vietnam": { full: "Vietnam", short: "VNM", iso2: "vn" },
  "Indonesia": { full: "Indonesia", short: "IDN", iso2: "id" },
  "Taiwan": { full: "Taiwan", short: "TWN", iso2: "tw" },
  "Philippines": { full: "Philippines", short: "PHL", iso2: "ph" },
  "Pakistan": { full: "Pakistan", short: "PAK", iso2: "pk" },
  "Nigeria": { full: "Nigeria", short: "NGA", iso2: "ng" },
  "Kenya": { full: "Kenya", short: "KEN", iso2: "ke" },
  "Norway": { full: "Norway", short: "NOR", iso2: "no" },
  "Sweden": { full: "Sweden", short: "SWE", iso2: "se" },
  "Finland": { full: "Finland", short: "FIN", iso2: "fi" },
  "Denmark": { full: "Denmark", short: "DNK", iso2: "dk" },
  "Poland": { full: "Poland", short: "POL", iso2: "pl" },
  "Greece": { full: "Greece", short: "GRC", iso2: "gr" },
  "Ireland": { full: "Ireland", short: "IRL", iso2: "ie" },
  "Belgium": { full: "Belgium", short: "BEL", iso2: "be" },
  "Austria": { full: "Austria", short: "AUT", iso2: "at" },
  "Switzerland": { full: "Switzerland", short: "CHE", iso2: "ch" },
  "Portugal": { full: "Portugal", short: "PRT", iso2: "pt" },
  "Chile": { full: "Chile", short: "CHL", iso2: "cl" },
  "Colombia": { full: "Colombia", short: "COL", iso2: "co" },
  "Peru": { full: "Peru", short: "PER", iso2: "pe" },
  "Uruguay": { full: "Uruguay", short: "URY", iso2: "uy" },
  "Bolivia": { full: "Bolivia", short: "BOL", iso2: "bo" },
  "Paraguay": { full: "Paraguay", short: "PRY", iso2: "py" },
  "Venezuela": { full: "Venezuela", short: "VEN", iso2: "ve" },
  "Panama": { full: "Panama", short: "PAN", iso2: "pa" },
  "Jamaica": { full: "Jamaica", short: "JAM", iso2: "jm" },
  "Cuba": { full: "Cuba", short: "CUB", iso2: "cu" },
};

export function getCountryInfo(country: string) {
  const mapped = COUNTRY_MAPPINGS[country];
  if (mapped) {
    return mapped;
  }
  
  // Default values if no mapping found
  return { 
    full: country, 
    short: country.length > 4 ? country.slice(0, 3).toUpperCase() : country,
    iso2: "" 
  };
}

export function getFlagUrl(iso2: string) {
  if (!iso2) return null;
  return `https://flagcdn.com/w40/${iso2.toLowerCase()}.png`;
}
