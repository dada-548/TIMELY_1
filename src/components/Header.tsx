import { Globe, Sun, Moon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useWorldClock } from "@/hooks/useWorldClock";
import { motion } from "framer-motion";
import { ColorSettingsMenu } from "@/components/planner/ColorSettingsMenu";

const navItems = [
  { path: "/", label: "DASHBOARD" },
  { path: "/planner", label: "TIMELINE" },
];

export function Header() {
  const { theme, toggleTheme, highlightColor } = useWorldClock();
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
      <div className="w-full max-w-5xl mx-auto flex h-14 items-center justify-between px-3 sm:px-6">
        <div className="flex items-center gap-3 sm:gap-8">
          <Link to="/" className="flex items-center gap-2">
            <Globe className="h-5 w-5" style={{ color: highlightColor }} />
            <span className="text-base font-semibold tracking-tight hidden sm:inline">
              TIMELY
            </span>
          </Link>
          <nav className="flex items-center gap-0.5">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`relative px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg ${
                  location.pathname === item.path
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {location.pathname === item.path && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-lg bg-secondary"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ColorSettingsMenu />
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
