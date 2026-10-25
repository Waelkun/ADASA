"use client";

import React, { useState } from "react";
import { BookmarkPlus, Check } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import {
  useCreateMeal,
  useAddFoodLog,
  useDeleteFoodLog,
  useMeals,
  localDayStr,
} from "@/lib/api";
import { MEAL_TYPES, type MealType, type FoodLog, type SavedMeal, type SavedMealItem } from "@/lib/types";
import { SheetShell } from "./sheet-shell";
import { ProductThumb } from "../product-thumb";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* ================= save-meal sheet (from a Today meal group) ================= */

/** snapshot FoodLog entries → SavedMealItem[] */
export function toMealItems(logs: FoodLog[]): SavedMealItem[] {
  return logs.map((l) => ({
    foodId: l.foodId ?? null,
    name: l.name,
    grams: l.grams,
    kcal: l.kcal,
    proteinG: l.proteinG,
    carbsG: l.carbsG,
    fatG: l.fatG,
    kcal100: l.kcal100 ?? null,
    protein100: l.protein100 ?? null,
    carbs100: l.carbs100 ?? null,
    fat100: l.fat100 ?? null,
    imageUrl: l.imageUrl ?? null,
  }));
}

export function SaveMealSheet({
  open,
  defaultName,
  items,
  onClose,
}: {
  open: boolean;
  defaultName: string;
  items: FoodLog[];
  onClose: () => void;
}) {
  const { t, nf } = useI18n();
  const createMeal = useCreateMeal();
  const [name, setName] = useState(defaultName);
  // re-seed the name when a different group opens (keyed remount by caller)
  const kcal = items.reduce((a, l) => a + l.kcal, 0);

  const save = () => {
    if (!name.trim() || items.length === 0) {
      toast.error(t("error_toast"));
      return;
    }
    createMeal.mutate(
      { name: name.trim(), items: toMealItems(items) },
      {
        onSuccess: () => {
          toast.success(t("meal_saved_toast"));
          onClose();
        },
        onError: () => toast.error(t("error_toast")),
      }
    );
  };

  return (
    <SheetShell open={open} onOpenChange={(o) => !o && onClose()} title={t("save_as_meal")}>
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">{t("meal_name_ph")}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            aria-label={t("meal_name_ph")}
            className="h-12 rounded-2xl bg-secondary px-4 text-base font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </label>

        <ul className="flex flex-col gap-1.5 max-h-[28vh] overflow-y-auto nutra-scroll">
          {items.map((l) => (
            <li key={l.id} className="flex items-center gap-2.5 bg-secondary/60 rounded-[16px] p-2">
              <ProductThumb src={l.imageUrl} name={l.name} className="size-9" />
              <span className="flex-1 min-w-0 text-[13px] font-semibold truncate">{l.name}</span>
              <span className="text-xs font-bold tabular text-muted-foreground">{nf(l.kcal)}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs font-semibold text-muted-foreground text-center tabular">
          {nf(items.length)} {t("items_count")} · {nf(kcal)} {t("kcal")}
        </p>

        <button
          onClick={save}
          disabled={createMeal.isPending}
          className="h-14 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-transform disabled:opacity-60 shadow-lg shadow-primary/25"
        >
          <BookmarkPlus className="size-5" />
          {t("save_as_meal")}
        </button>
      </div>
    </SheetShell>
  );
}

/* ================= add-meal sheet (from the وجباتي bar) ================= */

function defaultMealByHour(): MealType {
  const h = new Date().getHours();
  return h < 11 ? "breakfast" : h < 16 ? "lunch" : h < 22 ? "dinner" : "snack";
}

/** add a saved meal to any day + meal type, with undo */
export function AddMealSheet({
  meal,
  onClose,
}: {
  meal: SavedMeal | null;
  onClose: () => void;
}) {
  const { t, nf } = useI18n();
  const addLog = useAddFoodLog();
  const deleteLog = useDeleteFoodLog();

  const todayStr = localDayStr();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = localDayStr(yesterday);

  const [day, setDay] = useState<"today" | "yesterday" | "custom">("today");
  const [customDate, setCustomDate] = useState(todayStr);
  const [mealType, setMealType] = useState<MealType>(defaultMealByHour());

  const open = meal != null;
  const targetDay = day === "today" ? todayStr : day === "yesterday" ? yesterdayStr : customDate;
  const kcal = meal?.items.reduce((a, it) => a + it.kcal, 0) ?? 0;

  const add = () => {
    if (!meal) return;
    // viewed-day aware: default lands on the day shown on Today
    const dayDate = useAppStore.getState().selectedDay ?? targetDay;
    const finalDay = day === "today" ? dayDate : targetDay;
    let loggedAt: string | undefined;
    if (finalDay !== todayStr) {
      const [y, m, d] = finalDay.split("-").map(Number);
      const n = new Date();
      loggedAt = new Date(y, m - 1, d, n.getHours(), n.getMinutes(), n.getSeconds()).toISOString();
    }
    Promise.all(
      meal.items.map((it) =>
        addLog.mutateAsync({
          name: it.name,
          foodId: it.foodId,
          dayDate: finalDay,
          loggedAt,
          mealType,
          grams: it.grams,
          kcal: it.kcal,
          proteinG: it.proteinG,
          carbsG: it.carbsG,
          fatG: it.fatG,
          source: it.foodId ? "myfoods" : "manual",
          kcal100: it.kcal100 ?? undefined,
          protein100: it.protein100 ?? undefined,
          carbs100: it.carbs100 ?? undefined,
          fat100: it.fat100 ?? undefined,
          imageUrl: it.imageUrl ?? undefined,
        })
      )
    )
      .then((created) => {
        onClose();
        toast.success(t("meal_added_toast"), {
          duration: 6000,
          action: {
            label: t("undo"),
            onClick: () => {
              Promise.all(created.map((c) => deleteLog.mutateAsync(c.id))).catch(() =>
                toast.error(t("error_toast"))
              );
            },
          },
        });
      })
      .catch(() => toast.error(t("error_toast")));
  };

  return (
    <SheetShell open={open} onOpenChange={(o) => !o && onClose()} title={t("add_meal_title")}>
      {meal && (
        <div className="flex flex-col gap-4">
          {/* meal summary */}
          <div className="rounded-[18px] bg-secondary/60 p-3 flex items-center gap-3">
            <span className="size-10 rounded-2xl bg-primary/12 text-primary grid place-items-center shrink-0">
              <Check className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold truncate">{meal.name}</p>
              <p className="text-xs text-muted-foreground tabular">
                {nf(meal.items.length)} {t("items_count")} · {nf(kcal)} {t("kcal")}
              </p>
            </div>
          </div>

          {/* target day */}
          <div>
            <span className="text-xs font-semibold text-muted-foreground mb-2 block">{t("target_day")}</span>
            <div className="flex gap-2">
              {(
                [
                  ["today", t("today_log")],
                  ["yesterday", t("yesterday")],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setDay(id)}
                  className={cn(
                    "h-11 px-4 rounded-full text-xs font-bold tabular transition-all active:scale-95",
                    day === id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
              <input
                type="date"
                value={customDate}
                max={todayStr}
                onChange={(e) => {
                  if (!e.target.value) return;
                  setCustomDate(e.target.value);
                  setDay("custom");
                }}
                aria-label={t("target_day")}
                className={cn(
                  "flex-1 h-11 min-w-0 rounded-full px-3 text-xs font-bold tabular bg-secondary text-center focus:outline-none focus:ring-2 focus:ring-primary/40",
                  day === "custom" && "ring-2 ring-primary/60"
                )}
              />
            </div>
          </div>

          {/* meal type */}
          <div>
            <span className="text-xs font-semibold text-muted-foreground mb-2 block">{t("meal")}</span>
            <div className="grid grid-cols-4 gap-2">
              {MEAL_TYPES.map((m) => (
                <button
                  key={m}
                  onClick={() => setMealType(m)}
                  className={cn(
                    "h-11 rounded-[18px] text-xs font-bold transition-all active:scale-95",
                    mealType === m
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                      : "bg-secondary text-muted-foreground"
                  )}
                >
                  {t(m as "breakfast")}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={add}
            disabled={addLog.isPending}
            className="h-14 rounded-full bg-primary text-primary-foreground font-bold text-sm active:scale-[0.97] transition-transform disabled:opacity-60 shadow-lg shadow-primary/25"
          >
            {t("add")}
          </button>
        </div>
      )}
    </SheetShell>
  );
}

/* ================= وجباتي bar (horizontal chips for the Log screen) ================= */

export function MyMealsBar({ onPick }: { onPick: (m: SavedMeal) => void }) {
  const { t, nf } = useI18n();
  const { data: meals, isLoading } = useMeals();

  if (isLoading || !meals || meals.length === 0) return null;

  return (
    <section aria-label={t("my_meals")} className="flex flex-col gap-2">
      <h2 className="text-sm font-bold px-1">{t("my_meals")}</h2>
      <div className="flex gap-2 overflow-x-auto nutra-scroll pb-1 -mx-1 px-1">
        {meals.map((m) => {
          const kcal = m.items.reduce((a, it) => a + it.kcal, 0);
          return (
            <button
              key={m.id}
              onClick={() => onPick(m)}
              className="nutra-card shrink-0 w-36 p-3 flex flex-col items-start gap-1.5 text-start active:scale-[0.97] transition-transform"
            >
              <span className="w-full flex items-center gap-1.5">
                <span className="size-8 rounded-xl bg-primary/12 text-primary grid place-items-center shrink-0">
                  <BookmarkPlus className="size-4" />
                </span>
                <span className="text-[13px] font-bold truncate flex-1">{m.name}</span>
              </span>
              <span className="text-[11px] text-muted-foreground tabular">
                {nf(m.items.length)} {t("items_count")} · {nf(kcal)} {t("kcal")}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
