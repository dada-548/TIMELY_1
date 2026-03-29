import { Palette } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useWorldClock } from '@/hooks/useWorldClock';

const PRESET_COLORS = [
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Purple', value: '#8b5cf6' },
  { label: 'Pink', value: '#ec4899' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Green', value: '#22c55e' },
  { label: 'Teal', value: '#14b8a6' },
  { label: 'Cyan', value: '#06b6d4' },
];

interface ColorRowProps {
  label: string;
  color: string;
  onChange: (color: string) => void;
}

function ColorRow({ label, color, onChange }: ColorRowProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <input
          type="color"
          value={color}
          onChange={e => onChange(e.target.value)}
          className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
        />
      </div>
      <div className="flex gap-1">
        {PRESET_COLORS.map(c => (
          <button
            key={c.value}
            onClick={() => onChange(c.value)}
            className={`w-5 h-5 rounded-full border hover:scale-110 ${
              color === c.value ? 'border-foreground scale-110' : 'border-transparent'
            }`}
            style={{ backgroundColor: c.value }}
            title={c.label}
          />
        ))}
      </div>
    </div>
  );
}

export function ColorSettingsMenu() {
  const { 
    highlightColor, setHighlightColor,
    timelineHighlightColor, setTimelineHighlightColor,
    dayIndicationColor, setDayIndicationColor
  } = useWorldClock();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="h-9 w-9 flex items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary"
        aria-label="Color settings"
      >
        <Palette className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 right-0 z-50 bg-card border border-border rounded-xl p-4 shadow-lg w-64">
          <p className="text-xs font-semibold text-foreground mb-4">Color Settings</p>
          
          <div className="space-y-4">
            <ColorRow 
              label="Accent Color" 
              color={highlightColor} 
              onChange={setHighlightColor} 
            />
            
            <div className="border-t border-border" />
            
            <ColorRow 
              label="Timeline Highlight" 
              color={timelineHighlightColor} 
              onChange={setTimelineHighlightColor} 
            />
            
            <div className="border-t border-border" />
            
            <ColorRow 
              label="Day Indicator" 
              color={dayIndicationColor} 
              onChange={setDayIndicationColor} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
