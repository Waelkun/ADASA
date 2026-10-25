"use client";

import React, { useState } from "react";
import { useTheme } from "next-themes";
import { Calculator, Check, RotateCcw, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useProfile, useUpdateProfile, useDemoReset, useWeight } from "@/lib/api";
import { suggestedKcal, suggestedMacros } from "@/lib/nutrition";
import { Segmented } from "../segmented";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import type { Profile } from "@/lib/types";

export function SettingsScreen() {
  const { t } = useI18n();
  const { data: profile, isLoading } = useProfile();

  if (isLoading || !profile) {
    return (
      <div className="flex flex-col gap-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-[22px]" />
        ))}
      </div>
    );
  }

  return <SettingsForm key={profile.id} profile={profile} />;
}

function SettingsForm({ profile }: { profile: Profile }) {
  const { t, nf, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const { data: weights } = useWeight();
  const update = useUpdateProfile();
  const resetDemo = useDemoReset();

  const [form, setForm] = useState({
    displayName: profile.displayName ?? "",
    sex: profile.sex ?? "male",
    birthYear: profile.birthYear ?? 1995,
    heightCm: profile.heightCm ?? 175,
    activityLevel: profile.activityLevel ?? "moderate",
    goalType: profile.goalType ?? "lose",
    kcalGoal: profile.kcalGoal ?? 2100,
    proteinG: profile.proteinG ?? 160,
    carbsG: profile.carbsG ?? 190,
    fatG: profile.fatG ?? 70,
    waterGoalMl: profile.waterGoalMl ?? 2800,
    goalWeightKg: (profile.goalWeightKg ?? "") as string | number,
    workoutsPerWeek: profile.workoutsPerWeek ?? 4,
    units: profile.units ?? "metric",
  });
  const [showSuggestion, setShowSuggestion] = useState(false);

  const latestWeight = weights?.[weights.length - 1]?.weightKg ?? 80;
  const age = new Date().getFullYear() - form.birthYear;
  const sKcal = suggestedKcal({
    sex: form.sex,
    weightKg: latestWeight,
    heightCm: form.heightCm,
    age,
    activityLevel: form.activityLevel,
    goalType: form.goalType,
  });
  const sMacros = suggestedMacros(sKcal, latestWeight);

  const save = () =>
    update.mutate(
      {
        ...form,
        goalWeightKg:
          form.goalWeightKg === "" || !Number.isFinite(Number(form.goalWeightKg))
            ? null
            : Number(form.goalWeightKg),
      },
      {
        onSuccess: () => toast.success(t("settings_saved")),
        onError: () => toast.error(t("error_toast")),
      }
    );

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* daily goals */}
      <section className="nutra-card p-5 flex flex-col gap-4">
        <h2 className="text-sm font-bold">{t("daily_goals")}</h2>
        <NumberRow
          label={t("kcal_goal")}
          value={form.kcalGoal}
          onChange={(v) => setForm((f) => ({ ...f, kcalGoal: v as number }))}
          step={50}
          min={800}
          max={6000}
          unit={t("kcal")}
        />
        <div className="grid grid-cols-3 gap-3">
          <NumField label={t("protein")} value={form.proteinG} onChange={(v) => setForm((f) => ({ ...f, proteinG: v }))} unit={t("grams")} />
          <NumField label={t("carbs")} value={form.carbsG} onChange={(v) => setForm((f) => ({ ...f, carbsG: v }))} unit={t("grams")} />
          <NumField label={t("fat")} value={form.fatG} onChange={(v) => setForm((f) => ({ ...f, fatG: v }))} unit={t("grams")} />
        </div>
        <NumberRow
          label={t("water_goal")}
          value={form.waterGoalMl / 1000}
          onChange={(v) => setForm((f) => ({ ...f, waterGoalMl: Math.round((v as number) * 1000) }))}
          step={0.25}
          min={0.5}
          max={8}
          unit={t("liter")}
          decimals={2}
        />
        <NumberRow
          label={t("goal_weight")}
          value={form.goalWeightKg === "" ? "" : Number(form.goalWeightKg)}
          onChange={(v) => setForm((f) => ({ ...f, goalWeightKg: v }))}
          step={0.5}
          min={30}
          max={300}
          unit={form.units === "imperial" ? t("lb") : t("kg")}
          decimals={1}
          allowEmpty
        />
        <NumberRow
          label={t("workouts_target")}
          value={form.workoutsPerWeek}
          onChange={(v) => setForm((f) => ({ ...f, workoutsPerWeek: Math.round(v as number) }))}
          step={1}
          min={1}
          max={7}
          unit={lang === "ar" ? "/ أسبوع" : "/ wk"}
        />
      </section>

      {/* body profile + calculator */}
      <section className="nutra-card p-5 flex flex-col gap-4">
        <h2 className="text-sm font-bold">{t("body_profile")}</h2>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">{t("display_name")}</span>
          <input
            value={form.displayName}
            onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
            className="h-12 rounded-2xl bg-secondary px-4 text-base font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">{t("sex")}</span>
            <Segmented
              value={form.sex}
              onChange={(v) => setForm((f) => ({ ...f, sex: v }))}
              options={[
                { value: "male", label: t("male") },
                { value: "female", label: t("female") },
              ]}
            />
          </div>
          <NumField label={t("birth_year")} value={form.birthYear} onChange={(v) => setForm((f) => ({ ...f, birthYear: Math.round(v) }))} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <NumField label={t("height")} value={form.heightCm} onChange={(v) => setForm((f) => ({ ...f, heightCm: v }))} unit={t("cm")} />
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">{t("goal_type")}</span>
            <Segmented
              value={form.goalType}
              onChange={(v) => setForm((f) => ({ ...f, goalType: v }))}
              options={[
                { value: "lose", label: t("goal_lose") },
                { value: "maintain", label: t("goal_maintain") },
                { value: "gain", label: t("goal_gain") },
              ]}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">{t("activity")}</span>
          <Segmented
            value={form.activityLevel}
            onChange={(v) => setForm((f) => ({ ...f, activityLevel: v }))}
            options={[
              { value: "sedentary", label: t("act_sedentary") },
              { value: "light", label: t("act_light") },
              { value: "moderate", label: t("act_moderate") },
              { value: "active", label: t("act_active") },
              { value: "very_active", label: t("act_very") },
            ]}
          />
        </div>

        {/* TDEE calculator */}
        <div className="rounded-2xl bg-accent/60 border border-primary/15 p-4 flex flex-col gap-3">
          <button
            onClick={() => setShowSuggestion((s) => !s)}
            className="flex items-center justify-between min-h-[40px]"
          >
            <span className="text-sm font-bold text-accent-foreground flex items-center gap-2">
              <Calculator className="size-4" />
              {t("calculate_tdee")}
            </span>
            <Sparkles className="size-4 text-primary" />
          </button>
          {showSuggestion && (
            <div className="flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-1 duration-300">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("suggested")} (Mifflin-St Jeor · TDEE):{" "}
                <span className="font-bold text-foreground tabular">
                  {nf(sKcal)} {t("kcal")}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                {t("macro_split_auto")}: P {nf(sMacros.protein)} · C {nf(sMacros.carbs)} · F{" "}
                {nf(sMacros.fat)} {t("grams")}
              </p>
              <button
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    kcalGoal: sKcal,
                    proteinG: sMacros.protein,
                    carbsG: sMacros.carbs,
                    fatG: sMacros.fat,
                  }))
                }
                className="self-start h-10 px-4 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-transform"
              >
                <Check className="size-3.5" />
                {t("apply")}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* preferences */}
      <section className="nutra-card p-5 flex flex-col gap-4">
        <h2 className="text-sm font-bold">{t("preferences")}</h2>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">{t("language")}</span>
          <Segmented
            value={lang}
            onChange={(v) => setLang(v as "ar" | "en")}
            options={[
              { value: "ar", label: t("arabic") },
              { value: "en", label: t("english") },
            ]}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">{t("units")}</span>
          <Segmented
            value={form.units}
            onChange={(v) => setForm((f) => ({ ...f, units: v }))}
            options={[
              { value: "metric", label: t("metric") },
              { value: "imperial", label: t("imperial") },
            ]}
          />
        </div>
        <label className="flex items-center justify-between py-1">
          <span className="text-sm font-semibold">{t("dark_mode")}</span>
          <button
            role="switch"
            aria-checked={theme === "dark"}
            aria-label={t("dark_mode")}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={`relative h-8 w-14 rounded-full transition-colors ${
              theme === "dark" ? "bg-primary" : "bg-secondary"
            }`}
          >
            <span
              className={`absolute top-1 size-6 rounded-full bg-card shadow transition-all ${
                theme === "dark" ? "start-7" : "start-1"
              }`}
            />
          </button>
        </label>
      </section>

      {/* demo reset */}
      <section className="nutra-card p-5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{t("data_reset")}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t("data_reset_hint")}</p>
        </div>
        <button
          onClick={() =>
            resetDemo.mutate(undefined, { onSuccess: () => toast.success(t("data_reset_done")) })
          }
          disabled={resetDemo.isPending}
          className="size-11 shrink-0 grid place-items-center rounded-full bg-secondary hover:bg-negative/10 hover:text-negative transition-colors disabled:opacity-50"
          aria-label={t("data_reset")}
        >
          <RotateCcw className={`size-5 ${resetDemo.isPending ? "animate-spin" : ""}`} />
        </button>
      </section>

      <button
        onClick={save}
        disabled={update.isPending}
        className="h-14 rounded-full bg-primary text-primary-foreground font-bold text-sm active:scale-[0.97] transition-transform disabled:opacity-60 shadow-lg shadow-primary/25 sticky bottom-24"
      >
        {update.isPending ? "…" : t("save")}
      </button>
    </div>
  );
}

/* ---------- small field components ---------- */

function NumberRow(props: {
  label: string;
  value: number | "";
  onChange: (v: number | "") => void;
  step: number;
  min: number;
  max: number;
  unit?: string;
  decimals?: number;
  allowEmpty?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-semibold">{props.label}</span>
      <div className="flex items-center gap-2">
        {props.unit && (
          <span className="text-[11px] font-medium text-muted-foreground">{props.unit}</span>
        )}
        <NumStepper {...props} />
      </div>
    </div>
  );
}

function NumStepper({
  value,
  onChange,
  step,
  min,
  max,
  decimals = 0,
  allowEmpty,
}: {
  value: number | "";
  onChange: (v: number | "") => void;
  step: number;
  min: number;
  max: number;
  decimals?: number;
  allowEmpty?: boolean;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const base = value === "" ? min : value;
  return (
    <div className="flex items-center gap-1 bg-secondary rounded-full p-1">
      <button
        aria-label="decrease"
        onClick={() => onChange(clamp(Number((base - step).toFixed(decimals + 1))))}
        className="size-8 rounded-full bg-card text-lg font-bold grid place-items-center shadow-sm active:scale-90 transition-transform"
      >
        −
      </button>
      <input
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "" && allowEmpty) return onChange("");
          const n = Number(v);
          if (Number.isFinite(n)) onChange(clamp(n));
        }}
        inputMode="decimal"
        className="w-14 text-center text-base font-bold tabular bg-transparent focus:outline-none"
        aria-label="value"
      />
      <button
        aria-label="increase"
        onClick={() => onChange(clamp(Number((base + step).toFixed(decimals + 1))))}
        className="size-8 rounded-full bg-card text-lg font-bold grid place-items-center shadow-sm active:scale-90 transition-transform"
      >
        +
      </button>
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  unit,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  unit?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 min-w-0">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <div className="relative">
        <input
          value={value}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n)) onChange(n);
          }}
          inputMode="numeric"
          className="w-full h-12 rounded-2xl bg-secondary px-3 text-base font-bold tabular text-center focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {unit && (
          <span className="absolute end-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-muted-foreground pointer-events-none">
            {unit}
          </span>
        )}
      </div>
    </label>
  );
}
