"use client";

import React, { useState } from "react";
import { TrendingUp, Dumbbell, TrendingDown, Minus, ChevronRight, Loader2, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useI18n } from "@/lib/i18n";
import { useUpdateProfile, useWeight, useLogWeight, localDayStr } from "@/lib/api";
import { kgToLb, lbToKg } from "@/lib/nutrition";
import type { Profile } from "@/lib/types";
import { NumInput } from "./num-input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Goal = "lose" | "maintain" | "gain";

const GOALS: { id: Goal; key: "goal_lose" | "goal_maintain" | "goal_gain"; icon: React.ElementType }[] = [
  { id: "lose", key: "goal_lose", icon: TrendingDown },
  { id: "maintain", key: "goal_maintain", icon: Minus },
  { id: "gain", key: "goal_gain", icon: TrendingUp },
];

const THEMES = [
  { id: "light", key: "onb_theme_light", icon: Sun },
  { id: "dark", key: "onb_theme_dark", icon: Moon },
] as const;

/**
 * Welcome screen for a fresh account (profile.onboardingCompleted == null):
 * 3 steps — name → theme → goals (weight & age prefilled from the last entry).
 * تخطي skips the current step; لاحقاً skips everything.
 */
export function OnboardingScreen({ profile }: { profile: Profile }) {
  const { t } = useI18n();
  const update = useUpdateProfile();
  const { theme, setTheme } = useTheme();
  const { data: weights } = useWeight();
  const logWeight = useLogWeight();
  const [step, setStep] = useState(0); // 0 name · 1 theme · 2 goals
  const [name, setName] = useState("");
  const [goal, setGoal] = useState<Goal>((profile.goalType as Goal) ?? "lose");

  const isImp = profile.units === "imperial";
  // weight prefills from the LAST recorded weight (syncs until touched)
  const lastW = weights?.length ? weights[weights.length - 1].weightKg : null;
  const defaultWeight = isImp ? 175 : 80;
  const initialWeight = lastW != null
    ? (isImp ? Math.round(kgToLb(lastW) * 10) / 10 : lastW)
    : defaultWeight;
  const [weightEdit, setWeightEdit] = useState<number | "">(initialWeight);
  const [weightTouched, setWeightTouched] = useState(false);
  const weightValue = weightTouched ? weightEdit : initialWeight;

  // age prefills from the profile birth year (syncs until touched)
  const [ageEdit, setAgeEdit] = useState<number | "">(30);
  const [ageTouched, setAgeTouched] = useState(false);
  const ageValue = ageTouched
    ? ageEdit
    : profile.birthYear
      ? new Date().getFullYear() - profile.birthYear
      : ageEdit;

  /** finish the welcome flow. save=true keeps the user's picks */
  const finish = (save: boolean) => {
    const patch: Record<string, unknown> = { onboardingCompleted: true };
    let saveWeight: number | null = null;
    if (save) {
      if (name.trim()) patch.displayName = name.trim().slice(0, 40);
      patch.goalType = goal;
      const minW = isImp ? 55 : 25;
      const maxW = isImp ? 770 : 350;
      if (typeof weightValue === "number" && weightValue >= minW && weightValue <= maxW && (weightTouched || lastW == null)) {
        saveWeight = isImp ? lbToKg(weightValue) : weightValue;
      }
      if (typeof ageValue === "number" && ageValue >= 10 && ageValue <= 100) {
        patch.birthYear = new Date().getFullYear() - Math.round(ageValue);
      }
    }
    update.mutate(patch, {
      onSuccess: () => {
        if (saveWeight != null) {
          logWeight.mutate({ date: localDayStr(), weightKg: Math.round(saveWeight * 10) / 10 });
        }
        toast.success(t("saved_toast"));
      },
      onError: () => toast.error(t("error_toast")),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-0 md:p-8 overflow-y-auto">
      <div className="mx-auto w-full max-w-md flex-1 md:flex-initial flex flex-col px-6 pt-safe pb-[max(env(safe-area-inset-bottom),24px)] md:p-8 md:rounded-[32px] md:bg-card md:border md:border-border/60 md:shadow-2xl md:shadow-primary/5">
        {/* step announcement for assistive technologies */}
        <div className="sr-only" role="status" aria-live="polite">
          {step === 0 ? t("onb_step_1") : step === 1 ? t("onb_step_2") : t("onb_step_3")}
        </div>

        {/* progress dots */}
        <div className="flex items-center justify-center gap-2 pt-6 pb-2" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i === step ? "w-7 bg-primary" : "w-2 bg-secondary"
              )}
            />
          ))}
        </div>

        <div className="flex-1 flex flex-col justify-center gap-6 py-6 nutra-anim-in" key={step}>
          {/* step 0 — name */}
          {step === 0 && (
            <div className="flex flex-col items-center gap-4 text-center">
              <img src="/icons/icon-192.png" alt="عدسة" className="size-20 rounded-[26px] shadow-lg shadow-primary/20" />
              <h1 className="text-2xl font-extrabold leading-snug">{t("onb_title")}</h1>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{t("onb_sub")}</p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("onb_name_ph")}
                aria-label={t("onb_name_ph")}
                maxLength={40}
                className="w-full h-13 rounded-[18px] bg-secondary px-4 text-base font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          )}

          {/* step 1 — theme */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-extrabold">{t("onb_theme_q")}</h1>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {THEMES.map((th) => (
                  <button
                    key={th.id}
                    onClick={() => setTheme(th.id)}
                    aria-pressed={theme === th.id}
                    className={cn(
                      "nutra-card p-6 min-h-[120px] flex flex-col items-center justify-center gap-3 transition-all active:scale-[0.97]",
                      theme === th.id ? "ring-2 ring-primary/60 bg-accent" : "opacity-80"
                    )}
                  >
                    <span
                      className={cn(
                        "size-12 rounded-2xl grid place-items-center",
                        th.id === "light" ? "bg-secondary text-carbs-text" : "bg-[#0b1210] text-primary"
                      )}
                    >
                      <th.icon className="size-6" />
                    </span>
                    <span className="text-base font-bold">{t(th.key)}</span>
                    {theme === th.id && <span className="size-2 rounded-full bg-primary" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* step 2 — goals + weight + age */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-extrabold">{t("onb_goal_q")}</h1>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">{t("onb_goal_sub")}</p>
              </div>
              <div className="flex flex-col gap-3">
                {GOALS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGoal(g.id)}
                    aria-pressed={goal === g.id}
                    className={cn(
                      "nutra-card p-4 min-h-[64px] flex items-center gap-3.5 text-start transition-all active:scale-[0.97]",
                      goal === g.id ? "ring-2 ring-primary/60 bg-accent" : "opacity-80"
                    )}
                  >
                    <span
                      className={cn(
                        "size-11 rounded-2xl grid place-items-center shrink-0",
                        goal === g.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                      )}
                    >
                      <g.icon className="size-5" />
                    </span>
                    <span className="text-base font-bold">{t(g.key)}</span>
                    {goal === g.id && (
                      <span className="ms-auto size-6 rounded-full bg-primary grid place-items-center">
                        <span className="size-2 rounded-full bg-white" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5 min-w-0">
                  <span className="text-xs font-semibold text-muted-foreground text-center">{t("onb_weight")}</span>
                  <div className="relative">
                    <NumInput
                      value={weightValue}
                      onChange={(v) => {
                        setWeightEdit(v);
                        setWeightTouched(true);
                      }}
                      min={isImp ? 55 : 25}
                      max={isImp ? 770 : 350}
                      decimals={1}
                      placeholder={String(defaultWeight)}
                      ariaLabel={t("onb_weight")}
                      className="w-full h-12 bg-secondary ps-2 pe-10 text-center text-base font-bold tabular"
                    />
                    <span className="absolute end-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground pointer-events-none">{isImp ? t("lb") : t("kg")}</span>
                  </div>
                </label>
                <label className="flex flex-col gap-1.5 min-w-0">
                  <span className="text-xs font-semibold text-muted-foreground text-center">{t("onb_age")}</span>
                  <NumInput
                    value={ageValue}
                    onChange={(v) => {
                      setAgeEdit(v);
                      setAgeTouched(true);
                    }}
                    min={10}
                    max={100}
                    inputMode="numeric"
                    ariaLabel={t("onb_age")}
                    className="w-full h-12 bg-secondary px-3 text-center text-base font-bold tabular"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* actions */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="size-14 rounded-full bg-secondary text-foreground grid place-items-center shrink-0 active:scale-95 transition-transform"
                aria-label={t("onb_back")}
              >
                <ChevronRight className="size-6 rtl:rotate-0 ltr:rotate-180" />
              </button>
            )}
            {step < 2 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="flex-1 h-14 rounded-full bg-primary text-primary-foreground font-bold text-base active:scale-[0.97] transition-transform shadow-lg shadow-primary/25"
              >
                {t("next")}
              </button>
            ) : (
              <button
                onClick={() => finish(true)}
                disabled={update.isPending}
                className="flex-1 h-14 rounded-full bg-primary text-primary-foreground font-bold text-base active:scale-[0.97] transition-transform shadow-lg shadow-primary/25 disabled:opacity-60"
              >
                {update.isPending ? <Loader2 className="size-6 animate-spin mx-auto" /> : t("onb_start")}
              </button>
            )}
          </div>
          {/* skip current step · skip everything */}
          <div className="flex items-center justify-center gap-8">
            <button
              onClick={() => (step < 2 ? setStep(step + 1) : finish(false))}
              className="min-h-[44px] px-4 text-sm font-semibold text-muted-foreground active:scale-95 transition-transform"
            >
              {t("onb_skip")}
            </button>
            <button
              onClick={() => finish(false)}
              className="min-h-[44px] px-4 text-sm font-semibold text-muted-foreground active:scale-95 transition-transform"
            >
              {t("onb_later")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
