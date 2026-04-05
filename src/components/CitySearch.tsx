import React, { useState, useRef, useEffect } from "react";
import { Search, Plus, X, Globe, MapPin } from "lucide-react";
import { City, searchCities, CITIES } from "@/data/cities";
import { useWorldClock } from "@/hooks/useWorldClock";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

export function CitySearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<City[]>([]);
  const [closestCity, setClosestCity] = useState<City | null>(null);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const { addCity, selectedCities, highlightColor } = useWorldClock();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    const search = async () => {
      if (query.length > 0) {
        const localResults = searchCities(query).filter(
          (c) => !selectedCities.find((sc) => sc.id === c.id),
        );
        
        setResults(localResults);
        setOpen(true);

        if (localResults.length === 0 && query.length > 2) {
          setSearching(true);
          try {
            // 1. Get coordinates from Nominatim
            const res = await fetch(
              `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
            );
            const data = await res.json();
            
            if (data && data.length > 0) {
              const { lat, lon, display_name } = data[0];
              const searchLat = parseFloat(lat);
              const searchLon = parseFloat(lon);

              // 2. Get timezone from Teleport
              const teleportRes = await fetch(`https://api.teleport.org/api/locations/${searchLat},${searchLon}/`);
              const teleportData = await teleportRes.json();
              const cityHref = teleportData._embedded['location:nearest-cities']?.[0]?._links['location:nearest-city']?.href;
              
              if (cityHref) {
                const cityDataRes = await fetch(cityHref);
                const cityData = await cityDataRes.json();
                const urbanAreaHref = cityData._links['city:urban_area']?.href;
                
                let timezone = 'UTC';
                if (urbanAreaHref) {
                  const uaRes = await fetch(urbanAreaHref);
                  const uaData = await uaRes.json();
                  const tzRes = await fetch(uaData._links['ua:timezone']?.href);
                  const tzData = await tzRes.json();
                  timezone = tzData.iana_name;
                }

                const newCity: City = {
                  id: `custom-${Date.now()}`,
                  name: cityData.name || query,
                  timezone: timezone,
                  country: display_name.split(',').pop()?.trim() || '',
                  coordinates: [searchLon, searchLat],
                  lat: searchLat,
                  lng: searchLon
                };
                setClosestCity(newCity);
              } else {
                // Fallback to closest city in our database
                let minDistance = Infinity;
                let nearest: City | null = null;

                CITIES.forEach(city => {
                  if (selectedCities.find(sc => sc.id === city.id)) return;
                  const dist = calculateDistance(searchLat, searchLon, city.lat || city.coordinates[1], city.lng || city.coordinates[0]);
                  if (dist < minDistance) {
                    minDistance = dist;
                    nearest = city;
                  }
                });
                setClosestCity(nearest);
              }
            } else {
              setClosestCity(null);
            }
          } catch (e) {
            console.error("Search error", e);
            setClosestCity(null);
          } finally {
            setSearching(false);
          }
        } else {
          setClosestCity(null);
        }
      } else {
        setResults([]);
        setClosestCity(null);
        setOpen(false);
      }
    };

    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [query, selectedCities]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAdd = (city: City) => {
    addCity(city);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search cities or time zones"
          className="h-10 w-full rounded-lg border border-border bg-card pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2"
          style={
            { "--tw-ring-color": `${highlightColor}4d` } as React.CSSProperties
          }
        />
        {query && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {searching && (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            )}
            <button
              onClick={() => {
                setQuery("");
                setOpen(false);
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      <AnimatePresence>
        {open && (results.length > 0 || closestCity || searching) && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-lg overflow-hidden max-h-[400px] overflow-y-auto"
          >
            {results.length > 0 ? (
              results.map((city) => {
                const isTz = city.id.startsWith('tz-');
                return (
                  <button
                    key={city.id}
                    onClick={() => handleAdd(city)}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-secondary text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-md bg-muted group-hover:bg-background transition-colors">
                        {isTz ? (
                          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">
                          {city.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                          <span>{city.country}</span>
                          {city.airportCode && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-border" />
                              <span className="font-mono uppercase">{city.airportCode}</span>
                            </>
                          )}
                          {isTz && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-border" />
                              <span className="text-[9px] font-mono opacity-70">{city.timezone}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <Plus className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: highlightColor }} />
                  </button>
                );
              })
            ) : searching ? (
              <div className="px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Searching for closest city...
              </div>
            ) : closestCity ? (
              <div className="flex flex-col">
                <div className="px-4 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/30">
                  No direct match found. Closest city:
                </div>
                <button
                  onClick={() => handleAdd(closestCity)}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-secondary text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-muted group-hover:bg-background transition-colors">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        {closestCity.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                        <span>{closestCity.country}</span>
                        {closestCity.airportCode && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-border" />
                            <span className="font-mono uppercase">{closestCity.airportCode}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <Plus className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: highlightColor }} />
                </button>
              </div>
            ) : (
              <div className="px-4 py-3 text-sm text-muted-foreground">
                No cities found.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
