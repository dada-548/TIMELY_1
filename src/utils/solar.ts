// Calculate solar terminator for day/night overlay

function toRadians(deg: number) { return deg * Math.PI / 180; }
function toDegrees(rad: number) { return rad * 180 / Math.PI; }

/**
 * Get the subsolar point (latitude, longitude where the sun is directly overhead)
 */
export function getSubsolarPoint(date: Date): { lat: number; lng: number } {
  const jd = getJulianDate(date);
  const n = jd - 2451545.0; // days since J2000
  const L = (280.460 + 0.9856474 * n) % 360; // mean longitude
  const g = toRadians((357.528 + 0.9856003 * n) % 360); // mean anomaly
  const lambda = toRadians(L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)); // ecliptic longitude
  const epsilon = toRadians(23.439 - 0.0000004 * n); // obliquity

  const declination = toDegrees(Math.asin(Math.sin(epsilon) * Math.sin(lambda)));

  // Hour angle based on UTC time
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const lng = -(utcHours - 12) * 15; // 15 degrees per hour

  return { lat: declination, lng: ((lng + 180) % 360) - 180 };
}

function getJulianDate(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

/**
 * Generate terminator polygon points for SVG overlay.
 * Returns an array of {x, y} in the range [0, mapWidth] x [0, mapHeight].
 * Uses equirectangular projection.
 */
export function getTerminatorPath(
  date: Date,
  mapWidth: number,
  mapHeight: number,
  steps: number = 180
): string {
  const { lat: sunLat, lng: sunLng } = getSubsolarPoint(date);
  const sunLatRad = toRadians(sunLat);

  const points: string[] = [];

  // Trace the terminator from -180 to 180 longitude
  for (let i = 0; i <= steps; i++) {
    const lng = -180 + (360 * i) / steps;
    const lngRad = toRadians(lng - sunLng);

    // Terminator latitude at this longitude
    const termLat = toDegrees(Math.atan(-Math.cos(lngRad) / Math.tan(sunLatRad)));

    const x = ((lng + 180) / 360) * mapWidth;
    const y = ((90 - termLat) / 180) * mapHeight;
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }

  // Close the polygon on the night side
  // If sun is in northern hemisphere, night is at bottom (south)
  if (sunLat >= 0) {
    // Night side is south: close via bottom
    points.push(`${mapWidth},${mapHeight}`);
    points.push(`0,${mapHeight}`);
  } else {
    // Night side is north: close via top
    points.push(`${mapWidth},0`);
    points.push(`0,0`);
  }

  return points.join(' ');
}

/**
 * Convert lat/lng to x/y on equirectangular projection
 */
export function latLngToXY(
  lat: number,
  lng: number,
  mapWidth: number,
  mapHeight: number
): { x: number; y: number } {
  return {
    x: ((lng + 180) / 360) * mapWidth,
    y: ((90 - lat) / 180) * mapHeight,
  };
}
