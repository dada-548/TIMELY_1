import React from 'react';
import { useClock } from '@/hooks/useClock';
import { useWorldClock } from '@/hooks/useWorldClock';
import { getHourInTimezone, getLocalTimezone, isWorkingHour, getTimeInTimezone } from '@/utils/timezone';

export function TimelineOverlap() {
  const now = useClock();
  const { selectedCities, highlightColor } = useWorldClock();
  const localTz = getLocalTimezone();
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const currentLocalHour = getTimeInTimezone(localTz, now).getHours();

  if (selectedCities.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6 overflow-x-auto">
      <h3 className="text-sm font-semibold text-foreground mb-4">Time Overlap</h3>
      <div className="min-w-[700px]">
        {/* Hour labels */}
        <div className="flex items-center mb-1">
          <div className="w-24 sm:w-32 flex-shrink-0" />
          <div className="flex-1 flex">
            {hours.map(h => (
              <div key={h} className="flex-1 text-center">
                <span 
                  className={`text-[10px] font-mono ${
                    h === currentLocalHour ? 'font-bold' : 'text-muted-foreground'
                  }`}
                  style={h === currentLocalHour ? { color: highlightColor } : undefined}
                >
                  {h.toString().padStart(2, '0')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* City rows */}
        {selectedCities.map(city => {
          return (
            <div key={city.id} className="flex items-center mb-1">
              <div className="w-24 sm:w-32 flex-shrink-0 pr-2">
                <span className="text-xs font-medium text-foreground truncate block">{city.name}</span>
              </div>
              <div className="flex-1 flex gap-px">
                {hours.map(localHour => {
                  const cityHour = getHourInTimezone(city.timezone, localTz, localHour, now);
                  const working = isWorkingHour(cityHour);
                  const isCurrent = localHour === currentLocalHour;
                  return (
                    <div
                      key={localHour}
                      className={`flex-1 h-6 rounded-sm ${
                        working
                          ? 'working-hour-cell-active'
                          : 'bg-muted/50'
                      } ${isCurrent ? 'ring-1' : ''}`}
                      style={isCurrent ? { '--tw-ring-color': highlightColor } as React.CSSProperties : undefined}
                      title={`${city.name}: ${cityHour}:00 ${working ? '(Working)' : ''}`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Overlap row */}
        {selectedCities.length >= 2 && (
          <div className="flex items-center mt-2 pt-2 border-t border-border">
            <div className="w-24 sm:w-32 flex-shrink-0 pr-2">
              <span className="text-xs font-medium text-working">Overlap</span>
            </div>
            <div className="flex-1 flex gap-px">
              {hours.map(localHour => {
                const allWorking = selectedCities.every(city => {
                  const h = getHourInTimezone(city.timezone, localTz, localHour, now);
                  return isWorkingHour(h);
                });
                return (
                  <div
                    key={localHour}
                    className={`flex-1 h-6 rounded-sm ${
                      allWorking ? 'overlap-cell' : 'bg-transparent'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm working-hour-cell-active" />
            <span className="text-[10px] text-muted-foreground">Working (9-5)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm overlap-cell" />
            <span className="text-[10px] text-muted-foreground">All overlap</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-muted/50" />
            <span className="text-[10px] text-muted-foreground">Off hours</span>
          </div>
        </div>
      </div>
    </div>
  );
}
