"use client";

import React, { useState } from "react";
import { CalendarRange, Square, ArrowUp, ArrowDown } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useUpdateProfile, localDayStr } from "@/lib/api";
import { effectiveKcalGoal, daysBetween } from "@/lib/nutrition";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatWeekday } from "@/lib/date-ar";

type PlanId = "plan1" | "plan2";

const PLANS: { id: PlanId; nameKey: "zigzag_plan1" | "zigzag_plan2"; descKey: "zigzag_plan1_desc" | "zigzag_plan2_desc" }[] = [
  { id: "plan1", nameKey: "zigzag_plan1", descKey: "zigzag_plan1_desc" },
  { id: "plan2", nameKey: "zigzag_plan2", descKey: "zigzag_plan2_desc" },
];

/**
 * Calorie zigzag (زجزاج): pick a plan (fixed / 2 high days / gradient),
 * preview today & tomorrow, then the Today ring follows the day's target.
 * Weekly total is always 7 × the base target.
 */
export function ZigzagPlanCard({
  baseKcal,
  plan,
  start,
}: {
  baseKcal: number;
  plan: string | null;
  start: string | null;
}) {
  const { t, nf, lang } = useI18n();
  const update = useUpdateProfile();
  const [picked, setPicked] = useState<PlanId | null>(null);

  const today = localDayStr();
  const tomorrow = localDayStr(new Date(Date.now() + 86400000));
  const active = plan === "plan1" || plan === "plan2" ? (plan as PlanId) : null;

  const adopt = (id: PlanId | null) => {
    update.mutate(
      id
        ? { zigzagPlan: id, zigzagStart: today }
        : { zigzagPlan: null, zigzagStart: null },
      {
        onSuccess: () => {
          toast.success(id ? t("zigzag_adopted") : t("zigzag_stopped"));
          setPicked(null);
        },
        onError: () => toast.error(t("error_toast")),
      }
    );
  };

  // preview numbers for the picked (or active) plan
  const previewPlan = picked ?? active;
  const todayKcal = previewPlan
    ? effectiveKcalGoal(baseKcal, previewPlan, today, today)
    : baseKcal;
  const tomorrowKcal = previewPlan
    ? effectiveKcalGoal(baseKcal, previewPlan, today, tomorrow)
    : baseKcal;

  // upcoming 7 days (starting today) for the active plan
  const upcoming =
    active && start
      ? Array.from({ length: 7 }, (_, i) => {
          const d = localDayStr(new Date(Date.now() + i * 86400000));
          return {
            date: d,
            kcal: effectiveKcalGoal(baseKcal, active, start, d),
            isToday: i === 0,
          };
        })
      : [];

  return (
    <section className="nutra-card p-5 flex flex-col gap-4">
      <h2 className="text-sm font-bold flex items-center gap-2">
        <CalendarRange className="size-4 text-primary" />
        {t("zigzag_title")}
      </h2>

      {active ? (
        <>
          {/* active plan card */}
          <div className="rounded-[18px] bg-accent/60 border border-primary/15 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold">
                {t(active === "plan1" ? "zigzag_plan1" : "zigzag_plan2")}
              </p>
              <button
                onClick={() => adopt(null)}
                disabled={update.isPending}
                className="nutra-chip bg-secondary text-negative gap-1 min-h-[44px] px-3.5 active:scale-95 transition-transform"
              >
                <Square className="size-3" />
                {t("zigzag_stop")}
              </button>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("today_log")}: <span className="font-bold text-foreground tabular">{nf(todayKcal)}</span> ·{" "}
              {t("tomorrow")}: <span className="font-bold text-foreground tabular">{nf(tomorrowKcal)}</span> {t("kcal")}
              {" · "}
              {t("zigzag_week_total")}: {nf(baseKcal * 7)}
            </p>
            {/* upcoming days bar */}
            <div className="grid grid-cols-7 gap-1">
              {upcoming.map((d) => (
                <div
                  key={d.date}
                  className={cn(
                    "rounded-xl py-1.5 px-0.5 flex flex-col items-center gap-0.5",
                    d.isToday ? "bg-primary/15 ring-1 ring-primary/40" : "bg-secondary"
                  )}
                >
                  <span className="text-xs font-bold text-muted-foreground">
                    {formatWeekday(new Date(d.date + "T00:00:00"), lang)}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-bold tabular inline-flex items-center gap-0.5",
                      d.kcal > baseKcal ? "text-carbs-text" : d.kcal < baseKcal ? "text-primary" : "text-foreground"
                    )}
                  >
                    {d.kcal > baseKcal && (
                      <>
                        <ArrowUp className="size-2.5 shrink-0" aria-hidden />
                        <span className="sr-only">({t("zigzag_higher")})</span>
                      </>
                    )}
                    {d.kcal < baseKcal && (
                      <>
                        <ArrowDown className="size-2.5 shrink-0" aria-hidden />
                        <span className="sr-only">({t("zigzag_lower")})</span>
                      </>
                    )}
                    {nf(d.kcal)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* fixed (no plan) — current state */}
          <button
            onClick={() => setPicked(null)}
            aria-pressed={picked === null}
            className={cn(
              "nutra-card p-4 min-h-[56px] flex items-center gap-3 text-start transition-all active:scale-[0.97]",
              picked === null ? "ring-2 ring-primary/60 bg-accent" : "opacity-80"
            )}
          >
            <span className="text-sm font-bold flex-1">{t("zigzag_fixed")}</span>
            <span className="text-xs font-semibold text-muted-foreground tabular">
              {nf(baseKcal)} {t("kcal")}
            </span>
          </button>

          {PLANS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPicked(picked === p.id ? null : p.id)}
              aria-pressed={picked === p.id}
              className={cn(
                "nutra-card p-4 flex flex-col gap-1.5 text-start transition-all active:scale-[0.97]",
                picked === p.id ? "ring-2 ring-primary/60 bg-accent" : "opacity-80"
              )}
            >
              <span className="text-sm font-bold">{t(p.nameKey)}</span>
              <span className="text-xs text-muted-foreground leading-relaxed">{t(p.descKey)}</span>
              {picked === p.id && (
                <span className="text-xs font-semibold text-primary tabular">
                  {t("today_log")}: {nf(effectiveKcalGoal(baseKcal, p.id, today, today))} ·{" "}
                  {t("tomorrow")}: {nf(effectiveKcalGoal(baseKcal, p.id, today, tomorrow))} {t("kcal")}
                  {" · "}
                  {t("zigzag_week_total")}: {nf(baseKcal * 7)}
                </span>
              )}
            </button>
          ))}

          {picked && (
            <button
              onClick={() => adopt(picked)}
              disabled={update.isPending}
              className="h-12 rounded-full bg-primary text-primary-foreground font-bold text-sm active:scale-[0.97] transition-transform disabled:opacity-60 shadow-lg shadow-primary/25"
            >
              {t("zigzag_adopt")}
            </button>
          )}
        </>
      )}

      {active && start && (
        <p className="text-xs text-muted-foreground tabular text-center leading-normal">
          {t("zigzag_started")} {start} · {nf(daysBetween(start, today))} {t("days_count")}
        </p>
      )}
    </section>
  );
}
