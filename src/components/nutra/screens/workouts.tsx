"use client";

import React, { useMemo, useState } from "react";
import { ChevronRight, ChevronLeft, Dumbbell, Flame, CalendarCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useWorkouts, useProfile } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { MUSCLE_GROUPS, type MuscleGroup } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const GROUP_COLORS: Record<string, string> = {
  chest: "#f97066",
  back: "#10b981",
  arms: "#f59e0b",
  legs: "#14b8a6",
  abs: "#7c3aed",
  shoulders: "#ec4899",
  cardio: "#06b6d4",
  other: "#94a3b8",
};

const GROUP_TEXT_COLORS: Record<string, string> = {
  chest: "#0b1210",
  back: "#0b1210",
  arms: "#0b1210",
  legs: "#0b1210",
  abs: "#ffffff",
  shoulders: "#0b1210",
  cardio: "#0b1210",
  other: "#0b1210",
};

const GROUP_LABEL_KEYS: Record<string, string> = {
  chest: "chest",
  back: "back_m",
  arms: "arms",
  legs: "legs",
  abs: "abs",
  shoulders: "shoulders",
  cardio: "cardio",
  other: "other",
};

export function groupColor(g: string) {
  return GROUP_COLORS[g] ?? "#94a3b8";
}

export function groupTextColor(g: string) {
  return GROUP_TEXT_COLORS[g] ?? "#0b1210";
}

export function groupLabelKey(g: string): string {
  return GROUP_LABEL_KEYS[g] ?? "other";
}

export function WorkoutsScreen() {
  const { t, nf, df } = useI18n();
  const openSheet = useAppStore((s) => s.openSheet);
  const today = new Date();
  const [cursor, setCursor] = useState({
    y: today.getFullYear(),
    m: today.getMonth(),
  });

  const monthKey = `${cursor.y}-${String(cursor.m + 1).padStart(2, "0")}`;
  const { data, isLoading } = useWorkouts(monthKey);
  const { data: profile } = useProfile();

  const byDate = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const w of data?.workouts ?? []) map.set(w.date, w.muscleGroups);
    return map;
  }, [data]);

  // calendar grid — week starts Saturday (MENA)
  const { cells, monthLabel } = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
    // getDay(): 0=Sun..6=Sat -> offset so Saturday=0
    const offset = (first.getDay() + 1) % 7;
    const arr: (string | null)[] = Array.from({ length: offset }, () => null);
    for (let d = 1; d <= daysInMonth; d++) {
      arr.push(`${cursor.y}-${String(cursor.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    }
    while (arr.length % 7 !== 0) arr.push(null);
    // modern Arabic months ("أكتوبر 2026") — lib/date-ar.ts via i18n df
    const label = df(first, { month: "long", year: "numeric" });
    return { cells: arr, monthLabel: label };
  }, [cursor, df]);

  const dayNames = useMemo(() => {
    // Saturday-first week
    const base = new Date(2024, 2, 9); // a Saturday
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return df(d, { weekday: "short" });
    });
  }, [df]);

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;

  const stats = data?.stats;
  const target = profile?.workoutsPerWeek ?? 4;
  const thisWeek = stats?.thisWeekCount ?? 0;
  const weekPct = Math.min(thisWeek / target, 1);

  const maxCount = Math.max(1, ...Object.values(stats?.counts ?? { x: 1 }));

  const move = (delta: number) => {
    setCursor((c) => {
      const d = new Date(c.y, c.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* week progress */}
      <section className="nutra-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <Dumbbell className="size-4 text-primary" />
            {t("workouts_this_week")}
          </h2>
          <span className="nutra-chip bg-primary/12 text-primary tabular">
            {nf(thisWeek)} / {nf(target)} {t("vs_target")}
          </span>
        </div>
        <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-secondary">
          {Array.from({ length: target }, (_, i) => (
            <div
              key={i}
              className={cn(
                "h-full flex-1 first:rounded-s-full last:rounded-e-full transition-colors",
                i < thisWeek ? "bg-primary" : "bg-transparent"
              )}
            />
          ))}
        </div>
        <div className="mt-3 flex items-center gap-4">
          <span className="nutra-chip bg-carbs/12 text-carbs-text gap-1">
            <Flame className="size-3.5" />
            {nf(stats?.streak ?? 0)} {t("streak_days")}
          </span>
          {stats?.lastWorkoutDate && (
            <span className="text-xs font-medium text-muted-foreground">
              {t("last_trained")}:{" "}
              {df(new Date(stats.lastWorkoutDate + "T00:00:00"), { day: "numeric", month: "short" })}
            </span>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        {/* calendar */}
        <section className="nutra-card p-4" aria-label={t("workout_calendar")}>
        <div className="flex items-center justify-between mb-3">
          <button
            aria-label={t("prev_month")}
            onClick={() => move(-1)}
            className="size-11 grid place-items-center rounded-full hover:bg-secondary transition-colors"
          >
            <ChevronRight className="size-5 rtl:rotate-0 ltr:rotate-180" />
          </button>
          <h3 className="text-sm font-bold">{monthLabel}</h3>
          <button
            aria-label={t("next_month")}
            onClick={() => move(1)}
            className="size-11 grid place-items-center rounded-full hover:bg-secondary transition-colors"
          >
            <ChevronLeft className="size-5 rtl:rotate-0 ltr:rotate-180" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {dayNames.map((d, i) => (
            <span key={i} className="text-center text-xs font-semibold text-muted-foreground py-1 leading-normal">
              {d}
            </span>
          ))}
        </div>

        {isLoading ? (
          <Skeleton className="h-[252px] rounded-2xl" />
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {cells.map((date, i) => {
              if (!date) return <div key={i} aria-hidden />;
              const day = Number(date.slice(8));
              const groups = byDate.get(date);
              const isToday = date === todayStr;
              const isFuture = date > todayStr;
              return (
                <button
                  key={date}
                  onClick={() =>
                    !isFuture && openSheet("workout", { workoutDate: date })
                  }
                  disabled={isFuture}
                  aria-label={`${date}${groups ? ` — ${t("workouts")}` : ""}`}
                  className={cn(
                    "relative aspect-square rounded-2xl grid place-items-center text-sm font-semibold tabular min-h-[44px] transition-all",
                    groups
                      ? "bg-primary/12 text-primary"
                      : "text-foreground/80 hover:bg-secondary",
                    isToday && "ring-2 ring-primary ring-offset-1 ring-offset-card",
                    isFuture && "opacity-30"
                  )}
                >
                  {day}
                  {groups && (
                    <span className="absolute bottom-1.5 flex gap-0.5">
                      {groups.slice(0, 3).map((g) => (
                        <span
                          key={g}
                          className="size-1.5 rounded-full"
                          style={{ background: groupColor(g) }}
                        />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* muscle group breakdown */}
      <section className="nutra-card p-5">
        <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
          <CalendarCheck className="size-4 text-primary" />
          {t("count_per_group")}
        </h2>
        <ul className="flex flex-col gap-3">
          {MUSCLE_GROUPS.map((g) => {
            const count = stats?.counts?.[g] ?? 0;
            const last = stats?.lastTrained?.[g];
            return (
              <li key={g} className="flex items-center gap-3">
                <span className="text-xs font-semibold w-14 shrink-0">
                  {t(groupLabelKey(g) as "chest")}
                </span>
                <div className="flex-1 h-2.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${(count / maxCount) * 100}%`, background: groupColor(g) }}
                  />
                </div>
                <span className="text-xs font-bold tabular w-5 text-end">{nf(count)}</span>
                <span className="text-xs text-muted-foreground w-16 text-end shrink-0 truncate leading-normal">
                  {last
                    ? df(new Date(last + "T00:00:00"), { day: "numeric", month: "numeric" })
                    : t("never")}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
      </div>
    </div>
  );
}
