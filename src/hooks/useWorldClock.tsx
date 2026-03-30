import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { City, CITIES } from '@/data/cities';

export type TimelineMode = 'default' | 'tod' | 'friendly' | 'working';

interface WorldClockState {
  selectedCities: City[];
  addCity: (city: City) => void;
  removeCity: (cityId: string) => void;
  reorderCities: (cities: City[]) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  highlightColor: string;
  setHighlightColor: (color: string) => void;
  timelineHighlightColor: string;
  setTimelineHighlightColor: (color: string) => void;
  dayIndicationColor: string;
  setDayIndicationColor: (color: string) => void;
  use24h: boolean;
  setUse24h: (val: boolean) => void;
  timelineMode: TimelineMode;
  setTimelineMode: (mode: TimelineMode) => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  selectedHour: number;
  setSelectedHour: (hour: number) => void;
  duration: number;
  setDuration: (duration: number) => void;
  fromCityIdx: number;
  setFromCityIdx: (idx: number) => void;
}

const WorldClockContext = createContext<WorldClockState | null>(null);

const DEFAULT_CITY_IDS = ['seattle', 'london', 'seoul', 'sydney'];

export function WorldClockProvider({ children }: { children: React.ReactNode }) {
  const [selectedCities, setSelectedCities] = useState<City[]>(() => {
    const saved = localStorage.getItem('worldclock-cities');
    if (saved) {
      try {
        const ids: string[] = JSON.parse(saved);
        return ids.map(id => CITIES.find(c => c.id === id)).filter(Boolean) as City[];
      } catch { /* ignore */ }
    }
    return DEFAULT_CITY_IDS.map(id => CITIES.find(c => c.id === id)!);
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('worldclock-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [highlightColor, setHighlightColorState] = useState<string>(() => {
    return localStorage.getItem('worldclock-highlight') || '#3b82f6';
  });

  const [timelineHighlightColor, setTimelineHighlightColorState] = useState<string>(() => {
    return localStorage.getItem('worldclock-timeline-highlight') || '#10b981';
  });

  const [dayIndicationColor, setDayIndicationColorState] = useState<string>(() => {
    return localStorage.getItem('worldclock-day-indication') || '#cf8b17';
  });

  const [use24h, setUse24hState] = useState<boolean>(() => {
    return localStorage.getItem('worldclock-use24h') !== 'false'; // default true
  });

  const [timelineMode, setTimelineModeState] = useState<TimelineMode>(() => {
    return (localStorage.getItem('worldclock-timeline-mode') as TimelineMode) || 'default';
  });

  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedHour, setSelectedHour] = useState(() => new Date().getHours());
  const [duration, setDuration] = useState(1);
  const [fromCityIdx, setFromCityIdx] = useState(0);

  const setUse24h = useCallback((val: boolean) => {
    setUse24hState(val);
    localStorage.setItem('worldclock-use24h', String(val));
  }, []);

  const setTimelineMode = useCallback((mode: TimelineMode) => {
    setTimelineModeState(mode);
    localStorage.setItem('worldclock-timeline-mode', mode);
  }, []);

  const setHighlightColor = useCallback((color: string) => {
    const update = () => {
      setHighlightColorState(color);
      localStorage.setItem('worldclock-highlight', color);
    };
    if (!(document as any).startViewTransition) {
      update();
    } else {
      (document as any).startViewTransition(update);
    }
  }, []);

  const setTimelineHighlightColor = useCallback((color: string) => {
    const update = () => {
      setTimelineHighlightColorState(color);
      localStorage.setItem('worldclock-timeline-highlight', color);
    };
    if (!(document as any).startViewTransition) {
      update();
    } else {
      (document as any).startViewTransition(update);
    }
  }, []);

  const setDayIndicationColor = useCallback((color: string) => {
    const update = () => {
      setDayIndicationColorState(color);
      localStorage.setItem('worldclock-day-indication', color);
    };
    if (!(document as any).startViewTransition) {
      update();
    } else {
      (document as any).startViewTransition(update);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('worldclock-cities', JSON.stringify(selectedCities.map(c => c.id)));
  }, [selectedCities]);

  useEffect(() => {
    localStorage.setItem('worldclock-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    
    // Update status bar theme-color to match current mode
    const color = theme === 'dark' ? '#0f172a' : '#ffffff';
    
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', color);
  }, [theme]);

  const addCity = useCallback((city: City) => {
    setSelectedCities(prev => {
      if (prev.find(c => c.id === city.id)) return prev;
      return [...prev, city];
    });
  }, []);

  const removeCity = useCallback((cityId: string) => {
    setSelectedCities(prev => prev.filter(c => c.id !== cityId));
  }, []);

  const reorderCities = useCallback((cities: City[]) => {
    setSelectedCities(cities);
  }, []);

  const toggleTheme = useCallback(() => {
    const update = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    if (!(document as any).startViewTransition) {
      update();
    } else {
      (document as any).startViewTransition(update);
    }
  }, []);

  return (
    <WorldClockContext.Provider value={{ 
      selectedCities, addCity, removeCity, reorderCities, 
      theme, toggleTheme, 
      highlightColor, setHighlightColor,
      timelineHighlightColor, setTimelineHighlightColor,
      dayIndicationColor, setDayIndicationColor,
      use24h, setUse24h,
      timelineMode, setTimelineMode,
      selectedDate, setSelectedDate,
      selectedHour, setSelectedHour,
      duration, setDuration,
      fromCityIdx, setFromCityIdx
    }}>
      {children}
    </WorldClockContext.Provider>
  );
}

export function useWorldClock() {
  const ctx = useContext(WorldClockContext);
  if (!ctx) throw new Error('useWorldClock must be used within WorldClockProvider');
  return ctx;
}
