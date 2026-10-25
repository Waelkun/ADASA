"use client";

import React, { useMemo, useState } from "react";
import { Flame, GlassWater, Dumbbell, Trash2, Sparkles, Plus, ChevronLeft, ChevronRight, Undo2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useToday, useDeleteFoodLog, useAddFoodLog, useWater, useAddWater, useUndoWater, localDayStr } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { CalorieRing } from "../calorie-ring";
import { MacroBar, MacroDonut } from "../macro-donut";
import { ProductThumb } from "../product-thumb";
import { MEAL_TYPES, type MealType, type FoodLog } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EditGramsSheet, per100OfLog } from "../sheets/edit-grams-sheet";
import { SaveMealSheet } from "../sheets/my-meal-sheets";
import { Pencil, BookmarkPlus } from "lucide-react";

const MEAL_ICON: Record<MealType, string> = {
  breakfast: "🌅",
  lunch: "🍽️",
  dinner: "🌙",
  snack: "🥜",
};

/** parse YYYY-MM-DD as a local Date (noon, avoids DST edge) */
function parseDayStr(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12);
}

export function TodayScreen() {
  const { t, nf, df } = useI18n();
  const openSheet = useAppStore((s) => s.openSheet);
  const setTab = useAppStore((s) => s.setTab);
  const selectedDay = useAppStore((s) => s.selectedDay);
  const setSelectedDay = useAppStore((s) => s.setSelectedDay);
  const { data: today, isLoading } = useToday(selectedDay ?? undefined);
  const { data: water } = useWater(selectedDay ?? undefined);
  const deleteLog = useDeleteFoodLog();
  const addLog = useAddFoodLog();
  const addWater = useAddWater();
  const undoWater = useUndoWater();
  const [editingLog, setEditingLog] = useState<FoodLog | null>(null);
  /** meal group being saved as وجباتي */
  const [savingGroup, setSavingGroup] = useState<{ meal: MealType; items: FoodLog[] } | null>(null);

  const todayStr = localDayStr();
  const viewDay = selectedDay ?? todayStr;
  const isToday = viewDay === todayStr;
  const viewDate = useMemo(() => parseDayStr(viewDay), [viewDay]);

  /** move to an adjacent day (never into the future) */
  const shiftDay = (delta: number) => {
    const dt = parseDayStr(viewDay);
    dt.setDate(dt.getDate() + delta);
    const s = localDayStr(dt);
    if (s > todayStr) return; // no future days
    setSelectedDay(s === todayStr ? null : s);
  };

  const now = new Date();
  const greeting =
    now.getHours() < 12
      ? t("good_morning")
      : now.getHours() < 18
        ? t("good_afternoon")
        : t("good_evening");

  const profile = today?.profile;
  const totals = today?.totals ?? { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  const logs = today?.logs ?? [];

  const grouped = MEAL_TYPES.map((m) => ({
    meal: m,
    items: logs.filter((l) => l.mealType === m),
    kcal: logs.filter((l) => l.mealType === m).reduce((a, l) => a + l.kcal, 0),
  })).filter((g) => g.items.length > 0);

  const waterTotal = water?.total ?? 0;
  const waterGoal = profile?.waterGoalMl ?? 2800;
  const waterPct = Math.min(waterTotal / waterGoal, 1);
  const lastWaterId = water?.entries?.[water.entries.length - 1]?.id;

  return (
    <div className="flex flex-col gap-4">
      {/* date navigation: prev / date (tap = back to today) / next */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-0.5">
          <button
            aria-label={t("prev_day")}
            onClick={() => shiftDay(-1)}
            className="size-11 grid place-items-center rounded-full text-muted-foreground hover:bg-secondary transition-colors active:scale-95"
          >
            <ChevronRight className="size-5 rtl:rotate-0 ltr:rotate-180" />
          </button>
          <button
            onClick={() => setSelectedDay(null)}
            aria-label={isToday ? df(viewDate) : t("back_to_today")}
            className="min-h-[44px] px-2 flex flex-col items-center justify-center"
          >
            <span className="text-[13px] font-semibold text-foreground whitespace-nowrap">
              {df(viewDate)}
            </span>
            {!isToday && (
              <span className="text-[10px] font-bold text-primary flex items-center gap-0.5">
                <Undo2 className="size-3" />
                {t("today_log")}
              </span>
            )}
          </button>
          <button
            aria-label={t("next_day")}
            onClick={() => shiftDay(1)}
            disabled={isToday}
            className="size-11 grid place-items-center rounded-full text-muted-foreground hover:bg-secondary transition-colors active:scale-95 disabled:opacity-25 disabled:pointer-events-none"
          >
            <ChevronLeft className="size-5 rtl:rotate-0 ltr:rotate-180" />
          </button>
        </div>
        {today && today.streak > 0 && (
          <span className="nutra-chip bg-positive/12 text-positive gap-1">
            <Flame className="size-3.5" />
            {nf(today.streak)} {t("streak_days")}
          </span>
        )}
      </div>

      {/* hero calorie card */}
      <section className="nutra-card p-6 flex flex-col items-center" aria-label={t("macros")}>
        {isLoading ? (
          <Skeleton className="size-[220px] rounded-full" />
        ) : (
          <CalorieRing key={totals.kcal} eaten={totals.kcal} goal={profile?.kcalGoal ?? 2100} />
        )}
        <div className="mt-5 w-full">
          <MacroBar protein={totals.protein} carbs={totals.carbs} fat={totals.fat} />
          <div className="mt-2 grid grid-cols-3 text-center text-[11px] font-medium text-muted-foreground">
            <span>{t("protein")} {nf(totals.protein, 1)}{t("grams")}</span>
            <span>{t("carbs")} {nf(totals.carbs, 1)}{t("grams")}</span>
            <span>{t("fat")} {nf(totals.fat, 1)}{t("grams")}</span>
          </div>
        </div>
      </section>

      {/* macro donut + workout status */}
      <section className="nutra-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold">{t("macros")}</h2>
          <button
            onClick={() => setTab("progress")}
            className="text-primary text-xs font-semibold flex items-center gap-0.5 min-h-[36px]"
          >
            {t("tab_progress")}
            <ChevronLeft className="size-3.5 rtl:rotate-0 ltr:rotate-180" />
          </button>
        </div>
        <MacroDonut protein={totals.protein} carbs={totals.carbs} fat={totals.fat} />
        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
          {today?.workoutToday ? (
            <span className="nutra-chip bg-positive/12 text-positive gap-1">
              <Dumbbell className="size-3.5" />
              {t("trained_today")}
            </span>
          ) : (
            <button
              onClick={() => openSheet("workout", { workoutDate: selectedDay ?? undefined })}
              className="nutra-chip bg-secondary text-secondary-foreground gap-1 hover:bg-accent transition-colors"
            >
              <Dumbbell className="size-3.5" />
              {t("log_workout")}
            </button>
          )}
          {today?.weightToday && (
            <span className="text-xs font-semibold text-muted-foreground tabular">
              ⚖️ {nf(today.weightToday.weightKg, 1)} {t("kg")}
            </span>
          )}
        </div>
      </section>

      {/* water card */}
      <section className="nutra-card p-5" aria-label={t("water")}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <GlassWater className="size-4 text-water" />
            {t("water")}
          </h2>
          <span className="text-xs font-semibold tabular text-muted-foreground">
            {(waterTotal / 1000).toLocaleString("en-US", { maximumFractionDigits: 2 })} /{" "}
            {(waterGoal / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 })} {t("liter")}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {/* mini water ring */}
          <div className="relative size-20 shrink-0">
            <svg viewBox="0 0 80 80" className="-rotate-90 size-20">
              <circle cx="40" cy="40" r="32" fill="none" strokeWidth="9" className="stroke-secondary" />
              <circle
                cx="40"
                cy="40"
                r="32"
                fill="none"
                strokeWidth="9"
                strokeLinecap="round"
                stroke="var(--water)"
                strokeDasharray={2 * Math.PI * 32}
                strokeDashoffset={2 * Math.PI * 32 * (1 - waterPct)}
                style={{ transition: "stroke-dashoffset 600ms ease-out" }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular">
              {Math.round(waterPct * 100)}%
            </span>
          </div>
          <div className="flex flex-wrap gap-2 flex-1">
            {[
              { ml: 250, label: "+250" },
              { ml: 500, label: "+500" },
              { ml: 1000, label: "+1L" },
            ].map((b) => (
              <button
                key={b.ml}
                onClick={() =>
                  addWater.mutate(b.ml, {
                    onError: () => toast.error(t("error_toast")),
                  })
                }
                className="h-11 px-4 rounded-full bg-water/10 text-water text-sm font-bold tabular hover:bg-water/20 active:scale-95 transition-all"
              >
                {b.label}
              </button>
            ))}
            {lastWaterId && (
              <button
                onClick={() => undoWater.mutate(lastWaterId)}
                className="h-11 px-4 rounded-full bg-secondary text-muted-foreground text-sm font-semibold hover:text-foreground transition-colors"
              >
                {t("undo")}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* meals list */}
      <section aria-label={t("meals")}>
        <div className="flex items-center justify-between px-1 mb-3">
          <h2 className="text-sm font-bold">{t("meals")}</h2>
          <span className="text-xs font-semibold text-muted-foreground tabular">
            {nf(totals.kcal)} {t("kcal")}
          </span>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16 rounded-[22px]" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="nutra-card p-8 flex flex-col items-center gap-3 text-center">
            <span className="text-3xl">🍽️</span>
            <p className="text-sm font-semibold">{t("no_meals")}</p>
            <p className="text-xs text-muted-foreground">{t("no_meals_hint")}</p>
            <button
              onClick={() => openSheet("quick-add")}
              className="mt-1 inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-primary text-primary-foreground text-sm font-bold active:scale-95 transition-transform"
            >
              <Plus className="size-4" />
              {t("add_food")}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {grouped.map((g) => (
              <div key={g.meal} className="nutra-card overflow-hidden">
                <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <span aria-hidden>{MEAL_ICON[g.meal]}</span>
                    {t(g.meal as "breakfast")}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-xs font-semibold tabular text-muted-foreground">
                      {nf(g.kcal)} {t("kcal")}
                    </span>
                    <button
                      aria-label={`${t("save_as_meal")} — ${t(g.meal as "breakfast")}`}
                      onClick={() => setSavingGroup({ meal: g.meal, items: g.items })}
                      className="size-9 grid place-items-center rounded-full text-primary hover:bg-accent transition-colors active:scale-95"
                    >
                      <BookmarkPlus className="size-4" />
                    </button>
                    <button
                      aria-label={`${t("add_food")} — ${t(g.meal as "breakfast")}`}
                      onClick={() => openSheet("meal-builder", { mealType: g.meal })}
                      className="size-9 grid place-items-center rounded-full text-primary hover:bg-accent transition-colors active:scale-95"
                    >
                      <Plus className="size-4" />
                    </button>
                  </span>
                </div>
                <ul>
                  {g.items.map((l, idx) => (
                    <li
                      key={l.id}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5",
                        idx !== g.items.length - 1 && "border-b border-border/60"
                      )}
                    >
                      <ProductThumb src={l.imageUrl} name={l.name} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{l.name}</p>
                        <p className="text-xs text-muted-foreground tabular">
                          {nf(l.grams, l.grams % 1 ? 1 : 0)}{t("grams")} · {t("protein")} {nf(l.proteinG, 1)} · {t("carbs")} {nf(l.carbsG, 1)} · {t("fat")} {nf(l.fatG, 1)}
                          {l.source === "scan" && (
                            <span className="ms-1.5 inline-flex items-center gap-0.5 text-primary">
                              <Sparkles className="size-3" />
                              {t("source_scan")}
                            </span>
                          )}
                        </p>
                      </div>
                      <span className="text-sm font-bold tabular whitespace-nowrap">
                        {nf(l.kcal)}
                      </span>
                      {per100OfLog(l) && (
                        <button
                          aria-label={`${t("edit_amount")} ${l.name}`}
                          onClick={() => setEditingLog(l)}
                          className="size-9 grid place-items-center rounded-full text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
                        >
                          <Pencil className="size-4" />
                        </button>
                      )}
                      <button
                        aria-label={`${t("delete")} ${l.name}`}
                        onClick={() =>
                          deleteLog.mutate(l.id, {
                            onSuccess: () => {
                              toast.success(t("deleted_toast"), {
                                duration: 6000,
                                action: {
                                  label: t("undo"),
                                  onClick: () =>
                                    addLog.mutate({
                                      name: l.name,
                                      foodId: l.foodId,
                                      dayDate: l.dayDate ?? l.loggedAt.slice(0, 10),
                                      mealType: l.mealType,
                                      grams: l.grams,
                                      kcal: l.kcal,
                                      proteinG: l.proteinG,
                                      carbsG: l.carbsG,
                                      fatG: l.fatG,
                                      source: l.source,
                                      loggedAt: l.loggedAt,
                                      kcal100: l.kcal100 ?? undefined,
                                      protein100: l.protein100 ?? undefined,
                                      carbs100: l.carbs100 ?? undefined,
                                      fat100: l.fat100 ?? undefined,
                                      imageUrl: l.imageUrl ?? undefined,
                                    }),
                                },
                              });
                            },
                            onError: () => toast.error(t("error_toast")),
                          })
                        }
                        className="size-9 grid place-items-center rounded-full text-muted-foreground hover:text-negative hover:bg-negative/10 transition-colors"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* edit-grams sheet */}
      <EditGramsSheet log={editingLog} onClose={() => setEditingLog(null)} />

      {/* save-meal sheet (وجباتي) — remounts per group so the name resets */}
      <SaveMealSheet
        key={savingGroup?.meal ?? "none"}
        open={savingGroup != null}
        defaultName={savingGroup ? `${t(savingGroup.meal as "breakfast")} · ${nf(savingGroup.items.length)} ${t("items_count")}` : ""}
        items={savingGroup?.items ?? []}
        onClose={() => setSavingGroup(null)}
      />
    </div>
  );
}
