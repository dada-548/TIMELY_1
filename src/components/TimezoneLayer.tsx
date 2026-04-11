import { useEffect, useState } from "react";
import { geoPath, geoMercator } from "d3-geo";

export default function TimezoneLayer() {
  const [geoData, setGeoData] = useState<any>(null);

  useEffect(() => {
    fetch("/data/timezones.geojson")
      .then((res) => res.json())
      .then(setGeoData);
  }, []);

  if (!geoData) return null;

  const projection = geoMercator().scale(140).translate([400, 250]);

  const pathGenerator = geoPath().projection(projection);

  return (
    <g>
      {geoData.features.map((feature: any, i: number) => (
        <path
          key={i}
          d={pathGenerator(feature) || ""}
          fill="rgba(255,255,255,0.05)"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={0.5}
        />
      ))}
    </g>
  );
}
