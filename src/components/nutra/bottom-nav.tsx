"use client";

import React from "react";
import { Plus, CalendarDays, ClipboardList, TrendingUp, Dumbbell } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import type { DictKey } from "@/lib/i18n";
import type { TabId } from "@/lib/types";
import { cn } from "@/lib/utils";

const TABS: { id: TabId; icon: React.ElementType; key: DictKey }[] = [
  { id: "today", icon: CalendarDays, key: "tab_today" },
  { id: "log", icon: ClipboardList, key: "tab_log" },
  { id: "progress", icon: TrendingUp, key: "tab_progress" },
  { id: "workouts", icon: Dumbbell, key: "tab_workouts" },
];

/** Bottom tab bar with floating center + FAB (Settings lives in the header) */
export function BottomNav() {
  const { t } = useI18n();
  const tab = useAppStore((s) => s.tab);
  const setTab = useAppStore((s) => s.setTab);
  const openSheet = useAppStore((s) => s.openSheet);

  return (
    <nav aria-label="Main navigation" className="fixed bottom-0 inset-x-0 z-40">
      {/* tab bar */}
      <div className="bg-card/92 backdrop-blur-xl border-t border-border">
        <div className="mx-auto max-w-md grid grid-cols-5 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2">
          {TABS.slice(0, 2).map((tb) => (
            <TabButton
              key={tb.id}
              icon={tb.icon}
              label={t(tb.key)}
              active={tab === tb.id}
              onClick={() => setTab(tb.id)}
            />
          ))}
          {/* center spacer reserved for the FAB */}
          <div aria-hidden />
          {TABS.slice(2).map((tb) => (
            <TabButton
              key={tb.id}
              icon={tb.icon}
              label={t(tb.key)}
              active={tab === tb.id}
              onClick={() => setTab(tb.id)}
            />
          ))}
        </div>
      </div>

      {/* FAB — after the bar in DOM so it paints above it */}
      <button
        onClick={() => openSheet("quick-add")}
        aria-label={t("quick_add")}
        className="absolute -top-7 left-1/2 -translate-x-1/2 size-14 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/35 ring-4 ring-background/70 active:scale-90 transition-transform flex items-center justify-center"
      >
        <Plus className="size-7" strokeWidth={2.5} />
      </button>
    </nav>
  );
}

function TabButton({
  icon: Icon,
  active,
  onClick,
  label,
}: {
  icon: React.ElementType;
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-2xl transition-colors",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="size-[22px]" strokeWidth={active ? 2.4 : 2} />
      <span className="text-[10px] font-semibold">{label}</span>
    </button>
  );
}
