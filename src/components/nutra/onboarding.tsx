"use client";

import React, { useState } from "react";
import { ScanLine, TrendingUp, Dumbbell, TrendingDown, Minus, ChevronLeft, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useUpdateProfile } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Goal = "lose" | "maintain" | "gain";

const FEATURES = [
  { key: "onb_f1" as const, icon: ScanLine, color: "text-primary bg-primary/12" },
  { key: "onb_f2" as const, icon: TrendingUp, color: "text-carbs bg-carbs/12" },
  { key: "onb_f3" as const, icon: Dumbbell, color: "text-water bg-water/12" },
];

const GOALS: { id: Goal; key: "goal_lose" | "goal_maintain" | "goal_gain"; icon: React.ElementType }[] = [
  { id: "lose", key: "goal_lose", icon: TrendingDown },
  { id: "maintain", key: "goal_maintain", icon: Minus },
  { id: "gain", key: "goal_gain", icon: TrendingUp },
];

/**
 * Welcome screen for a fresh account (profile.onboardingCompleted == null).
 * The app waits for the profile to load, then routes here until completed.
 */
export function OnboardingScreen() {
  const { t } = useI18n();
  const update = useUpdateProfile();
  const [step, setStep] = useState(0); // 0 welcome · 1 goal · 2 ready
  const [goal, setGoal] = useState<Goal>("lose");

  const finish = () => {
    update.mutate(
      { goalType: goal, onboardingCompleted: true },
      {
        onSuccess: () => toast.success(t("saved_toast")),
        onError: () => toast.error(t("error_toast")),
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="mx-auto w-full max-w-md flex-1 flex flex-col px-6 pt-safe pb-[max(env(safe-area-inset-bottom),24px)]">
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
          {step === 0 && (
            <>
              <div className="flex flex-col items-center gap-3 text-center">
                <img src="/logo.svg" alt="Nutra" className="size-20 rounded-[26px] shadow-lg shadow-primary/20" />
                <h1 className="text-2xl font-extrabold leading-snug">{t("onb_title")}</h1>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{t("onb_sub")}</p>
              </div>
              <ul className="flex flex-col gap-3">
                {FEATURES.map((f) => (
                  <li key={f.key} className="nutra-card p-4 flex items-center gap-3.5">
                    <span className={cn("size-11 rounded-2xl grid place-items-center shrink-0", f.color)}>
                      <f.icon className="size-5" />
                    </span>
                    <p className="text-sm font-semibold leading-relaxed">{t(f.key)}</p>
                  </li>
                ))}
              </ul>
            </>
          )}

          {step === 1 && (
            <>
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
            </>
          )}

          {step === 2 && (
            <div className="flex flex-col items-center gap-4 text-center">
              <span className="size-24 rounded-full bg-primary/12 grid place-items-center">
                <img src="/logo.svg" alt="Nutra" className="size-16 rounded-[22px]" />
              </span>
              <h1 className="text-2xl font-extrabold">{t("onb_ready")}</h1>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{t("onb_ready_sub")}</p>
            </div>
          )}
        </div>

        {/* actions */}
        <div className="flex items-center gap-2.5">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="size-14 rounded-full bg-secondary text-foreground grid place-items-center shrink-0 active:scale-95 transition-transform"
              aria-label={t("onb_back")}
            >
              <ChevronLeft className="size-6 rtl:rotate-0 ltr:rotate-180" />
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
              onClick={finish}
              disabled={update.isPending}
              className="flex-1 h-14 rounded-full bg-primary text-primary-foreground font-bold text-base active:scale-[0.97] transition-transform shadow-lg shadow-primary/25 disabled:opacity-60"
            >
              {update.isPending ? <Loader2 className="size-6 animate-spin mx-auto" /> : t("onb_start")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
