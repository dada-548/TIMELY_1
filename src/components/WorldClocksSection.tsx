import { useState } from "react";
import { ChevronDown, ChevronUp, Globe, Edit2, Minimize2, Search } from "lucide-react";
import { CitySearch } from "@/components/CitySearch";
import { CityList } from "@/components/CityList";
import { useWorldClock } from "@/hooks/useWorldClock";

export function WorldClocksSection() {
  const [visible, setVisible] = useState(true);
  const { highlightColor, isEditingNames, setIsEditingNames, isCompactView, setIsCompactView, showSearchBox, setShowSearchBox } = useWorldClock();

  return (
    <div className="rounded-xl border border-border bg-card pt-4 px-5 pb-5 sm:p-6">
      <div className="w-full flex items-center justify-between mb-4">
        <button
          onClick={() => setVisible((v) => !v)}
          className="flex items-center gap-2 text-sm font-bold text-foreground hover:opacity-80 transition-opacity"
        >
          <Globe className="h-4 w-4" style={{ color: highlightColor }} />
          WORLD CLOCK
        </button>
        
        <div className="flex items-center gap-1">
          <div className="flex items-center rounded-lg border border-border overflow-hidden bg-card mr-1">
            <button
              onClick={() => setIsEditingNames(!isEditingNames)}
              className={`p-1.5 transition-colors border-r border-border ${
                isEditingNames
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              style={
                isEditingNames
                  ? { backgroundColor: `${highlightColor}25` }
                  : undefined
              }
              title={isEditingNames ? "Exit editing" : "Edit city names"}
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setIsCompactView(!isCompactView)}
              className={`p-1.5 transition-colors border-r border-border ${
                isCompactView
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              style={
                isCompactView
                  ? { backgroundColor: `${highlightColor}25` }
                  : undefined
              }
              title={isCompactView ? "Normal view" : "Compact view"}
            >
              <Minimize2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setShowSearchBox(!showSearchBox)}
              className={`p-1.5 transition-colors ${
                showSearchBox
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              style={
                showSearchBox
                  ? { backgroundColor: `${highlightColor}25` }
                  : undefined
              }
              title={showSearchBox ? "Hide search" : "Show search"}
            >
              <Search className="h-3.5 w-3.5" />
            </button>
          </div>
          
          <button 
            onClick={() => setVisible(!visible)} 
            className="p-1 px-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            {visible ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
 
      {visible && (
        <div className="space-y-4">
          {showSearchBox && <CitySearch />}
          <div className="pr-1">
            <CityList />
          </div>
        </div>
      )}
    </div>
  );
}
