"use client";

import React, { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useUpdateFoodLog } from "@/lib/api";
import type { FoodLog } from "@/lib/types";
import { SheetShell } from "./sheet-shell";
import { ProductThumb } from "../product-thumb";
import { toast } from "sonner";

/**
 * Per-100g values of a log entry — stored values if present,
 * otherwise derived from stored totals (kcal ÷ grams × 100).
 * Returns null when weight editing is impossible (no per-100g basis).
 */
export function per100OfLog(l: FoodLog): {
  kcal100: number;
  p: number;
  c: number;
  f: number;
} | null {
  if (l.kcal100 != null && l.kcal100 > 0) {
    return {
      kcal100: l.kcal100,
      p: l.protein100 ?? 0,
      c: l.carbs100 ?? 0,
      f: l.fat100 ?? 0,
    };
  }
  if (l.grams > 0) {
    const k = 100 / l.grams; // grams > 0 → no division by zero
    return {
      kcal100: l.kcal * k,
      p: l.proteinG * k,
      c: l.carbsG * k,
      f: l.fatG * k,
    };
  }
  return null;
}

/** small sheet: edit the grams of a logged entry; kcal/macros recompute proportionally */
export function EditGramsSheet({
  log,
  onClose,
}: {
  log: FoodLog | null;
  onClose: () => void;
}) {
  const { t, nf } = useI18n();
  const updateLog = useUpdateFoodLog();

  const canEdit = log != null && per100OfLog(log) != null;
  const open = canEdit;

  return (
    <SheetShell
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={t("edit_amount")}
    >
      {open && log && canEdit && (
        <EditGramsForm key={log.id} log={log} onClose={onClose} />
      )}
    </SheetShell>
  );
}

function EditGramsForm({ log, onClose }: { log: FoodLog; onClose: () => void }) {
  const { t, nf } = useI18n();
  const updateLog = useUpdateFoodLog();
  const per100 = per100OfLog(log)!;

  const [grams, setGrams] = useState(String(Math.round(log.grams)));

  const g = Math.max(0, Number(grams) || 0);
  const totals = useMemo(() => {
    const k = g / 100;
    return {
      kcal: Math.round(per100.kcal100 * k),
      p: Math.round(per100.p * k * 10) / 10,
      c: Math.round(per100.c * k * 10) / 10,
      f: Math.round(per100.f * k * 10) / 10,
    };
  }, [g, per100]);

  const save = () => {
    if (!Number.isFinite(g) || g <= 0) {
      toast.error(t("error_toast"));
      return;
    }
    updateLog.mutate(
      {
        id: log.id,
        grams: Math.round(g),
        kcal: totals.kcal,
        proteinG: totals.p,
        carbsG: totals.c,
        fatG: totals.f,
        // keep/derive per-100g so future edits stay consistent
        kcal100: Math.round(per100.kcal100),
        protein100: Math.round(per100.p * 10) / 10,
        carbs100: Math.round(per100.c * 10) / 10,
        fat100: Math.round(per100.f * 10) / 10,
      },
      {
        onSuccess: () => {
          toast.success(t("saved_toast"));
          onClose();
        },
        onError: () => toast.error(t("error_toast")),
      }
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* item */}
      <div className="flex items-center gap-3">
        <ProductThumb src={log.imageUrl} name={log.name} className="size-12 rounded-2xl" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold truncate">{log.name}</p>
          <p className="text-xs text-muted-foreground tabular">
            {nf(per100.kcal100)} {t("kcal")}/{t("per_100g")}
          </p>
        </div>
      </div>

      {/* grams input — 16px+ font, 48px height (no mobile zoom, easy touch) */}
      <div className="nutra-card p-5 flex flex-col items-center gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">{t("quantity")}</span>
        <div className="flex items-baseline gap-2">
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={grams}
            aria-label={t("quantity")}
            onChange={(e) => setGrams(e.target.value)}
            className="w-36 text-center nutra-hero-num text-5xl tabular bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-sm font-bold text-muted-foreground">{t("gramsFull")}</span>
        </div>
        {/* quick chips */}
        <div className="flex gap-2 mt-2">
          {[50, 100, 200].map((v) => (
            <button
              key={v}
              onClick={() => setGrams(String(v))}
              className="nutra-chip h-11 px-4 text-[13px] bg-secondary text-secondary-foreground tabular active:scale-95 transition-transform"
            >
              {v}
              {t("grams")}
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

      <button
        onClick={save}
        disabled={updateLog.isPending}
        className="w-full h-14 rounded-full bg-primary text-primary-foreground font-bold text-sm active:scale-[0.97] transition-transform disabled:opacity-60 shadow-lg shadow-primary/25"
      >
        {t("save")}
      </button>
    </div>
  );
}
