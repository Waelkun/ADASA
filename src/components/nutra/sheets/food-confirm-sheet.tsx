"use client";

import React, { useMemo, useState } from "react";
import { AlertTriangle, Check, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAddFoodLog, useCreateFood, localDayStr } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { MEAL_TYPES, type MealType, type PendingFood } from "@/lib/types";
import { SheetShell } from "./sheet-shell";
import { ProductThumb } from "../product-thumb";
import { NumInput } from "../num-input";
import { Segmented } from "../segmented";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Food confirmation sheet — used by scan result, my-foods pick and manual entry.
 * Inner form remounts (via key) per food so state resets without effects.
 */
export function FoodConfirmSheet({
  open,
  food,
  onClose,
}: {
  open: boolean;
  food: PendingFood | null;
  onClose: () => void;
}) {
  const { t } = useI18n();

  if (!open || !food) {
    // keep the drawer mounted with hidden content to avoid exit-animation glitches
    return (
      <SheetShell open={false} onOpenChange={() => undefined} title="">
        <span className="hidden">{t("add_food")}</span>
      </SheetShell>
    );
  }

  const resetKey = `${food.name}|${food.brand ?? ""}|${food.kcal100}|${food.source}|${food.confidence ?? ""}`;

  return (
    <SheetShell
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={
        food.source === "scan"
          ? t("scan_result")
          : food.source === "manual"
            ? t("manual_title")
            : t("add_food")
      }
    >
      <FoodForm key={resetKey} food={food} onClose={onClose} />
    </SheetShell>
  );
}

function FoodForm({ food, onClose }: { food: PendingFood; onClose: () => void }) {
  const { t, nf } = useI18n();
  const addLog = useAddFoodLog();
  const createFood = useCreateFood();

  const editable = food.source === "scan" || food.source === "manual";

  const [name, setName] = useState(food.name ?? "");
  const [brand, setBrand] = useState(food.brand ?? "");
  const [per100, setPer100] = useState({
    kcal: Math.round(food.kcal100 ?? 0),
    p: food.protein100 ?? 0,
    c: food.carbs100 ?? 0,
    f: food.fat100 ?? 0,
  });
  const [qtyMode, setQtyMode] = useState<"grams" | "servings">("grams");
  // weight priority: AI-estimated meal weight > serving size > 100g
  const [grams, setGrams] = useState(
    Math.round(
      food.source === "scan" && food.estimatedWeightG && food.estimatedWeightG > 0
        ? food.estimatedWeightG
        : food.servingSizeG || 100
    )
  );
  const [servings, setServings] = useState(1);
  // smart default meal by hour
  const [meal, setMeal] = useState<MealType>(() => {
    const h = new Date().getHours();
    return h < 11 ? "breakfast" : h < 16 ? "lunch" : h < 22 ? "dinner" : "snack";
  });
  const [saveToFoods, setSaveToFoods] = useState(true);
  const [advanced, setAdvanced] = useState(food.source === "manual");

  const hasServing = !!food.servingSizeG && food.servingSizeG > 0;
  const effectiveGrams =
    qtyMode === "servings" && hasServing ? servings * (food?.servingSizeG ?? 0) : grams;

  const totals = useMemo(() => {
    const k = effectiveGrams / 100;
    return {
      kcal: Math.round(per100.kcal * k),
      p: Math.round(per100.p * k * 10) / 10,
      c: Math.round(per100.c * k * 10) / 10,
      f: Math.round(per100.f * k * 10) / 10,
    };
  }, [per100, effectiveGrams]);

  const lowConfidence = food.source === "scan" && (food.confidence ?? 1) < 0.7;
  const showWarning = food.source === "scan" && (lowConfidence || food.sanityOk === false);

  const submit = async () => {
    if (!name.trim() || effectiveGrams <= 0) {
      toast.error(t("error_toast"));
      return;
    }
    // entries land on the day being viewed on the Today screen (item: day nav)
    const dayDate = useAppStore.getState().selectedDay ?? localDayStr();
    let loggedAt: string | undefined;
    if (dayDate !== localDayStr()) {
      // keep intra-day ordering: viewed day + current clock time (local, no tz slip)
      const [y, m, d] = dayDate.split("-").map(Number);
      const n = new Date();
      loggedAt = new Date(y, m - 1, d, n.getHours(), n.getMinutes(), n.getSeconds()).toISOString();
    }
    try {
      let foodId = food.id ?? null;
      // save into My foods (scan / manual)
      if (food.source !== "myfoods" && saveToFoods) {
        const created = await createFood.mutateAsync({
          name: name.trim(),
          brand: brand.trim() || null,
          servingSizeG: food.servingSizeG ?? null,
          kcal100: per100.kcal,
          protein100: per100.p,
          carbs100: per100.c,
          fat100: per100.f,
          sugar100: food.sugar100 ?? null,
          satFat100: food.satFat100 ?? null,
          fiber100: food.fiber100 ?? null,
          salt100: food.salt100 ?? null,
          imageUrl: food.imageUrl ?? null,
        });
        foodId = created.id;
      }
      await addLog.mutateAsync({
        name: name.trim(),
        foodId,
        dayDate,
        loggedAt,
        mealType: meal,
        grams: Math.round(effectiveGrams),
        kcal: totals.kcal,
        proteinG: totals.p,
        carbsG: totals.c,
        fatG: totals.f,
        source: food.source,
        kcal100: per100.kcal,
        protein100: per100.p,
        carbs100: per100.c,
        fat100: per100.f,
        imageUrl: food.imageUrl ?? undefined,
      });
      toast.success(t("added_toast"));
      onClose();
    } catch {
      toast.error(t("error_toast"));
    }
  };

  return (
    <div className="flex flex-col">
      <div className="max-h-[62vh] overflow-y-auto nutra-scroll flex flex-col gap-4">
        {/* scan meta */}
        {food.source === "scan" && (
          <div className="flex items-center justify-between">
            <span className="nutra-chip bg-primary/12 text-primary gap-1">
              <Sparkles className="size-3.5" />
              {t("source_scan")} · {t("confidence")} {Math.round((food.confidence ?? 1) * 100)}%
            </span>
          </div>
        )}

        {showWarning && (
          <div role="alert" className="p-3.5 rounded-[18px] bg-carbs/10 flex items-start gap-2.5 text-start">
            <AlertTriangle className="size-4.5 text-carbs shrink-0 mt-0.5" />
            <p className="text-xs font-semibold leading-relaxed">
              {food.sanityOk === false ? t("verify_values") : t("low_confidence")}
            </p>
          </div>
        )}

        {/* thumb + name / brand */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <ProductThumb src={food.imageUrl} name={name} className="size-14 rounded-2xl" />
            {editable ? (
              <div className="flex-1 min-w-0 flex flex-col gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("food_name")}
                  aria-label={t("food_name")}
                  className="w-full h-13 rounded-[18px] bg-secondary px-4 text-base font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <input
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder={t("brand")}
                  aria-label={t("brand")}
                  className="w-full h-11 rounded-full bg-secondary px-4 text-base font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            ) : (
              <div className="text-start min-w-0">
                <p className="text-lg font-bold leading-tight truncate">{name}</p>
                {brand && <p className="text-xs text-muted-foreground mt-0.5 truncate">{brand}</p>}
              </div>
            )}
          </div>
        </div>

        {/* per-100g values */}
        {editable ? (
          <div>
            <button
              onClick={() => setAdvanced((a) => !a)}
              className="w-full flex items-center justify-between text-xs font-semibold text-muted-foreground min-h-[36px]"
            >
              <span>
                {t("per_100g")} — {nf(per100.kcal)} {t("kcal")}
              </span>
              <span className="text-primary">{advanced ? "−" : "+"}</span>
            </button>
            {advanced && (
              <div className="grid grid-cols-4 gap-2 mt-2">
                {(
                  [
                    ["kcal", t("kcal")],
                    ["p", t("protein")],
                    ["c", t("carbs")],
                    ["f", t("fat")],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex flex-col gap-1">
                    <span className="text-[10px] font-semibold text-muted-foreground text-center">
                      {label}
                    </span>
                    <NumInput
                      value={per100[key]}
                      onChange={(v) =>
                        setPer100((prev) => ({ ...prev, [key]: typeof v === "number" ? v : 0 }))
                      }
                      min={0}
                      max={2000}
                      decimals={1}
                      ariaLabel={label}
                      className="h-11 bg-secondary text-center"
                    />
                  </label>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {(
              [
                [nf(per100.kcal), t("kcal")],
                [nf(per100.p, 1), t("protein")],
                [nf(per100.c, 1), t("carbs")],
                [nf(per100.f, 1), t("fat")],
              ] as const
            ).map(([v, label]) => (
              <div key={label} className="rounded-xl bg-secondary py-2.5 flex flex-col items-center">
                <span className="text-sm font-bold tabular">{v}</span>
                <span className="text-[9px] font-medium text-muted-foreground">{label}</span>
              </div>
            ))}
            <span className="col-span-4 text-[10px] text-muted-foreground text-center -mt-1">
              {t("per_100g")}
            </span>
          </div>
        )}

        {/* quantity */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">
              {food.source === "scan" && food.estimatedWeightG && food.estimatedWeightG > 0
                ? t("estimated_weight")
                : t("quantity")}
            </span>
            {food.source === "scan" && food.estimatedWeightG && food.estimatedWeightG > 0 && (
              <span className="text-[10px] font-medium text-primary">{t("estimated_weight_hint")}</span>
            )}
            {hasServing && (
              <div className="w-40">
                <Segmented
                  value={qtyMode}
                  onChange={setQtyMode}
                  options={[
                    { value: "grams", label: t("grams") },
                    { value: "servings", label: t("serving") },
                  ]}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <NumInput
              value={qtyMode === "grams" ? (grams === Math.round(grams) ? Math.round(grams) : grams) : servings}
              onChange={(v) => {
                if (typeof v !== "number" || v < 0) return;
                if (qtyMode === "grams") setGrams(v);
                else setServings(Math.round(v));
              }}
              min={0}
              max={5000}
              decimals={qtyMode === "grams" ? 1 : 0}
              inputMode={qtyMode === "grams" ? "decimal" : "numeric"}
              ariaLabel={t("quantity")}
              className="flex-1 h-13 bg-secondary px-4 text-2xl text-center"
            />
            <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">
              {qtyMode === "grams" ? t("gramsFull") : t("serving")}
            </span>
          </div>

          <div className="flex gap-2 mt-2 flex-wrap">
            {qtyMode === "grams" ? (
              <>
                <QuickChip label={t("quick_50")} onClick={() => setGrams(50)} active={grams === 50} />
                <QuickChip label={t("quick_100")} onClick={() => setGrams(100)} active={grams === 100} />
                {hasServing && (
                  <QuickChip
                    label={`${t("quick_serving")} (${Math.round(food.servingSizeG!)}${t("grams")})`}
                    onClick={() => setGrams(Math.round(food.servingSizeG!))}
                    active={Math.round(grams) === Math.round(food.servingSizeG!)}
                  />
                )}
              </>
            ) : (
              [1, 2, 3].map((s) => (
                <QuickChip
                  key={s}
                  label={`${s} ${t("serving")}`}
                  onClick={() => setServings(s)}
                  active={servings === s}
                />
              ))
            )}
          </div>
        </div>

        {/* meal selector */}
        <div>
          <span className="text-xs font-semibold text-muted-foreground mb-2 block">{t("meal")}</span>
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
        </div>

        {/* live totals */}
        <div className="rounded-[22px] bg-primary/8 border border-primary/15 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="nutra-hero-num text-3xl tabular">{nf(totals.kcal)}</span>
              <span className="text-xs font-bold text-muted-foreground">{t("kcal")}</span>
            </div>
            <span className="text-[11px] font-medium text-muted-foreground">{t("total")}</span>
          </div>
          <div className="mt-2.5 grid grid-cols-3 text-center">
            {(
              [
                [t("protein"), totals.p, "var(--protein)"],
                [t("carbs"), totals.c, "var(--carbs)"],
                [t("fat"), totals.f, "var(--fat)"],
              ] as const
            ).map(([label, v, color]) => (
              <div key={label} className="flex flex-col">
                <span className="text-[10px] font-semibold" style={{ color }}>
                  {label}
                </span>
                <span className="text-base font-bold tabular">
                  {nf(v, 1)}
                  <span className="text-[9px] text-muted-foreground">{t("grams")}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* save to my foods (scan/manual) */}
        {editable && (
          <button
            onClick={() => setSaveToFoods((s) => !s)}
            role="switch"
            aria-checked={saveToFoods}
            className="flex items-center justify-between min-h-[44px] text-start"
          >
            <span className="text-sm font-semibold flex items-center gap-2">
              <span
                className={cn(
                  "size-6 rounded-lg border-2 grid place-items-center transition-colors",
                  saveToFoods ? "bg-primary border-primary" : "border-border"
                )}
              >
                {saveToFoods && <Check className="size-4 text-white" strokeWidth={3} />}
              </span>
              {t("save_to_my_foods")}
            </span>
          </button>
        )}

        {/* notes from AI */}
        {food.notes && (
          <p className="text-[11px] text-muted-foreground text-start leading-relaxed">
            💬 {t("scan_notes")}: {food.notes}
          </p>
        )}
      </div>

      <button
        onClick={submit}
        disabled={addLog.isPending || createFood.isPending}
        className="w-full h-14 mt-4 rounded-full bg-primary text-primary-foreground font-bold text-sm active:scale-[0.97] transition-transform disabled:opacity-60 shadow-lg shadow-primary/25"
      >
        {t("add_to_log")}
      </button>
    </div>
  );
}

function QuickChip({
  label,
  onClick,
  active,
}: {
  label: string;
  onClick: () => void;
  active: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "nutra-chip h-9 px-3.5 text-[12px] transition-all active:scale-95",
        active ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
      )}
    >
      {label}
    </button>
  );
}
