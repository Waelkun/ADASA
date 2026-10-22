"use client";

import React, { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

interface MacroDonutProps {
  protein: number;
  carbs: number;
  fat: number;
  /** macro targets in grams for reference ticks */
  size?: number;
}

/** Donut chart of macro calories + legend with grams & percentages */
export function MacroDonut({ protein, carbs, fat, size = 150 }: MacroDonutProps) {
  const { t, nf } = useI18n();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setMounted(true)));
    return () => cancelAnimationFrame(id);
  }, []);

  const pk = protein * 4;
  const ck = carbs * 4;
  const fk = fat * 9;
  const total = pk + ck + fk;

  const stroke = 16;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  const segs =
    total > 0
      ? [
          { key: "p", v: pk, color: "var(--protein)", grams: protein, label: t("protein") },
          { key: "c", v: ck, color: "var(--carbs)", grams: carbs, label: t("carbs") },
          { key: "f", v: fk, color: "var(--fat)", grams: fat, label: t("fat") },
        ]
      : [];

  let acc = 0;

  return (
    <div className="flex items-center gap-5">
      <div className="relative inline-flex shrink-0">
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-secondary" />
          {segs.map((s) => {
            const frac = mounted ? s.v / total : 0;
            const dash = frac * c;
            const offset = -(acc / total) * c;
            acc += s.v;
            // 2px visual gap between segments
            const gap = dash > 4 ? 3 : 0;
            return (
              <circle
                key={s.key}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={`${Math.max(dash - gap, 0)} ${c}`}
                strokeDashoffset={offset}
                style={{ transition: "stroke-dasharray 900ms cubic-bezier(0.22,1,0.36,1)" }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="nutra-hero-num text-2xl tabular">{nf(Math.round(total))}</span>
          <span className="text-[10px] font-medium text-muted-foreground">{t("kcal")}</span>
        </div>
      </div>

      <ul className="flex flex-col gap-2.5 min-w-0 flex-1">
        {segs.map((s) => {
          const pct = total > 0 ? Math.round((s.v / total) * 100) : 0;
          return (
            <li key={s.key} className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full shrink-0"
                style={{ background: s.color }}
                aria-hidden
              />
              <span className="text-sm font-medium truncate">{s.label}</span>
              <span className="ms-auto text-sm tabular text-muted-foreground whitespace-nowrap">
                {nf(s.grams, s.grams % 1 ? 1 : 0)}{t("grams")} · {pct}%
              </span>
            </li>
          );
        })}
        {segs.length === 0 && (
          <li className="text-sm text-muted-foreground">{t("no_meals")}</li>
        )}
      </ul>
    </div>
  );
}

/** color-coded segmented horizontal bar (wealth-bar style) */
export function MacroBar({ protein, carbs, fat }: Omit<MacroDonutProps, "size">) {
  const pk = protein * 4;
  const ck = carbs * 4;
  const fk = fat * 9;
  const total = pk + ck + fk;
  const items = [
    { k: "p", v: pk, color: "var(--protein)" },
    { k: "c", v: ck, color: "var(--carbs)" },
    { k: "f", v: fk, color: "var(--fat)" },
  ];
  return (
    <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-secondary">
      {total > 0 &&
        items.map((it) => (
          <div
            key={it.k}
            className="h-full first:rounded-s-full last:rounded-e-full transition-all duration-700"
            style={{ width: `${(it.v / total) * 100}%`, background: it.color }}
          />
        ))}
    </div>
  );
}
