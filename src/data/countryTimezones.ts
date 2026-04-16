// Country name → primary UTC offset mapping
// Used to assign each country polygon to a timezone group
// Countries not listed here fall back to centroid-based calculation

export const COUNTRY_TZ_OVERRIDES: Record<string, number> = {
  // ── Americas ──
  "United States of America": -5,
  "Canada": -5,
  "Mexico": -6,
  "Guatemala": -6,
  "Belize": -6,
  "Honduras": -6,
  "El Salvador": -6,
  "Nicaragua": -6,
  "Costa Rica": -6,
  "Panama": -5,
  "Cuba": -5,
  "Jamaica": -5,
  "Haiti": -5,
  "Dominican Rep.": -4,
  "Dominican Republic": -4,
  "Puerto Rico": -4,
  "Colombia": -5,
  "Venezuela": -4,
  "Ecuador": -5,
  "Peru": -5,
  "Brazil": -3,
  "Bolivia": -4,
  "Paraguay": -4,
  "Chile": -4,
  "Argentina": -3,
  "Uruguay": -3,
  "Guyana": -4,
  "Suriname": -3,
  "Fr. S. Antarctic Lands": 5,
  "Falkland Is.": -3,
  "Falkland Islands": -3,
  "Greenland": -3,
  "Trinidad and Tobago": -4,

  // ── Western Europe (UTC+0) ──
  "Iceland": 0,
  "Portugal": 0,
  "Ireland": 0,
  "United Kingdom": 0,

  // ── Central Europe (UTC+1) ──
  "Spain": 1,
  "France": 1,
  "Belgium": 1,
  "Netherlands": 1,
  "Luxembourg": 1,
  "Germany": 1,
  "Switzerland": 1,
  "Austria": 1,
  "Italy": 1,
  "Norway": 1,
  "Sweden": 1,
  "Denmark": 1,
  "Poland": 1,
  "Czech Rep.": 1,
  "Czechia": 1,
  "Slovakia": 1,
  "Hungary": 1,
  "Croatia": 1,
  "Slovenia": 1,
  "Serbia": 1,
  "Bosnia and Herz.": 1,
  "Bosnia and Herzegovina": 1,
  "Montenegro": 1,
  "North Macedonia": 1,
  "Macedonia": 1,
  "Albania": 1,
  "Kosovo": 1,
  "Tunisia": 1,
  "Algeria": 1,
  "Morocco": 1,
  "Nigeria": 1,
  "Cameroon": 1,
  "Gabon": 1,
  "Eq. Guinea": 1,
  "Equatorial Guinea": 1,
  "Congo": 1,
  "Dem. Rep. Congo": 1,
  "Democratic Republic of the Congo": 1,
  "Central African Rep.": 1,
  "Central African Republic": 1,
  "Chad": 1,
  "Niger": 1,
  "Angola": 1,
  "Benin": 1,
  "Togo": 0,

  // ── West Africa (UTC+0) ──
  "Ghana": 0,
  "Senegal": 0,
  "Mali": 0,
  "Mauritania": 0,
  "Burkina Faso": 0,
  "Guinea": 0,
  "Guinea-Bissau": 0,
  "Sierra Leone": 0,
  "Liberia": 0,
  "Gambia": 0,
  "Côte d'Ivoire": 0,
  "Ivory Coast": 0,
  "W. Sahara": 0,
  "Western Sahara": 0,

  // ── Eastern Europe (UTC+2) ──
  "Finland": 2,
  "Estonia": 2,
  "Latvia": 2,
  "Lithuania": 2,
  "Ukraine": 2,
  "Romania": 2,
  "Moldova": 2,
  "Bulgaria": 2,
  "Greece": 2,
  "Cyprus": 2,
  "Israel": 2,
  "Palestine": 2,
  "Lebanon": 2,
  "Egypt": 2,
  "Libya": 2,
  "South Africa": 2,
  "Botswana": 2,
  "Zimbabwe": 2,
  "Zambia": 2,
  "Malawi": 2,
  "Mozambique": 2,
  "eSwatini": 2,
  "Swaziland": 2,
  "Lesotho": 2,
  "Namibia": 2,
  "Burundi": 2,
  "Rwanda": 2,

  // ── UTC+3 ──
  "Turkey": 3,
  "Russia": 3,
  "Syria": 3,
  "Jordan": 3,
  "Iraq": 3,
  "Saudi Arabia": 3,
  "Yemen": 3,
  "Kuwait": 3,
  "Bahrain": 3,
  "Qatar": 3,
  "Ethiopia": 3,
  "Eritrea": 3,
  "Djibouti": 3,
  "Somalia": 3,
  "Kenya": 3,
  "Uganda": 3,
  "Tanzania": 3,
  "Madagascar": 3,
  "Comoros": 3,
  "South Sudan": 3,
  "Sudan": 2,

  // ── UTC+4 ──
  "United Arab Emirates": 4,
  "Oman": 4,
  "Georgia": 4,
  "Armenia": 4,
  "Azerbaijan": 4,
  "Mauritius": 4,
  "Seychelles": 4,
  "Reunion": 4,

  // ── UTC+4:30 → 5 ──
  "Afghanistan": 5,
  "Iran": 4,

  // ── UTC+5 ──
  "Pakistan": 5,
  "Uzbekistan": 5,
  "Turkmenistan": 5,
  "Tajikistan": 5,
  "Maldives": 5,

  // ── UTC+5:30 → 5 ──
  "India": 5,
  "Sri Lanka": 6,

  // ── UTC+5:45 → 6 ──
  "Nepal": 6,

  // ── UTC+6 ──
  "Bangladesh": 6,
  "Bhutan": 6,
  "Kazakhstan": 6,
  "Kyrgyzstan": 6,

  // ── UTC+6:30 → 7 ──
  "Myanmar": 7,

  // ── UTC+7 ──
  "Thailand": 7,
  "Vietnam": 7,
  "Laos": 7,
  "Cambodia": 7,
  "Indonesia": 7,

  // ── UTC+8 ──
  "China": 8,
  "Mongolia": 8,
  "Malaysia": 8,
  "Singapore": 8,
  "Philippines": 8,
  "Taiwan": 8,
  "Brunei": 8,
  "Hong Kong": 8,
  "Macau": 8,

  // ── UTC+9 ──
  "Japan": 9,
  "South Korea": 9,
  "North Korea": 9,
  "Korea": 9,
  "Dem. Rep. Korea": 9,
  "Timor-Leste": 9,
  "East Timor": 9,
  "Palau": 9,

  // ── UTC+10 ──
  "Australia": 10,
  "Papua New Guinea": 10,
  "Guam": 10,

  // ── UTC+11 ──
  "Solomon Is.": 11,
  "Solomon Islands": 11,
  "New Caledonia": 11,
  "Vanuatu": 11,

  // ── UTC+12 ──
  "New Zealand": 12,
  "Fiji": 12,
  "Marshall Is.": 12,
  "Marshall Islands": 12,
  "Kiribati": 12,
  "Nauru": 12,
  "Tuvalu": 12,

  // ── UTC+13 ──
  "Tonga": 13,
  "Samoa": 13,

  // ── Negative offsets ──
  "Cape Verde": -1,
  "Cabo Verde": -1,

  // ── Antarctica ──
  "Antarctica": 0,
};

// Compute centroid longitude from GeoJSON geometry coordinates
export function computeCentroidLng(geometry: any): number { // eslint-disable-line @typescript-eslint/no-explicit-any
  const lngs: number[] = [];
  function extract(coords: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (Array.isArray(coords) && typeof coords[0] === 'number') {
      lngs.push(coords[0]);
    } else if (Array.isArray(coords)) {
      coords.forEach(extract);
    }
  }
  extract(geometry.coordinates);
  if (lngs.length === 0) return 0;
  return lngs.reduce((a, b) => a + b, 0) / lngs.length;
}

// Get the UTC offset for a country geography feature
export function getCountryOffset(geo: any): number { // eslint-disable-line @typescript-eslint/no-explicit-any
  const name = geo.properties?.name;
  if (name && COUNTRY_TZ_OVERRIDES[name] !== undefined) {
    return COUNTRY_TZ_OVERRIDES[name];
  }
  const centroidLng = computeCentroidLng(geo.geometry || geo);
  return Math.round(centroidLng / 15);
}
