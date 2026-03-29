export interface City {
  id: string;
  name: string;
  timezone: string;
  country: string;
  coordinates: [number, number];
  lat?: number;
  lng?: number;
  airportCode?: string;
}

export const CITIES: City[] = [
  { id: 'seattle', name: 'Seattle', timezone: 'America/Los_Angeles', country: 'USA', coordinates: [-122.3321, 47.6062], lat: 47.6062, lng: -122.3321, airportCode: 'SEA' },
  { id: 'london', name: 'London', timezone: 'Europe/London', country: 'UK', coordinates: [-0.1276, 51.5074], lat: 51.5074, lng: -0.1276, airportCode: 'LHR' },
  { id: 'seoul', name: 'Seoul', timezone: 'Asia/Seoul', country: 'South Korea', coordinates: [126.9780, 37.5665], lat: 37.5665, lng: 126.9780, airportCode: 'ICN' },
  { id: 'sydney', name: 'Sydney', timezone: 'Australia/Sydney', country: 'Australia', coordinates: [151.2093, -33.8688], lat: -33.8688, lng: 151.2093, airportCode: 'SYD' },
  { id: 'tokyo', name: 'Tokyo', timezone: 'Asia/Tokyo', country: 'Japan', coordinates: [139.6503, 35.6762], lat: 35.6762, lng: 139.6503, airportCode: 'HND' },
  { id: 'new-york', name: 'New York', timezone: 'America/New_York', country: 'USA', coordinates: [-74.0060, 40.7128], lat: 40.7128, lng: -74.0060, airportCode: 'JFK' },
  { id: 'paris', name: 'Paris', timezone: 'Europe/Paris', country: 'France', coordinates: [2.3522, 48.8566], lat: 48.8566, lng: 2.3522, airportCode: 'CDG' },
  { id: 'berlin', name: 'Berlin', timezone: 'Europe/Berlin', country: 'Germany', coordinates: [13.4050, 52.5200], lat: 52.5200, lng: 13.4050, airportCode: 'BER' },
];

export function searchCities(query: string): City[] {
  const q = query.toLowerCase();
  return CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      (c.airportCode && c.airportCode.toLowerCase().includes(q))
  );
}
