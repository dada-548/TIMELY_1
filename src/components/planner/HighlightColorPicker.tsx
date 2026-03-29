import { Palette } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

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

interface HighlightColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

export function HighlightColorPicker({ color, onChange }: HighlightColorPickerProps) {
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
        className="h-8 flex items-center gap-1.5 px-2.5 rounded-lg border border-border bg-card text-sm text-foreground hover:bg-secondary"
      >
        <div className="w-3.5 h-3.5 rounded-full border border-border" style={{ backgroundColor: color }} />
        <Palette className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 left-0 z-50 bg-card border border-border rounded-xl p-3 shadow-lg">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-2">Highlight Color</p>
          <div className="grid grid-cols-5 gap-1.5">
            {PRESET_COLORS.map(c => (
              <button
                key={c.value}
                onClick={() => { onChange(c.value); setOpen(false); }}
                className={`w-7 h-7 rounded-full border-2 hover:scale-110 ${
                  color === c.value ? 'border-foreground scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: c.value }}
                title={c.label}
              />
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-border flex items-center gap-2">
            <label className="text-[10px] text-muted-foreground">Custom:</label>
            <input
              type="color"
              value={color}
              onChange={e => onChange(e.target.value)}
              className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
            />
          </div>
        </div>
      )}
    </div>
  );
}
