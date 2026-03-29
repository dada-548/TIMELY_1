import React, { useState, useRef, useEffect } from "react";
import { Search, Plus, X } from "lucide-react";
import { City, searchCities } from "@/data/cities";
import { useWorldClock } from "@/hooks/useWorldClock";
import { motion, AnimatePresence } from "framer-motion";

export function CitySearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<City[]>([]);
  const [open, setOpen] = useState(false);
  const { addCity, selectedCities, highlightColor } = useWorldClock();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length > 0) {
      setResults(
        searchCities(query).filter(
          (c) => !selectedCities.find((sc) => sc.id === c.id),
        ),
      );
      setOpen(true);
    } else {
      setResults([]);
      setOpen(false);
    }
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
          placeholder="Search cities"
          className="h-10 w-full rounded-lg border border-border bg-card pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2"
          style={
            { "--tw-ring-color": `${highlightColor}4d` } as React.CSSProperties
          }
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-lg overflow-hidden"
          >
            {results.map((city) => (
              <button
                key={city.id}
                onClick={() => handleAdd(city)}
                className="flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-secondary text-left"
              >
                <div>
                  <span className="font-medium text-foreground">
                    {city.name}
                  </span>
                  <span className="ml-2 text-muted-foreground">
                    {city.country}
                  </span>
                  {city.airportCode && (
                    <span className="ml-2 text-xs text-muted-foreground font-mono">
                      ({city.airportCode})
                    </span>
                  )}
                </div>
                <Plus className="h-4 w-4" style={{ color: highlightColor }} />
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
