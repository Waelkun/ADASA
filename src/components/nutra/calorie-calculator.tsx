"use client";

import React, { useState } from "react";
import { AlertTriangle, Calculator, Check } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useUpdateProfile, useWeight } from "@/lib/api";
import { ACTIVITY_FACTORS, suggestedMacros, tdee } from "@/lib/nutrition";
import { NumInput } from "./num-input";
import { Segmented } from "./segmented";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type GoalRate = "maintain" | "lose025" | "lose05" | "lose1" | "gain";

const RATES: { id: GoalRate; kcalAdj: number; goalType: "lose" | "maintain" | "gain"; key: string }[] = [
  { id: "maintain", kcalAdj: 0, goalType: "maintain", key: "goal_maintain" },
  { id: "lose025", kcalAdj: -275, goalType: "lose", key: "rate_lose025" },
  { id: "lose05", kcalAdj: -550, goalType: "lose", key: "rate_lose05" },
  { id: "lose1", kcalAdj: -1100, goalType: "lose", key: "rate_lose1" },
  { id: "gain", kcalAdj: 275, goalType: "gain", key: "goal_gain" },
];

/**
 * Calorie calculator (Mifflin-St Jeor only, automatic):
 * activity coefficient + goal options (maintain / lose 0.25-1 kg per week / gain),
 * minimum-kcal warning (1200 women / 1500 men) and a real "اعتمد وحفظ".
 */
export function CalorieCalculator({ profile }: { profile: ProfileT }) {
  const { t, nf } = useI18n();
  const update = useUpdateProfile();
  const { data: weights } = useWeight();

  const [sex, setSex] = useState<"male" | "female">((profile.sex as "male") ?? "male");
  const [age, setAge] = useState<number | "">(new Date().getFullYear() - (profile.birthYear || 1995));
  const [heightCm, setHeightCm] = useState<number | "">(profile.heightCm || 175);
  const [activity, setActivity] = useState(profile.activityLevel || "moderate");
  const [rate, setRate] = useState<GoalRate>(RATES.find((r) => r.goalType === profile.goalType)?.id ?? "lose05");

  const weightKg = weights?.length ? weights[weights.length - 1].weightKg : 80;
  const ageN = typeof age === "number" ? age : 30;
  const hN = typeof heightCm === "number" ? heightCm : 175;

  const tdeeVal = tdee({ sex, weightKg, heightCm: hN, age: ageN, activityLevel: activity });
  const chosen = RATES.find((r) => r.id === rate) ?? RATES[0];
  const minKcal = sex === "female" ? 1200 : 1500;
  const raw = Math.round(tdeeVal + chosen.kcalAdj);
  const belowMin = raw < minKcal;
  const suggested = belowMin ? minKcal : Math.round(raw / 10) * 10;
  const macros = suggestedMacros(suggested, weightKg);

  const adoptAndSave = () =>
    update.mutate(
      {
        sex,
        birthYear: new Date().getFullYear() - Math.round(ageN),
        heightCm: hN,
        activityLevel: activity,
        goalType: chosen.goalType,
        kcalGoal: suggested,
        proteinG: macros.protein,
        carbsG: macros.carbs,
        fatG: macros.fat,
      },
      {
        onSuccess: () => toast.success(t("goal_adopted")),
        onError: () => toast.error(t("error_toast")),
      }
    );

  return (
    <section className="nutra-card p-5 flex flex-col gap-4">
      <h2 className="text-sm font-bold flex items-center gap-2">
        <Calculator className="size-4 text-primary" />
        {t("calculate_tdee")}
      </h2>

      {/* body inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">{t("sex")}</span>
          <Segmented
            value={sex}
            onChange={(v) => setSex(v as "male" | "female")}
            options={[
              { value: "male", label: t("male") },
              { value: "female", label: t("female") },
            ]}
          />
        </div>
        <label className="flex flex-col gap-1.5 min-w-0">
          <span className="text-xs font-semibold text-muted-foreground">{t("onb_age")}</span>
          <NumInput
            value={age}
            onChange={setAge}
            min={10}
            max={100}
            inputMode="numeric"
            ariaLabel={t("onb_age")}
            className="h-11 bg-secondary px-3 text-center"
          />
        </label>
        <label className="flex flex-col gap-1.5 min-w-0">
          <span className="text-xs font-semibold text-muted-foreground">{t("height")}</span>
          <NumInput
            value={heightCm}
            onChange={setHeightCm}
            min={100}
            max={250}
            ariaLabel={t("height")}
            className="h-11 bg-secondary px-3 text-center"
          />
        </label>
        <div className="flex flex-col gap-1.5 min-w-0">
          <span className="text-xs font-semibold text-muted-foreground">{t("weight")}</span>
          <span className="h-11 rounded-2xl bg-secondary/60 grid place-items-center text-sm font-bold tabular text-muted-foreground">
            {nf(weightKg, 1)} {t("kg")}
          </span>
        </div>
      </div>

      {/* activity */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted-foreground">{t("activity")}</span>
        <Segmented
          value={activity}
          onChange={setActivity}
          options={[
            { value: "sedentary", label: t("act_sedentary") },
            { value: "light", label: t("act_light") },
            { value: "moderate", label: t("act_moderate") },
            { value: "active", label: t("act_active") },
            { value: "very_active", label: t("act_very") },
          ]}
        />
      </div>

      {/* goal rate */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted-foreground">{t("goal_type")}</span>
        <div className="flex flex-wrap gap-2">
          {RATES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRate(r.id)}
              className={cn(
                "h-10 px-3.5 rounded-full text-xs font-bold transition-all active:scale-95",
                rate === r.id
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                  : "bg-secondary text-muted-foreground"
              )}
            >
              {t(r.key as "goal_maintain")}
            </button>
          ))}
        </div>
      </div>

      {/* result */}
      <div className="rounded-[18px] bg-accent/60 border border-primary/15 p-4 flex flex-col gap-2">
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t("suggested")} (Mifflin-St Jeor · TDEE × {(ACTIVITY_FACTORS[activity] ?? 1.55).toFixed(2)}):
          <span className="font-bold text-foreground tabular"> {nf(suggested)} {t("kcal")}</span>
          {chosen.kcalAdj !== 0 && (
            <span className="tabular"> ({chosen.kcalAdj > 0 ? "+" : ""}{nf(chosen.kcalAdj)})</span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {t("macro_split_auto")}: {t("protein")} {nf(macros.protein)} · {t("carbs")} {nf(macros.carbs)} · {t("fat")} {nf(macros.fat)} {t("grams")}
        </p>
        {belowMin && (
          <p role="alert" className="flex items-start gap-2 text-xs font-semibold text-negative leading-relaxed">
            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
            {t("min_kcal_warning")} ({nf(minKcal)} {t("kcal")})
          </p>
        )}
        <button
          onClick={adoptAndSave}
          disabled={update.isPending}
          className="self-start h-11 px-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-transform disabled:opacity-60"
        >
          <Check className="size-3.5" />
          {t("adopt_and_save")}
        </button>
      </div>
    </section>
  );
}

// minimal local import alias to avoid a circular import with types
import type { Profile as ProfileT } from "@/lib/types";
