"use client";

import React, { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

interface CalorieRingProps {
  eaten: number;
  goal: number;
  size?: number;
}

/** Animated SVG ring: eaten vs goal, over-goal shown capped in red */
export function CalorieRing({ eaten, goal, size = 220 }: CalorieRingProps) {
  const { t, nf } = useI18n();
  const [progress, setProgress] = useState(0);

  const ratio = goal > 0 ? eaten / goal : 0;
  const clamped = Math.min(ratio, 1);
  const over = ratio > 1;
  const remaining = Math.max(goal - eaten, 0);

  useEffect(() => {
    // animate from 0 to value on mount (parent remounts via key to replay)
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setProgress(clamped)));
    return () => cancelAnimationFrame(id);
  }, [clamped]);

  const stroke = 18;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - progress);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      role="progressbar"
      aria-valuenow={Math.round(clamped * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={`${nf(eaten)} ${t("of")} ${nf(goal)} ${t("kcal")}`}
      aria-label={`${nf(eaten)} / ${nf(goal)} ${t("kcal")}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* soft track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-secondary"
        />
        {/* progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke={over ? "var(--negative)" : "var(--primary)"}
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {over ? (
          <>
            <span className="nutra-hero-num text-4xl text-negative tabular">
              +{nf(eaten - goal)}
            </span>
            <span className="text-xs font-medium text-muted-foreground mt-1">
              {t("over_by")}
            </span>
          </>
        ) : (
          <>
            <span className="nutra-hero-num text-[44px] leading-none tabular">
              {nf(remaining)}
            </span>
            <span className="text-xs font-medium text-muted-foreground mt-1.5">
              {t("calories_left")}
            </span>
          </>
        )}
        <span className="mt-2 nutra-chip bg-secondary text-secondary-foreground">
          {nf(eaten)} / {nf(goal)} {t("kcal")}
        </span>
      </div>
    </div>
  );
}
