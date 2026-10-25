"use client";

import React, { useState } from "react";
import { Check, Lock, Unlock } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useUpdateProfile } from "@/lib/api";
import { NumInput } from "./num-input";
import { Segmented } from "./segmented";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/** kcal per gram */
const KCAL_G = { p: 4, c: 4, f: 9 } as const;
type MK = keyof typeof KCAL_G;

const pct1 = (v: number) => Math.round(v * 10) / 10;

/**
 * Macro split editor (items: kcal-from-macros + percentages ↔ grams):
 * - غرامات mode: free gram inputs; kcal & percentages derive from them
 * - نسب mode: percentage inputs; with "تثبيت السعرات" ON, increasing one
 *   percentage takes from the others so the total is always 100%
 * - shows kcal computed from macros (protein×4 + carbs×4 + fat×9) + each % of 100
 */
export function MacroSplitEditor({
  kcalGoal,
  proteinG,
  carbsG,
  fatG,
}: {
  kcalGoal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}) {
  const { t, nf } = useI18n();
  const update = useUpdateProfile();

  const [mode, setMode] = useState<"grams" | "percent">("grams");
  const [lock, setLock] = useState(true);
  const [kcal, setKcal] = useState(kcalGoal);
  const [grams, setGrams] = useState({ p: proteinG, c: carbsG, f: fatG });

  const kcalFromMacros = Math.round(KCAL_G.p * grams.p + KCAL_G.c * grams.c + KCAL_G.f * grams.f);
  // percentage = each macro's share of the macro-kcal (always of 100)
  const pctOf = (k: MK) =>
    kcalFromMacros > 0 ? pct1((KCAL_G[k] * grams[k] * 100) / kcalFromMacros) : 0;
  const pcts = { p: pctOf("p"), c: pctOf("c"), f: pctOf("f") };
  const pctSum = pct1(pcts.p + pcts.c + pcts.f);

  /** grams for a macro from its percentage of a fixed kcal target */
  const gramsFromPct = (k: MK, pct: number, kcalTarget: number) =>
    Math.round(((pct / 100) * kcalTarget) / KCAL_G[k]);

  /** percent-mode change: rebalance others when locked so the total = 100 */
  const setPct = (k: MK, rawPct: number) => {
    const x = Math.min(100, Math.max(0, pct1(rawPct)));
    if (lock) {
      // remaining budget distributed among the others by their current ratio
      const others = (["p", "c", "f"] as MK[]).filter((o) => o !== k);
      const rest = 100 - x;
      const curRest = others.reduce((a, o) => a + pcts[o], 0);
      const next = { ...pcts, [k]: x } as Record<MK, number>;
      if (curRest > 0) {
        others.forEach((o) => (next[o] = pct1((pcts[o] / curRest) * rest)));
      } else {
        others.forEach((o) => (next[o] = pct1(rest / others.length)));
      }
      setGrams({ p: gramsFromPct("p", next.p, kcal), c: gramsFromPct("c", next.c, kcal), f: gramsFromPct("f", next.f, kcal) });
    } else {
      // unlocked: only this macro's grams change, kcal stays
      setGrams((g) => ({ ...g, [k]: gramsFromPct(k, x, kcal) }));
    }
  };

  /** kcal change in percent mode rescales all grams to the new target */
  const setKcalAndRescale = (v: number | "") => {
    if (typeof v !== "number") return;
    setKcal(v);
    if (mode === "percent") {
      setGrams({
        p: gramsFromPct("p", pcts.p, v),
        c: gramsFromPct("c", pcts.c, v),
        f: gramsFromPct("f", pcts.f, v),
      });
    }
  };

  const dirty =
    grams.p !== proteinG || grams.c !== carbsG || grams.f !== fatG || kcal !== kcalGoal;

  const save = () =>
    update.mutate(
      {
        kcalGoal: Math.round(kcal),
        proteinG: Math.round(grams.p),
        carbsG: Math.round(grams.c),
        fatG: Math.round(grams.f),
      },
      {
        onSuccess: () => toast.success(t("settings_saved")),
        onError: () => toast.error(t("error_toast")),
      }
    );

  const rows: { k: MK; label: string; color: string }[] = [
    { k: "p", label: t("protein"), color: "var(--protein)" },
    { k: "c", label: t("carbs"), color: "var(--carbs)" },
    { k: "f", label: t("fat"), color: "var(--fat)" },
  ];

  return (
    <section className="nutra-card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold">{t("macro_split_editor")}</h2>
        <div className="w-44">
          <Segmented
            ariaLabel={t("macro_split_editor")}
            value={mode}
            onChange={(v) => setMode(v as "grams" | "percent")}
            options={[
              { value: "grams", label: t("gramsFull") },
              { value: "percent", label: "%" },
            ]}
          />
        </div>
      </div>

      {/* kcal target (percent mode: rescales grams; grams mode: derived) */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold">{t("kcal_goal")}</span>
        {mode === "percent" ? (
          <NumInput
            value={kcal}
            onChange={setKcalAndRescale}
            min={800}
            max={6000}
            step={10}
            ariaLabel={t("kcal_goal")}
            className="w-28 h-11 bg-secondary px-3 text-center"
          />
        ) : (
          <span className="text-sm font-bold tabular">
            {nf(kcalFromMacros)} {t("kcal")}
            <span className="text-[10px] font-medium text-muted-foreground block text-center">
              {t("kcal_from_macros")}
            </span>
          </span>
        )}
      </div>

      {/* rows */}
      <div className="flex flex-col gap-2.5">
        {rows.map(({ k, label, color }) => (
          <div key={k} className="flex items-center gap-3">
            <span className="size-2.5 rounded-full shrink-0" style={{ background: color }} />
            <span className="text-sm font-semibold w-24 shrink-0 truncate">{label}</span>
            {mode === "grams" ? (
              <NumInput
                value={Math.round(grams[k])}
                onChange={(v) =>
                  setGrams((g) => ({ ...g, [k]: typeof v === "number" ? v : g[k] }))
                }
                min={0}
                max={800}
                ariaLabel={label}
                className="flex-1 h-11 bg-secondary px-3 text-center"
              />
            ) : (
              <NumInput
                value={pcts[k]}
                onChange={(v) => setPct(k, typeof v === "number" ? v : 0)}
                min={0}
                max={100}
                decimals={1}
                ariaLabel={label}
                className="flex-1 h-11 bg-secondary px-3 text-center"
              />
            )}
            <span className="text-[10px] font-bold text-muted-foreground w-14 text-end tabular">
              {mode === "grams" ? `${pcts[k]}%` : `${nf(grams[k])}${t("grams")}`}
            </span>
          </div>
        ))}
      </div>

      {/* sum lock (percent mode) + kcal-from-macros readout */}
      <div className="flex items-center justify-between gap-2">
        <button
          role="switch"
          aria-checked={lock}
          aria-label={t("lock_kcal")}
          onClick={() => setLock((s) => !s)}
          disabled={mode !== "percent"}
          className={cn(
            "flex items-center gap-2 min-h-[40px] px-3 rounded-full text-xs font-bold transition-colors",
            mode === "percent" ? "bg-secondary text-foreground" : "opacity-40"
          )}
        >
          {lock ? <Lock className="size-3.5 text-primary" /> : <Unlock className="size-3.5" />}
          {t("lock_kcal")}
        </button>
        {mode === "percent" && (
          <span
            className={cn(
              "nutra-chip tabular",
              Math.abs(pctSum - 100) < 0.5 ? "bg-positive/12 text-positive" : "bg-negative/12 text-negative"
            )}
          >
            {nf(pctSum)}%
          </span>
        )}
      </div>
      {/* kcal-from-macros readout (protein×4 + carbs×4 + fat×9) */}
      <p className="text-[11px] text-muted-foreground leading-relaxed text-center">
        {t("kcal_from_macros")} ({t("kcal_formula")}):{" "}
        <span className="font-bold text-foreground tabular">{nf(kcalFromMacros)} {t("kcal")}</span>
        {" · "}{t("protein")} {nf(pcts.p)}% · {t("carbs")} {nf(pcts.c)}% · {t("fat")} {nf(pcts.f)}%
      </p>
      <p className="text-[11px] text-muted-foreground leading-relaxed text-center">
        {t("macro_editor_hint")}
      </p>

      <button
        onClick={save}
        disabled={!dirty || update.isPending}
        className="h-12 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-transform disabled:opacity-40 shadow-lg shadow-primary/25"
      >
        <Check className="size-4" />
        {t("save")}
      </button>
    </section>
  );
}
