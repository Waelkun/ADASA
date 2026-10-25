"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Plus, ScanLine, PencilLine, Search, Trash2, UtensilsCrossed, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import { useAddFoodLog, useFoods, localDayStr } from "@/lib/api";
import { MEAL_TYPES, type Food, type MealType } from "@/lib/types";
import { SheetShell } from "./sheet-shell";
import { ProductThumb } from "../product-thumb";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* ================= meal builder sheet ================= */

const DRAFT_KEY = "nutra-meal-draft-v1";

interface DraftItem {
  key: string;
  foodId: string | null;
  name: string;
  brand?: string | null;
  imageUrl?: string | null;
  grams: number;
  kcal100: number;
  p100: number;
  c100: number;
  f100: number;
}

function readDraft(): { meal: MealType; items: DraftItem[] } | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as { meal?: string; items?: DraftItem[] };
    if (!d || !Array.isArray(d.items) || d.items.length === 0) return null;
    const meal = MEAL_TYPES.includes(d.meal as MealType) ? (d.meal as MealType) : "snack";
    return {
      meal,
      items: d.items.filter((i) => i && typeof i.name === "string"),
    };
  } catch {
    return null;
  }
}

function defaultMealByHour(): MealType {
  const h = new Date().getHours();
  return h < 11 ? "breakfast" : h < 16 ? "lunch" : h < 22 ? "dinner" : "snack";
}

/**
 * Meal builder: full local product list (most-used first) with instant search,
 * multi-item draft protected against accidental dismissal and refresh
 * (sessionStorage). Draft is cleared only on real save or explicit discard.
 */
export function MealBuilderSheet() {
  const { t, nf } = useI18n();
  const sheet = useAppStore((s) => s.sheet);
  const closeSheet = useAppStore((s) => s.closeSheet);
  const openSheet = useAppStore((s) => s.openSheet);
  const sheetMeal = useAppStore((s) => s.sheetMeal);
  const open = sheet === "meal-builder";

  // draft restored once per mount (survives refresh via sessionStorage)
  const [draft, setDraft] = useState<{ meal: MealType; items: DraftItem[] } | null>(() =>
    readDraft()
  );
  const [q, setQ] = useState("");
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [saving, setSaving] = useState(false);
  const addLog = useAddFoodLog();

  // meal: explicit draft choice > meal passed by the caller (+ button) > smart by hour
  const meal: MealType = draft?.meal ?? sheetMeal ?? defaultMealByHour();
  const items = draft?.items ?? [];

  // full catalogue (most-used first) fetched once; filtered client-side for instant search
  const { data: foods, isLoading } = useFoods("", false, "usage");
  const needle = q.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!foods) return [];
    if (!needle) return foods;
    return foods.filter(
      (f) =>
        f.name.toLowerCase().includes(needle) || (f.brand ?? "").toLowerCase().includes(needle)
    );
  }, [foods, needle]);

  // persist draft (extra layer beyond in-memory state)
  useEffect(() => {
    if (draft && draft.items.length > 0) {
      try {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch {
        /* storage full — in-memory draft still protects this session */
      }
    } else {
      sessionStorage.removeItem(DRAFT_KEY);
    }
  }, [draft]);

  // one-time "draft restored" hint
  const hintedRef = useRef(false);
  useEffect(() => {
    if (open && !hintedRef.current && items.length > 0) {
      hintedRef.current = true;
      toast(t("draft_restored"));
    }
  }, [open, items.length, t]);

  const setItems = (updater: (prev: DraftItem[]) => DraftItem[]) =>
    setDraft((d) => ({ meal: d?.meal ?? meal, items: updater(d?.items ?? []) }));

  const setMeal = (m: MealType) =>
    setDraft((d) => ({ meal: m, items: d?.items ?? [] }));

  const clearDraft = () => setDraft(null);

  const addItem = (f: Food) => {
    setItems((prev) => [
      ...prev,
      {
        key: `${f.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        foodId: f.id,
        name: f.name,
        brand: f.brand,
        imageUrl: f.imageUrl,
        grams: Math.round(f.servingSizeG || 100),
        kcal100: f.kcal100,
        p100: f.protein100,
        c100: f.carbs100,
        f100: f.fat100,
      },
    ]);
    toast.success(t("added_to_meal"), { duration: 1600 });
  };

  const totals = useMemo(
    () =>
      items.reduce(
        (acc, it) => {
          const k = (Number(it.grams) || 0) / 100;
          return {
            kcal: acc.kcal + Math.round(it.kcal100 * k),
            p: acc.p + Math.round(it.p100 * k * 10) / 10,
            c: acc.c + Math.round(it.c100 * k * 10) / 10,
            f: acc.f + Math.round(it.f100 * k * 10) / 10,
          };
        },
        { kcal: 0, p: 0, c: 0, f: 0 }
      ),
    [items]
  );

  const saveMeal = async () => {
    const valid = items.filter((i) => Number(i.grams) > 0);
    if (valid.length === 0 || saving) return;
    setSaving(true);
    // entries land on the day being viewed on the Today screen
    const dayDate = useAppStore.getState().selectedDay ?? localDayStr();
    let loggedAt: string | undefined;
    if (dayDate !== localDayStr()) {
      const [y, m, d] = dayDate.split("-").map(Number);
      const n = new Date();
      loggedAt = new Date(y, m - 1, d, n.getHours(), n.getMinutes(), n.getSeconds()).toISOString();
    }
    try {
      await Promise.all(
        valid.map((it) =>
          addLog.mutateAsync({
            name: it.name,
            foodId: it.foodId,
            dayDate,
            loggedAt,
            mealType: meal,
            grams: Math.round(it.grams),
            kcal: Math.round((it.kcal100 * it.grams) / 100),
            proteinG: Math.round(((it.p100 * it.grams) / 100) * 10) / 10,
            carbsG: Math.round(((it.c100 * it.grams) / 100) * 10) / 10,
            fatG: Math.round(((it.f100 * it.grams) / 100) * 10) / 10,
            source: it.foodId ? "myfoods" : "manual",
            kcal100: it.kcal100,
            protein100: it.p100,
            carbs100: it.c100,
            fat100: it.f100,
            imageUrl: it.imageUrl ?? undefined,
          })
        )
      );
      clearDraft();
      toast.success(t("meal_saved"));
      closeSheet();
    } catch {
      toast.error(t("error_toast"));
    } finally {
      setSaving(false);
    }
  };

  /** close only via a clear button; with items → confirm first */
  const requestClose = () => {
    if (items.length === 0) {
      closeSheet();
      return;
    }
    setConfirmDiscard(true);
  };

  const discard = () => {
    setConfirmDiscard(false);
    clearDraft();
    closeSheet();
  };

  return (
    <>
      <SheetShell
        open={open}
        onOpenChange={(o) => !o && requestClose()}
        dismissible={items.length === 0}
        title={t("build_meal")}
      >
        <div className="flex flex-col gap-3">
          {/* meal selector */}
          <div className="grid grid-cols-4 gap-2">
            {MEAL_TYPES.map((m) => (
              <button
                key={m}
                onClick={() => setMeal(m)}
                className={cn(
                  "h-11 rounded-[18px] text-xs font-bold transition-all active:scale-95",
                  meal === m
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                {t(m as "breakfast")}
              </button>
            ))}
          </div>

          {/* search */}
          <div className="relative">
            <Search className="absolute start-4 top-1/2 -translate-y-1/2 size-4.5 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("search_products")}
              aria-label={t("search_products")}
              className="w-full h-13 rounded-[22px] bg-card border border-border ps-11 pe-4 text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
            />
          </div>

          {/* existing flows stay available */}
          <div className="flex gap-2">
            <button
              onClick={() => openSheet("scan")}
              className="flex-1 h-10 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
            >
              <ScanLine className="size-4" />
              {t("scan_product")}
            </button>
            <button
              onClick={() => openSheet("manual-food")}
              className="flex-1 h-10 rounded-full bg-carbs/10 text-carbs text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
            >
              <PencilLine className="size-4" />
              {t("manual_entry")}
            </button>
          </div>

          {/* product list — full list by default, instant filter while typing */}
          <div className="min-h-[120px] max-h-[38vh] overflow-y-auto nutra-scroll flex flex-col gap-1.5 pe-0.5">
            {isLoading ? (
              [0, 1, 2].map((i) => <Skeleton key={i} className="h-14 rounded-[18px]" />))
            : filtered.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                {foods && foods.length > 0 ? t("no_results") : t("no_foods")}
              </p>
            ) : (
              filtered.map((f) => (
                <button
                  key={f.id}
                  onClick={() => addItem(f)}
                  className="w-full flex items-center gap-3 p-2 rounded-[18px] hover:bg-secondary/70 active:scale-[0.98] transition-all text-start min-h-[56px]"
                >
                  <ProductThumb src={f.imageUrl} name={f.name} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold truncate">{f.name}</span>
                    <span className="block text-[11px] text-muted-foreground truncate">
                      {f.brand ? `${f.brand} · ` : ""}
                      <span className="tabular">
                        {nf(f.kcal100)} {t("kcal")}/{t("per_100g")}
                      </span>
                    </span>
                  </span>
                  <span className="size-9 shrink-0 grid place-items-center rounded-full bg-primary/12 text-primary">
                    <Plus className="size-4.5" />
                  </span>
                </button>
              ))
            )}
          </div>

          {/* draft items */}
          {items.length > 0 && (
            <div className="rounded-[22px] bg-primary/6 border border-primary/15 p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <UtensilsCrossed className="size-3.5 text-primary" />
                  {t("meal_items")} ({nf(items.length)})
                </span>
                <span className="text-xs font-bold tabular text-primary">
                  {nf(totals.kcal)} {t("kcal")}
                </span>
              </div>
              <div className="max-h-[26vh] overflow-y-auto nutra-scroll flex flex-col gap-1">
                {items.map((it) => {
                  const kcal = Math.round((it.kcal100 * (Number(it.grams) || 0)) / 100);
                  return (
                    <div
                      key={it.key}
                      className="flex items-center gap-2 bg-card rounded-[16px] p-2"
                    >
                      <ProductThumb src={it.imageUrl} name={it.name} className="size-10" />
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13px] font-semibold truncate">{it.name}</span>
                        <span className="block text-[10px] text-muted-foreground tabular">
                          P{nf(Math.round((it.p100 * (Number(it.grams) || 0)) / 10) / 10, 1)} C
                          {nf(Math.round((it.c100 * (Number(it.grams) || 0)) / 10) / 10, 1)} F
                          {nf(Math.round((it.f100 * (Number(it.grams) || 0)) / 10) / 10, 1)}
                        </span>
                      </span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        value={it.grams}
                        aria-label={`${t("quantity")} ${it.name}`}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          if (!Number.isFinite(n) || n < 0) return;
                          setItems((prev) =>
                            prev.map((p) => (p.key === it.key ? { ...p, grams: n } : p))
                          );
                        }}
                        className="w-[76px] h-11 rounded-xl bg-secondary text-center text-base font-bold tabular focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                      <span className="text-xs font-bold tabular text-muted-foreground w-11 text-end">
                        {nf(kcal)}
                      </span>
                      <button
                        aria-label={`${t("delete")} ${it.name}`}
                        onClick={() =>
                          setItems((prev) => prev.filter((p) => p.key !== it.key))
                        }
                        className="size-9 grid place-items-center rounded-full text-muted-foreground hover:text-negative hover:bg-negative/10 transition-colors"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
              {/* macros summary */}
              <div className="flex justify-between px-1 pt-1 text-[11px] font-semibold text-muted-foreground tabular">
                <span>P {nf(totals.p, 1)}{t("grams")}</span>
                <span>C {nf(totals.c, 1)}{t("grams")}</span>
                <span>F {nf(totals.f, 1)}{t("grams")}</span>
              </div>
            </div>
          )}

          {/* footer actions */}
          <div className="flex gap-2">
            <button
              onClick={requestClose}
              className="h-14 px-6 rounded-full bg-secondary text-sm font-bold text-muted-foreground active:scale-[0.98] transition-transform"
            >
              {items.length > 0 ? t("cancel") : t("close")}
            </button>
            <button
              onClick={saveMeal}
              disabled={items.length === 0 || saving}
              className="flex-1 h-14 rounded-full bg-primary text-primary-foreground font-bold text-sm active:scale-[0.98] transition-transform disabled:opacity-40 shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
            >
              {saving ? (
                <span className="size-5 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <Plus className="size-5" />
              )}
              {t("save_meal")}
            </button>
          </div>
        </div>
      </SheetShell>

      {/* discard confirmation */}
      <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <AlertDialogContent className="max-w-sm mx-auto rounded-[24px]">
          <AlertDialogHeader className="sm:text-center">
            <AlertDialogTitle>{t("discard_meal_q")}</AlertDialogTitle>
            <AlertDialogDescription>{t("discard_meal_desc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:justify-center">
            <AlertDialogAction
              onClick={() => setConfirmDiscard(false)}
              className="h-12 px-6 rounded-full bg-primary text-primary-foreground font-bold"
            >
              {t("keep_editing")}
            </AlertDialogAction>
            <AlertDialogCancel
              onClick={discard}
              className="h-12 px-6 rounded-full bg-secondary text-negative font-bold border-none mt-0"
            >
              {t("discard")}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
