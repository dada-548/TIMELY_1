import { useState } from "react";
import { ChevronDown, ChevronUp, Globe } from "lucide-react";
import { CitySearch } from "@/components/CitySearch";
import { CityList } from "@/components/CityList";
import { useWorldClock } from "@/hooks/useWorldClock";

export function WorldClocksSection() {
  const [visible, setVisible] = useState(true);
  const { highlightColor } = useWorldClock();

  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        onClick={() => setVisible((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-foreground hover:bg-secondary/50 rounded-xl"
      >
        <span className="flex items-center gap-2">
          <Globe className="h-4 w-4" style={{ color: highlightColor }} />
          WORLD CLOCK
        </span>
        {visible ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {visible && (
        <div className="px-4 pb-4 space-y-4">
          <CitySearch />
          <div className="pr-1">
            <CityList />
          </div>
        </div>
      )}
    </div>
  );
}
