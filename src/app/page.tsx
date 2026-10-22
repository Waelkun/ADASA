"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Settings, Moon, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";
import { useI18n } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import { useToday } from "@/lib/api";
import type { PendingFood, ScanResult } from "@/lib/types";
import { BottomNav } from "@/components/nutra/bottom-nav";
import { TodayScreen } from "@/components/nutra/screens/today";
import { LogScreen } from "@/components/nutra/screens/log";
import { ProgressScreen } from "@/components/nutra/screens/progress";
import { WorkoutsScreen } from "@/components/nutra/screens/workouts";
import { SettingsScreen } from "@/components/nutra/screens/settings";
import { QuickAddSheet, WaterSheet, WeightSheet } from "@/components/nutra/sheets/quick-sheets";
import { WorkoutSheet } from "@/components/nutra/sheets/workout-sheet";
import { ScanSheet } from "@/components/nutra/sheets/scan-sheet";
import { FoodConfirmSheet } from "@/components/nutra/sheets/food-confirm-sheet";
import { kcalSanityOk } from "@/lib/nutrition";

const BLANK_MANUAL: PendingFood = {
  name: "",
  brand: "",
  servingSizeG: null,
  kcal100: 0,
  protein100: 0,
  carbs100: 0,
  fat100: 0,
  source: "manual",
};

/** convert scan result -> pending food (derive per-100g if only per-serving) */
function scanToPending(r: ScanResult): PendingFood {
  let kcal100 = r.per_100g?.kcal ?? null;
  let p100 = r.per_100g?.protein_g ?? null;
  let c100 = r.per_100g?.carbs_g ?? null;
  let f100 = r.per_100g?.fat_g ?? null;

  if (kcal100 == null && r.per_serving?.kcal != null && r.serving_size_g) {
    const k = 100 / r.serving_size_g;
    kcal100 = Math.round((r.per_serving.kcal ?? 0) * k);
    p100 = Math.round((r.per_serving.protein_g ?? 0) * k * 10) / 10;
    c100 = Math.round((r.per_serving.carbs_g ?? 0) * k * 10) / 10;
    f100 = Math.round((r.per_serving.fat_g ?? 0) * k * 10) / 10;
  }

  return {
    name: r.product_name ?? "",
    brand: r.brand,
    servingSizeG: r.serving_size_g,
    kcal100: kcal100 ?? 0,
    protein100: p100 ?? 0,
    carbs100: c100 ?? 0,
    fat100: f100 ?? 0,
    source: "scan",
    confidence: r.confidence,
    sanityOk:
      r.sanity_ok &&
      kcalSanityOk(kcal100 ?? 0, p100 ?? 0, c100 ?? 0, f100 ?? 0),
    notes: r.notes,
    sugar100: r.per_100g?.sugar_g ?? null,
    satFat100: r.per_100g?.sat_fat_g ?? null,
    fiber100: r.per_100g?.fiber_g ?? null,
    salt100: r.per_100g?.salt_g ?? null,
  };
}

export default function NutraApp() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 15_000, retry: 1 } },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AppShell />
    </QueryClientProvider>
  );
}

function AppShell() {
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();
  const tab = useAppStore((s) => s.tab);
  const setTab = useAppStore((s) => s.setTab);
  const sheet = useAppStore((s) => s.sheet);
  const closeSheet = useAppStore((s) => s.closeSheet);
  const { data: today } = useToday();

  const [pendingFood, setPendingFood] = useState<PendingFood | null>(null);

  const isManual = sheet === "manual-food";
  const confirmOpen = pendingFood != null || isManual;

  const handleScanResult = (r: ScanResult) => {
    closeSheet(); // close scan sheet
    setPendingFood(scanToPending(r));
  };

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? t("good_morning") : hour < 18 ? t("good_afternoon") : t("good_evening");

  const headerTitle =
    tab === "today"
      ? `${greeting} ${today?.profile?.displayName ? "، " + today.profile.displayName : ""} 👋`
      : tab === "log"
        ? t("food_log")
        : tab === "progress"
          ? t("progress")
          : tab === "workouts"
            ? t("workouts")
            : t("settings");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* header */}
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-xl pt-safe">
        <div className="mx-auto max-w-md px-4 h-16 flex items-center gap-2">
          <h1 className="text-base font-bold truncate flex-1">{headerTitle}</h1>
          <button
            aria-label={t("dark_mode")}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="size-11 grid place-items-center rounded-full hover:bg-secondary transition-colors text-muted-foreground"
          >
            {theme === "dark" ? <SunMedium className="size-5" /> : <Moon className="size-5" />}
          </button>
          <button
            aria-label={t("settings")}
            onClick={() => setTab(tab === "settings" ? "today" : "settings")}
            className="size-11 grid place-items-center rounded-full hover:bg-secondary transition-colors text-muted-foreground data-[active=true]:text-primary data-[active=true]:bg-accent"
            data-active={tab === "settings"}
          >
            <Settings className="size-5" />
          </button>
        </div>
      </header>

      {/* screens */}
      <main className="flex-1 mx-auto w-full max-w-md px-4 pb-32">
        {tab === "today" && <TodayScreen />}
        {tab === "log" && (
          <LogScreen
            onPickFood={(f) => {
              setPendingFood(f);
            }}
          />
        )}
        {tab === "progress" && <ProgressScreen />}
        {tab === "workouts" && <WorkoutsScreen />}
        {tab === "settings" && <SettingsScreen />}
      </main>

      <BottomNav />

      {/* sheets */}
      <QuickAddSheet />
      <ScanSheet onResult={handleScanResult} />
      <WaterSheet />
      <WeightSheet />
      <WorkoutSheet />
      <FoodConfirmSheet
        open={confirmOpen}
        food={pendingFood ?? (isManual ? BLANK_MANUAL : null)}
        onClose={() => {
          setPendingFood(null);
          if (isManual) closeSheet();
        }}
      />
    </div>
  );
}
