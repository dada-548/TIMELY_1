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
            // Use Open-Meteo Geocoding API - more reliable and includes timezone
            const res = await fetch(
              `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`
            );
            const data = await res.json();
            
            if (data.results && data.results.length > 0) {
              const result = data.results[0];
              const { latitude, longitude, name, country, timezone } = result;

              const newCity: City = {
                id: `custom-${Date.now()}`,
                name: name || query,
                timezone: timezone || 'UTC',
                country: country || '',
                coordinates: [longitude, latitude],
                lat: latitude,
                lng: longitude
              };
              setClosestCity(newCity);
            } else {
              setClosestCity(null);
            }
          } catch (e) {
            // Silently handle fetch failures for external search to avoid console noise
            if (e instanceof Error && e.message.includes('fetch')) {
              console.warn("External city search is temporarily unavailable.");
            } else {
              console.error("Search error:", e);
            }
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

    const timer = setTimeout(search, 500);
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
              <div className="px-6 py-8 text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-muted mb-3">
                  <Search className="h-5 w-5 text-muted-foreground/60" />
                </div>
                <p className="text-sm font-medium text-foreground">No city or country found</p>
                <p className="text-xs text-muted-foreground mt-1 px-4">
                  We couldn't find any results for "{query}". Try checking the spelling or searching for a larger city.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
