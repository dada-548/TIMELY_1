import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { useWorldClock } from "@/hooks/useWorldClock";

interface DurationSelectorProps {
  duration: number;
  onChangeDuration: (d: number) => void;
}

const DURATIONS = [
  { label: "30m", value: 0.5 },
  { label: "1h", value: 1 },
  { label: "1.5h", value: 1.5 },
  { label: "2h", value: 2 },
];

export function DurationSelector({
  duration,
  onChangeDuration,
}: DurationSelectorProps) {
  const { highlightColor } = useWorldClock();

  // ✅ Move useState inside the component
  const [resetFlash, setResetFlash] = useState(false);

  // ✅ Click handler also inside the component
  const handleResetClick = () => {
    setResetFlash(true);
    onChangeDuration(1);

    setTimeout(() => setResetFlash(false), 500);
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground">Duration:</span>

      <button
        onClick={handleResetClick}
        title="Reset to 1h"
        className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-foreground hover:bg-secondary border border-border bg-card flex items-center gap-1.5"
        style={{
          borderColor: resetFlash ? highlightColor : undefined,
          backgroundColor: resetFlash ? `${highlightColor}20` : undefined,
          boxShadow: resetFlash ? `0 0 8px ${highlightColor}40` : undefined,
        }}
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </button>

      {DURATIONS.map((d) => (
        <button
          key={d.value}
          onClick={() => onChangeDuration(d.value)}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border ${
            duration === d.value
              ? "text-foreground"
              : "border-border bg-card text-foreground hover:bg-secondary"
          }`}
          style={
            duration === d.value
              ? {
                  backgroundColor: `${highlightColor}25`,
                  borderColor: `${highlightColor}66`,
                }
              : undefined
          }
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}
