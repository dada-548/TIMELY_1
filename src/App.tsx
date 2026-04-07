import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WorldClockProvider } from "@/hooks/useWorldClock";
import Index from "./pages/Index";
import MeetingPlanner from "./pages/MeetingPlanner";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
    if (
      !document.documentElement.classList.contains("dark") &&
      !document.documentElement.classList.contains("light")
    ) {
      if (prefersDark.matches) {
        document.documentElement.classList.add("dark");
      }
    }

    const updateThemeColor = () => {
      const isDark = document.documentElement.classList.contains("dark");
      let meta = document.querySelector('meta[name="theme-color"]:not([media])');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "theme-color");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", isDark ? "#0f172a" : "#ffffff");
    };

    updateThemeColor();

    const observer = new MutationObserver(updateThemeColor);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WorldClockProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/planner" element={<MeetingPlanner />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </WorldClockProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
