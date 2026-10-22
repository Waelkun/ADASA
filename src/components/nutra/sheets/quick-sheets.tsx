"use client";

import React from "react";
import { ScanLine, PencilLine, GlassWater, Scale, Dumbbell } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import { SheetShell } from "./sheet-shell";
import { useAddWater, useUndoWater, useWater, useLogWeight, useWeight, useToday } from "@/lib/api";
import { localDayStr } from "@/lib/api";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* ================= Quick add menu ================= */

export function QuickAddSheet() {
  const { t } = useI18n();
  const sheet = useAppStore((s) => s.sheet);
  const closeSheet = useAppStore((s) => s.closeSheet);
  const openSheet = useAppStore((s) => s.openSheet);
  const setTab = useAppStore((s) => s.setTab);

  const items = [
    {
      icon: ScanLine,
      label: t("scan_product"),
      hint: t("scan_hint"),
      color: "text-primary bg-primary/12",
      onClick: () => openSheet("scan"),
    },
    {
      icon: PencilLine,
      label: t("manual_entry"),
      hint: t("manual_hint"),
      color: "text-carbs bg-carbs/12",
      onClick: () => openSheet("manual-food"),
    },
    {
      icon: GlassWater,
      label: t("add_water"),
      color: "text-water bg-water/12",
      onClick: () => openSheet("water"),
    },
    {
      icon: Scale,
      label: t("log_weight"),
      color: "text-negative bg-negative/12",
      onClick: () => openSheet("weight"),
    },
    {
      icon: Dumbbell,
      label: t("log_workout"),
      color: "text-primary bg-accent",
      onClick: () => openSheet("workout"),
    },
  ];

  return (
    <SheetShell open={sheet === "quick-add"} onOpenChange={(o) => !o && closeSheet()} title={t("quick_add")}>
      <ul className="flex flex-col gap-1.5">
        {items.map((it) => (
          <li key={it.label}>
            <button
              onClick={it.onClick}
              className="w-full flex items-center gap-4 p-3 rounded-[20px] hover:bg-secondary/70 active:scale-[0.98] transition-all text-start min-h-[44px]"
            >
              <span className={`size-11 rounded-2xl grid place-items-center shrink-0 ${it.color}`}>
                <it.icon className="size-5" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-bold">{it.label}</span>
                {it.hint && (
                  <span className="block text-[11px] text-muted-foreground truncate">{it.hint}</span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <button
        onClick={() => setTab("log")}
        className="mt-2 w-full text-center text-xs font-semibold text-primary min-h-[40px]"
      >
        {t("my_foods")} →
      </button>
    </SheetShell>
  );
}

/* ================= Water sheet ================= */

export function WaterSheet() {
  const { t, nf } = useI18n();
  const sheet = useAppStore((s) => s.sheet);
  const closeSheet = useAppStore((s) => s.closeSheet);
  const { data: water } = useWater();
  const addWater = useAddWater();
  const undoWater = useUndoWater();
  const [custom, setCustom] = useState("");

  const total = water?.total ?? 0;
  const goal = 2800; // profile goal comes via today; fallback here is fine
  const lastId = water?.entries?.[water.entries.length - 1]?.id;

  const add = (ml: number) =>
    addWater.mutate(ml, {
      onSuccess: () => toast.success(t("added_toast")),
      onError: () => toast.error(t("error_toast")),
    });

  return (
    <SheetShell open={sheet === "water"} onOpenChange={(o) => !o && closeSheet()} title={t("add_water")}>
      <p className="text-center text-sm text-muted-foreground mb-4 tabular">
        {nf(total / 1000, 2)} {t("liter")}
      </p>
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[250, 500, 750, 1000].map((ml) => (
          <button
            key={ml}
            onClick={() => add(ml)}
            className="h-14 rounded-[18px] bg-water/10 text-water font-bold text-sm tabular active:scale-95 transition-transform"
          >
            +{ml >= 1000 ? `${ml / 1000}L` : ml}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          inputMode="numeric"
          placeholder={t("custom_amount")}
          aria-label={t("custom_amount")}
          className="flex-1 h-12 rounded-full bg-secondary px-5 text-sm font-semibold tabular focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button
          onClick={() => {
            const ml = Number(custom);
            if (ml > 0 && ml <= 3000) {
              add(Math.round(ml));
              setCustom("");
            }
          }}
          className="h-12 px-6 rounded-full bg-primary text-primary-foreground text-sm font-bold active:scale-95 transition-transform"
        >
          {t("add")}
        </button>
      </div>
      {lastId && (
        <button
          onClick={() => undoWater.mutate(lastId)}
          className="mt-3 w-full h-11 rounded-full bg-secondary text-sm font-semibold text-muted-foreground"
        >
          {t("undo")}
        </button>
      )}
    </SheetShell>
  );
}

/* ================= Weight sheet ================= */

export function WeightSheet() {
  const { t } = useI18n();
  const sheet = useAppStore((s) => s.sheet);
  const closeSheet = useAppStore((s) => s.closeSheet);
  const { data: today } = useToday();
  const { data: weights } = useWeight();

  return (
    <SheetShell open={sheet === "weight"} onOpenChange={(o) => !o && closeSheet()} title={t("log_weight")}>
      {sheet === "weight" && (
        <WeightForm
          key={today?.weightToday?.weightKg ?? "new"}
          existing={today?.weightToday?.weightKg ?? null}
          weights={weights ?? []}
          imperial={today?.profile?.units === "imperial"}
        />
      )}
    </SheetShell>
  );
}

function WeightForm({
  existing,
  weights,
  imperial,
}: {
  existing: number | null;
  weights: { date: string; weightKg: number }[];
  imperial: boolean;
}) {
  const { t, nf, df } = useI18n();
  const closeSheet = useAppStore((s) => s.closeSheet);
  const logWeight = useLogWeight();

  const todayStr = localDayStr();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = localDayStr(yesterday);

  const lastWeight =
    weights.length
      ? weights[weights.length - 1].date === todayStr
        ? weights[weights.length - 2]?.weightKg ?? 80
        : weights[weights.length - 1].weightKg
      : 80;

  const [date, setDate] = useState<"today" | "yesterday">("today");
  const [value, setValue] = useState(existing != null ? String(existing) : "");
  const [note, setNote] = useState("");

  const displayed = imperial ? "lb" : "kg";

  const save = () => {
    const kg = Number(value);
    if (!Number.isFinite(kg) || kg < 25 || kg > 350) {
      toast.error(t("error_toast"));
      return;
    }
    logWeight.mutate(
      {
        date: date === "today" ? todayStr : yesterdayStr,
        weightKg: kg,
        note: note.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success(t("weight_logged"));
          closeSheet();
        },
        onError: () => toast.error(t("error_toast")),
      }
    );
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-center gap-2 mb-5">
        <button
          onClick={() => setDate("today")}
          className={cn(
            "nutra-chip h-10 px-4 text-[13px]",
            date === "today" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
          )}
        >
          {t("today_log")}
        </button>
        <button
          onClick={() => setDate("yesterday")}
          className={cn(
            "nutra-chip h-10 px-4 text-[13px]",
            date === "yesterday" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
          )}
        >
          {t("yesterday")}
        </button>
      </div>

      <div className="nutra-card p-6 flex flex-col items-center gap-2 mb-4">
        <span className="text-xs font-medium text-muted-foreground">
          {date === "today" ? t("today_weight") : t("yesterday")}
        </span>
        <div className="flex items-baseline gap-2">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            inputMode="decimal"
            placeholder={String(lastWeight ?? 80)}
            aria-label={t("today_weight")}
            className="w-36 text-center nutra-hero-num text-5xl tabular bg-transparent focus:outline-none placeholder:text-muted-foreground/40"
          />
          <span className="text-sm font-bold text-muted-foreground">{displayed}</span>
        </div>
        {lastWeight != null && (
          <span className="text-[11px] text-muted-foreground tabular">
            {t("yesterday")}: {nf(lastWeight, 1)} {t("kg")}
          </span>
        )}
      </div>

      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t("weight_note")}
        aria-label={t("weight_note")}
        className="w-full h-12 rounded-full bg-secondary px-5 text-sm font-medium mb-4 focus:outline-none focus:ring-2 focus:ring-primary/40"
      />

      <button
        onClick={save}
        disabled={logWeight.isPending}
        className="w-full h-14 rounded-full bg-primary text-primary-foreground font-bold text-sm active:scale-[0.98] transition-transform disabled:opacity-60"
      >
        {t("save")}
      </button>
      <p className="text-center text-[11px] text-muted-foreground mt-3">{df(new Date())}</p>
    </div>
  );
}
