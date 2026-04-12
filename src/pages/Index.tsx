import React, { useState, useEffect } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { GripVertical } from "lucide-react";
import { Header } from "@/components/Header";
import { LocalTimeDisplay } from "@/components/LocalTimeDisplay";
import { WorldClocksSection } from "@/components/WorldClocksSection";
import { WorldMapSection } from "@/components/WorldMapSection";
import { DashboardTimeline } from "@/components/DashboardTimeline";
import { useWorldClock } from "@/hooks/useWorldClock";

const SECTIONS = [
  { id: "localTime", Component: LocalTimeDisplay },
  { id: "worldClocks", Component: WorldClocksSection },
  { id: "timeline", Component: DashboardTimeline },
  { id: "worldMap", Component: WorldMapSection },
];

function SectionItem({
  id,
  Component,
}: {
  id: string;
  Component: React.ComponentType;
  key?: React.Key;
}) {
  const dragControls = useDragControls();
  const { highlightColor } = useWorldClock();

  return (
    <Reorder.Item
      value={id}
      dragListener={false}
      dragControls={dragControls}
      className="relative group w-full min-w-0"
      whileDrag={{ scale: 1.01, zIndex: 50 }}
    >
      <button
        type="button"
        onPointerDown={(e) => dragControls.start(e)}
        className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-2 hidden md:flex items-center justify-center h-full"
        style={{ touchAction: "none" }}
        aria-label="Reorder section"
      >
        <GripVertical className="h-5 w-5" style={{ color: highlightColor }} />
      </button>
      <button
        type="button"
        onPointerDown={(e) => dragControls.start(e)}
        className="sm:hidden absolute top-1 right-1 z-[5] cursor-grab active:cursor-grabbing p-1 bg-background/70 rounded-md backdrop-blur-sm"
        style={{ touchAction: "none" }}
        aria-label="Reorder section"
      >
        <GripVertical className="h-3 w-3" style={{ color: highlightColor }} />
      </button>
      <Component />
    </Reorder.Item>
  );
}

const Index = () => {
  const [order, setOrder] = useState(() => {
    const saved = localStorage.getItem("dashboard-order");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Make sure it's a valid array of the right length
        if (Array.isArray(parsed) && parsed.length === SECTIONS.length) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse order", e);
      }
    }
    return SECTIONS.map((s) => s.id);
  });

  useEffect(() => {
    localStorage.setItem("dashboard-order", JSON.stringify(order));
  }, [order]);

  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      <Header />
      <main className="w-full max-w-[1000px] mx-auto py-4 sm:py-8 px-4 sm:px-6 md:px-10 lg:px-12 box-border min-w-0">
        <Reorder.Group
          axis="y"
          values={order}
          onReorder={setOrder}
          className="grid gap-4 sm:gap-6 list-none p-0 m-0 w-full min-w-0"
        >
          {order.map((id) => {
            const section = SECTIONS.find((s) => s.id === id);
            if (!section) return null;
            return (
              <SectionItem key={id} id={id} Component={section.Component} />
            );
          })}
        </Reorder.Group>
      </main>
    </div>
  );
};

export default Index;
