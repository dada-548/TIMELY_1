import React, { useState, useRef, useEffect } from "react";
import { City } from "@/data/cities";
import { useClock } from "@/hooks/useClock";
import {
  formatTime,
  formatDate,
  getUTCOffset,
  getDiffFromLocal,
  getTimeOfDay,
  isDSTActive,
  observesDST,
  getTimezoneAbbreviation,
} from "@/utils/timezone";
import { getCountryInfo } from "@/utils/country";
import { useWorldClock } from "@/hooks/useWorldClock";
import { useIsMobile, useIsMobileDevice } from "@/hooks/use-mobile";
import { X, GripVertical, Sun, Moon, Sunrise, Sunset, Trash2 } from "lucide-react";
import {
  motion,
  AnimatePresence,
  Reorder,
  useDragControls,
  useMotionValue,
  useTransform,
  useAnimation,
} from "motion/react";

function TimeOfDayIcon({ tod }: { tod: string }) {
  switch (tod) {
    case "day":
      return <Sun className="h-4 w-4 text-dayicon" />;
    case "afternoon":
      return <Sun className="h-4 w-4 text-dayicon" />;
    case "night":
      return <Moon className="h-4 w-4 text-nighticon" />;
    case "dawn":
      return <Sunrise className="h-4 w-4 text-sunriseicon" />;
    case "dusk":
      return <Sunset className="h-4 w-4 text-sunseticon" />;
    default:
      return null;
  }
}

function CityCard({ city, index }: { city: City; index: number; key?: React.Key }) {
  const now = useClock();
  const isMobile = useIsMobile();
  const isMobileDevice = useIsMobileDevice();
  const { 
    removeCity, 
    updateCityName, 
    highlightColor, 
    use24h, 
    dayIndicationColor,
    isEditingNames,
    isCompactView,
    theme
  } = useWorldClock();
  const cardRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [tempName, setTempName] = useState(city.customName || city.name);
  const [isSwiping, setIsSwiping] = useState(false);
  
  const controls = useAnimation();
  const x = useMotionValue(0);
  const bgOpacity = useTransform(x, [0, -10, -60], [0, 0, 1]);
  const clipPath = useTransform(x, (v) => `inset(0 0 0 calc(100% + ${v}px))`);
  
  const editInputRef = useRef<HTMLInputElement>(null);
  const prevIsEditing = useRef(isEditingNames);
  
  const dragControls = useDragControls();
  const tod = getTimeOfDay(city.timezone, now);
  const isNight = tod === "night";
  const isDaylight = tod === "dawn" || tod === "day" || tod === "afternoon";
  const isDark = theme === "dark";

  const getBgClass = () => {
    if (!isDark) {
      if (isNight) return "bg-night/10";
      return "bg-card";
    } else {
      if (isDaylight) return "bg-white/5";
      return "bg-card";
    }
  };

  const isLightMorning = isDark && isDaylight;
  const cardTextClass = "text-foreground";
  const cardMutedTextClass = "text-muted-foreground";

  const diff = getDiffFromLocal(city.timezone, now);
  const countryInfo = getCountryInfo(city.country);

  useEffect(() => {
    // Focus when entering edit mode - only for the first item to avoid focus fighting
    if (isEditingNames && !prevIsEditing.current && index === 0) {
      setTempName(city.customName || city.name);
      // Wait for re-render to focus
      setTimeout(() => {
        if (editInputRef.current) {
          editInputRef.current.focus();
          editInputRef.current.select();
        }
      }, 0);
    }
    
    // Save when exiting edit mode
    if (prevIsEditing.current && !isEditingNames) {
      if (tempName.trim() && tempName.trim() !== (city.customName || city.name)) {
        updateCityName(city.id, tempName.trim());
      }
    }
    prevIsEditing.current = isEditingNames;
  }, [isEditingNames, tempName, city.id, city.name, city.customName, updateCityName, index]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (tempName.trim()) {
        updateCityName(city.id, tempName.trim());
      }
    }
  };

  return (
    <Reorder.Item
      ref={cardRef}
      value={city}
      dragListener={false}
      dragControls={dragControls}
      className="relative overflow-hidden group/card rounded-xl border border-border"
      whileDrag={{ scale: 1.02, zIndex: 50 }}
    >
      {/* Delete background for swipe */}
      {isMobileDevice && (
        <motion.div 
          style={{ opacity: bgOpacity, clipPath }}
          className="absolute inset-0 bg-destructive flex items-center justify-end pr-8 text-destructive-foreground"
        >
          <Trash2 className="h-5 w-5" />
        </motion.div>
      )}

      <motion.div
        drag={isMobileDevice ? "x" : false}
        dragConstraints={{ left: cardRef.current ? -cardRef.current.offsetWidth : -300, right: 0 }}
        dragElastic={0.05}
        dragTransition={{ bounceStiffness: 600, bounceDampening: 30 }}
        style={{ x }}
        animate={controls}
        onDragStart={() => setIsSwiping(true)}
        onDragEnd={(_, info) => {
          setIsSwiping(false);
          const currentWidth = cardRef.current?.offsetWidth || 300;
          const threshold = -currentWidth / 2;

          // Trigger remove if swiped more than half width
          if (info.offset.x < threshold) {
            removeCity(city.id);
          } else {
            // Snap back naturally
            controls.start({ x: 0, transition: { type: "spring", stiffness: 500, damping: 40 } });
          }
        }}
        className={`relative z-10 flex items-center gap-2 sm:gap-3 p-3 sm:p-4 ${getBgClass()} h-full w-full`}
      >
        <button
          type="button"
          onPointerDown={(e) => dragControls.start(e)}
          className="h-6 w-6 flex items-center justify-center opacity-0 group-hover/card:opacity-100 sm:flex hidden cursor-grab active:cursor-grabbing flex-shrink-0 transition-opacity"
          style={{ touchAction: "none" }}
          aria-label={`Reorder ${city.customName || city.name}`}
        >
          <GripVertical className="h-4 w-4" style={{ color: `${highlightColor}80` }} />
        </button>
        <button
          type="button"
          onPointerDown={(e) => dragControls.start(e)}
          className="h-5 w-5 flex items-center justify-center sm:hidden flex-shrink-0 cursor-grab active:cursor-grabbing"
          style={{ touchAction: "none" }}
          aria-label={`Reorder ${city.customName || city.name}`}
        >
          <GripVertical
            className="h-3.5 w-3.5"
            style={{ color: `${highlightColor}80` }}
          />
        </button>
        
        <div className="flex-1 min-w-0 flex items-center justify-between gap-2 sm:gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1 relative group/name">
                <div className="sm:flex sm:items-baseline sm:gap-2 sm:flex-nowrap">
                  {isEditingNames ? (
                    <input
                      ref={editInputRef}
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="bg-background border rounded px-2 py-1 font-semibold text-base sm:text-sm focus:outline-none focus:ring-2 transition-all min-w-[140px] max-w-full"
                      style={{ 
                        borderColor: highlightColor,
                        boxShadow: `0 0 0 2px ${highlightColor}20`
                      }}
                    />
                  ) : (
                    <button
                      onClick={() => !isSwiping && setExpanded(!expanded)}
                      className="text-left min-w-0 flex-1"
                    >
                      <span className={`font-semibold truncate text-sm sm:text-base ${cardTextClass}`}>
                        {city.customName || city.name}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
            {!isCompactView && (
              <div className="flex flex-col mt-0.5">
                <span className={`text-[10px] sm:text-xs whitespace-nowrap ${cardMutedTextClass}`}>
                  <span className="hidden md:inline">{countryInfo.full}</span>
                  <span className="md:hidden">{countryInfo.short}</span>
                </span>
                <button 
                  onClick={() => !isSwiping && setExpanded(!expanded)}
                  className="flex items-center gap-2 mt-0.5 text-left w-full"
                >
                  <span className={`text-[10px] sm:text-xs ${cardMutedTextClass}`}>
                    {diff.timeDiff}
                  </span>
                  {diff.dayOffset !== 0 && (
                    <span
                      className="text-[10px] sm:text-xs font-semibold"
                      style={{ color: dayIndicationColor }}
                    >
                      {diff.dayOffset > 0
                        ? `+${diff.dayOffset}d`
                        : `${diff.dayOffset}d`}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
          <button 
            onClick={() => !isSwiping && setExpanded(!expanded)}
            className="flex items-center gap-2 sm:gap-3 flex-shrink-0"
          >
            <TimeOfDayIcon tod={tod} />
            <span className={`text-lg sm:text-2xl font-mono font-semibold tabular-nums ${cardTextClass}`}>
              {formatTime(city.timezone, now, use24h)}
            </span>
          </button>
        </div>

        {!isMobileDevice && (
          <button
            onClick={() => removeCity(city.id)}
            className={`opacity-0 group-hover/card:opacity-100 hover:text-destructive flex-shrink-0 ml-1 p-2 -m-1 transition-opacity ${cardMutedTextClass}`}
          >
            <X className="h-4 w-4" style={{ color: `${highlightColor}80` }} />
          </button>
        )}
      </motion.div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden bg-card/10 border-t border-border"
          >
            <div className="p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm pl-8">
              {isCompactView && (
                <>
                  <div>
                    <span className={`text-xs ${cardMutedTextClass}`}>Country</span>
                    <p className={`font-medium truncate ${cardTextClass}`}>
                      {countryInfo.full}
                    </p>
                  </div>
                  <div>
                    <span className={`text-xs ${cardMutedTextClass}`}>Relative Time</span>
                    <p className={`font-medium ${cardTextClass}`}>
                      {diff.timeDiff} 
                      {diff.dayOffset !== 0 && (
                        <span className="ml-1 text-[#ef4444]">
                          ({diff.dayOffset > 0 ? `+${diff.dayOffset}d` : `${diff.dayOffset}d`})
                        </span>
                      )}
                    </p>
                  </div>
                </>
              )}
              <div>
                <span className={`text-xs ${cardMutedTextClass}`}>Date</span>
                <p className={`font-medium ${cardTextClass}`}>
                  {formatDate(city.timezone, now)}
                </p>
              </div>
              <div>
                <span className={`text-xs ${cardMutedTextClass}`}>
                  UTC Offset
                </span>
                <p className={`font-medium ${cardTextClass}`}>
                  {getUTCOffset(city.timezone, now)}
                </p>
              </div>
              <div>
                <span className={`text-xs ${cardMutedTextClass}`}>
                  Abbreviation
                </span>
                <p className={`font-medium ${cardTextClass}`}>
                  {getTimezoneAbbreviation(city.timezone, now)}
                </p>
              </div>
              <div>
                <span className={`text-xs ${cardMutedTextClass}`}>DST</span>
                <p className={`font-medium ${cardTextClass}`}>
                  {observesDST(city.timezone)
                    ? isDSTActive(city.timezone)
                      ? "☀️ Active"
                      : "❄️ Inactive"
                    : "Not observed"}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Reorder.Item>
  );
}

export function CityList() {
  const { selectedCities, reorderCities } = useWorldClock();

  if (selectedCities.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">No cities added yet</p>
        <p className="text-sm mt-1">Search and add cities above</p>
      </div>
    );
  }

  return (
    <Reorder.Group
      axis="y"
      values={selectedCities}
      onReorder={reorderCities}
      className="space-y-2 list-none p-0 m-0"
    >
      {selectedCities.map((city, index) => (
        <CityCard key={city.id} city={city} index={index} />
      ))}
    </Reorder.Group>
  );
}
