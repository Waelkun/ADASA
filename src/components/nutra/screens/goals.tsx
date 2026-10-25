"use client";

import React, { useState } from "react";
import { Flame, GlassWater, Dumbbell, Scale, Target, Check } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useToday, useWater, useWeight, useWorkouts, useUpdateProfile, localDayStr } from "@/lib/api";
import { kgToLb } from "@/lib/nutrition";
import { NumInput } from "../num-input";
import { MacroSplitEditor } from "../macro-split-editor";
import { CalorieCalculator } from "../calorie-calculator";
import { ZigzagPlanCard } from "../zigzag-plan";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function GoalRow({
  icon,
  label,
  valueText,
  targetText,
  pct,
  barClass,
}: {
  icon: React.ReactNode;
  label: string;
  valueText: string;
  targetText: string;
  pct: number;
  barClass: string;
}) {
  return (
    <div className="nutra-card p-4 flex flex-col gap-2.5">
      <div className="flex items-center gap-3">
        <span className="size-10 rounded-2xl bg-secondary grid place-items-center shrink-0">
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-muted-foreground">{label}</p>
          <p className="text-base font-bold tabular leading-tight">
            {valueText}
            <span className="text-xs font-semibold text-muted-foreground"> {targetText}</span>
          </p>
        </div>
        <span className="text-sm font-bold tabular text-muted-foreground">
          {Math.round(Math.min(pct, 9.99) * 100)}%
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", barClass)}
          style={{ width: `${Math.min(pct, 1) * 100}%` }}
        />
      </div>
    </div>
  );
}

/** الأهداف tab — progress vs every daily target + the goal editors (21-25) */
export function GoalsScreen() {
  const { t, nf } = useI18n();
  const { data: today, isLoading } = useToday();
  const { data: water } = useWater();
  const { data: weights } = useWeight();
  const update = useUpdateProfile();
  const month = localDayStr().slice(0, 7);
  const { data: workouts } = useWorkouts(month);

  // daily-goal editors (water / goal weight / workouts per week)
  const [waterGoalL, setWaterGoalL] = useState<number | "">(2.8);
  const [goalWeight, setGoalWeight] = useState<number | "">("");
  const [workoutsWk, setWorkoutsWk] = useState<number | "">(4);
  const [editorsInit, setEditorsInit] = useState(false);
  // sync prefills once when the profile arrives (adjust-state-during-render pattern)
  const [prevProfile, setPrevProfile] = useState(today?.profile);
  if (prevProfile !== today?.profile) {
    setPrevProfile(today?.profile);
    if (today?.profile && !editorsInit) {
      setEditorsInit(true);
      setWaterGoalL(today.profile.waterGoalMl / 1000);
      setGoalWeight(today.profile.goalWeightKg ?? "");
      setWorkoutsWk(today.profile.workoutsPerWeek);
    }
  }

  if (isLoading || !today?.profile) {
    return (
      <div className="flex flex-col gap-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-[22px]" />
        ))}
      </div>
    );
  }

  const profile = today.profile;
  const totals = today.totals ?? { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  const imperial = profile.units === "imperial";

  const waterTotal = water?.total ?? 0;
  const waterGoal = profile.waterGoalMl ?? 2800;
  const thisWeek = workouts?.stats?.thisWeekCount ?? 0;
  const weekTarget = profile.workoutsPerWeek ?? 4;

  const latestW = weights?.length ? weights[weights.length - 1].weightKg : null;
  const goalW = profile.goalWeightKg ?? null;
  const fmtW = (kg: number) => nf(imperial ? kgToLb(kg) : kg, 1);
  const wUnit = imperial ? t("lb") : t("kg");

  const goalsDirty =
    Math.round((Number(waterGoalL) || 0) * 1000) !== profile.waterGoalMl ||
    (goalWeight === "" ? profile.goalWeightKg != null : goalWeight !== profile.goalWeightKg) ||
    Number(workoutsWk || 0) !== profile.workoutsPerWeek;

  const saveGoals = () =>
    update.mutate(
      {
        waterGoalMl: Math.round((Number(waterGoalL) || 2.8) * 1000),
        goalWeightKg: goalWeight === "" ? null : Number(goalWeight),
        workoutsPerWeek: Number(workoutsWk || 4),
      },
      {
        onSuccess: () => toast.success(t("settings_saved")),
        onError: () => toast.error(t("error_toast")),
      }
    );

  return (
    <div className="flex flex-col gap-3">
      {/* header */}
      <div className="flex items-center gap-2 px-1 pt-1">
        <h1 className="flex items-center gap-2 text-base font-extrabold">
          <span className="size-9 rounded-2xl bg-primary/12 text-primary grid place-items-center">
            <Target className="size-5" />
          </span>
          {t("tab_goals")}
        </h1>
      </div>

      <GoalRow
        icon={<Flame className="size-5 text-negative" />}
        label={`${t("kcal")} · ${t("logged_today")}`}
        valueText={nf(totals.kcal)}
        targetText={`/ ${nf(profile?.kcalGoal ?? 2100)} ${t("kcal")}`}
        pct={totals.kcal / (profile?.kcalGoal ?? 2100)}
        barClass="bg-negative"
      />
      <GoalRow
        icon={<span className="size-3 rounded-full" style={{ background: "var(--protein)" }} />}
        label={t("protein")}
        valueText={nf(totals.protein, 1)}
        targetText={`/ ${nf(profile?.proteinG ?? 160)} ${t("grams")}`}
        pct={totals.protein / (profile?.proteinG ?? 160)}
        barClass="bg-[var(--protein)]"
      />
      <GoalRow
        icon={<span className="size-3 rounded-full" style={{ background: "var(--carbs)" }} />}
        label={t("carbs")}
        valueText={nf(totals.carbs, 1)}
        targetText={`/ ${nf(profile?.carbsG ?? 190)} ${t("grams")}`}
        pct={totals.carbs / (profile?.carbsG ?? 190)}
        barClass="bg-[var(--carbs)]"
      />
      <GoalRow
        icon={<span className="size-3 rounded-full" style={{ background: "var(--fat)" }} />}
        label={t("fat")}
        valueText={nf(totals.fat, 1)}
        targetText={`/ ${nf(profile?.fatG ?? 70)} ${t("grams")}`}
        pct={totals.fat / (profile?.fatG ?? 70)}
        barClass="bg-[var(--fat)]"
      />
      <GoalRow
        icon={<GlassWater className="size-5 text-water" />}
        label={t("water")}
        valueText={nf(waterTotal)}
        targetText={`/ ${nf(waterGoal)} ${t("ml")}`}
        pct={waterTotal / waterGoal}
        barClass="bg-water"
      />
      <GoalRow
        icon={<Dumbbell className="size-5 text-primary" />}
        label={t("workouts_week")}
        valueText={nf(thisWeek)}
        targetText={`/ ${nf(weekTarget)}`}
        pct={thisWeek / weekTarget}
        barClass="bg-primary"
      />

      {/* goal weight */}
      <div className="nutra-card p-4 flex items-center gap-3">
        <span className="size-10 rounded-2xl bg-secondary grid place-items-center shrink-0">
          <Scale className="size-5 text-muted-foreground" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-muted-foreground">{t("goal_weight")}</p>
          {goalW != null && latestW != null ? (
            <>
              <p className="text-base font-bold tabular leading-tight">
                {t("goals_now")} {fmtW(latestW)} {wUnit}
                <span className="text-xs font-semibold text-muted-foreground">
                  {" "}
                  → {t("goal")} {fmtW(goalW)} {wUnit}
                </span>
              </p>
              {latestW - goalW > 0 && (
                <p className="text-[11px] font-semibold text-primary tabular">
                  {t("goals_left")}: {fmtW(latestW - goalW)} {wUnit}
                </p>
              )}
            </>
          ) : (
            <p className="text-xs font-medium text-muted-foreground leading-relaxed">
              {t("goals_weight_hint")}
            </p>
          )}
        </div>
        {goalW != null && latestW != null && latestW - goalW <= 0 && (
          <span className="nutra-chip bg-positive/12 text-positive">✓</span>
        )}
      </div>

      {/* ===== goal editors (moved from Settings — item 21) ===== */}
      <section className="nutra-card p-5 flex flex-col gap-4">
        <h2 className="text-sm font-bold">{t("daily_goals")}</h2>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold">{t("water_goal")}</span>
          <div className="relative w-32">
            <NumInput
              value={waterGoalL}
              onChange={setWaterGoalL}
              min={0.5}
              max={8}
              decimals={2}
              ariaLabel={t("water_goal")}
              className="w-full h-11 bg-secondary px-3 text-center"
            />
            <span className="absolute end-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-muted-foreground pointer-events-none">{t("liter")}</span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold">{t("goal_weight")}</span>
          <div className="relative w-32">
            <NumInput
              value={goalWeight}
              onChange={setGoalWeight}
              min={30}
              max={300}
              decimals={1}
              allowEmpty
              ariaLabel={t("goal_weight")}
              className="w-full h-11 bg-secondary px-3 text-center"
            />
            <span className="absolute end-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-muted-foreground pointer-events-none">{imperial ? t("lb") : t("kg")}</span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold">{t("workouts_target")}</span>
          <NumInput
            value={workoutsWk}
            onChange={setWorkoutsWk}
            min={1}
            max={7}
            inputMode="numeric"
            ariaLabel={t("workouts_target")}
            className="w-32 h-11 bg-secondary px-3 text-center"
          />
        </div>
        <button
          onClick={() =>
            update.mutate(
              {
                waterGoalMl: Math.round((Number(waterGoalL) || 2.8) * 1000),
                goalWeightKg: goalWeight === "" ? null : Number(goalWeight),
                workoutsPerWeek: Number(workoutsWk || 4),
              },
              {
                onSuccess: () => toast.success(t("settings_saved")),
                onError: () => toast.error(t("error_toast")),
              }
            )
          }
          disabled={
            update.isPending ||
            (Math.round((Number(waterGoalL) || 0) * 1000) === profile.waterGoalMl &&
              (goalWeight === "" ? profile.goalWeightKg == null : goalWeight === profile.goalWeightKg) &&
              Number(workoutsWk || 0) === profile.workoutsPerWeek)
          }
          className="h-12 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-transform disabled:opacity-40 shadow-lg shadow-primary/25"
        >
          <Check className="size-4" />
          {t("save")}
        </button>
      </section>

      {/* macro split editor (kcal from macros + percent ↔ grams) — base goal */}
      <MacroSplitEditor
        kcalGoal={profile.kcalGoalBase ?? profile.kcalGoal}
        proteinG={profile.proteinG}
        carbsG={profile.carbsG}
        fatG={profile.fatG}
      />

      {/* calorie calculator (Mifflin-St Jeor) */}
      <CalorieCalculator profile={profile} />

      {/* calorie zigzag — always on the BASE target */}
      <ZigzagPlanCard
        baseKcal={profile.kcalGoalBase ?? profile.kcalGoal}
        plan={profile.zigzagPlan ?? null}
        start={profile.zigzagStart ?? null}
      />
    </div>
  );
}
