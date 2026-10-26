"use client";

import React, { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingDown, TrendingUp, Scale, Flame, GlassWater } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useProgress, localDayStr } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { Segmented } from "../segmented";
import { HeroNumber, StatCard } from "../stat-card";
import { MacroBar } from "../macro-donut";
import { Skeleton } from "@/components/ui/skeleton";
import { kgToLb } from "@/lib/nutrition";

type Range = "1w" | "1m" | "3m" | "all" | "custom";
const RANGE_DAYS: Record<Exclude<Range, "custom">, number> = { "1w": 7, "1m": 30, "3m": 90, all: 10000 };

export function ProgressScreen() {
  const { t, nf, df } = useI18n();
  const openSheet = useAppStore((s) => s.openSheet);
  const [range, setRange] = useState<Range>("1m");
  // custom period (from → to), defaults to the last 30 days
  const [custom, setCustom] = useState<{ from: string; to: string }>(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 29);
    return { from: localDayStr(from), to: localDayStr(to) };
  });
  const { data, isLoading } = useProgress();
  const imperial = data?.profile?.units === "imperial";

  const weights = data?.weights ?? [];

  // weight series for range + 7d moving average
  const { series, latest, rangeDelta, minW, maxW, weeklyAvg, firstEver, totalChange } =
    useMemo(() => {
      const cut =
        range === "custom"
          ? custom.from
          : new Date(Date.now() - RANGE_DAYS[range] * 86400000)
              .toISOString()
              .slice(0, 10);
      // normalize inverted custom range (from > to)
      const lo = custom.from <= custom.to ? custom.from : custom.to;
      const hi = custom.from <= custom.to ? custom.to : custom.from;
      let inRange = weights.filter((w) => w.date >= cut);
      if (range === "custom") inRange = weights.filter((w) => w.date >= lo && w.date <= hi);
      const pts = (inRange.length > 1 ? inRange : weights).map((w) => ({
        date: w.date,
        w: w.weightKg,
        ma: null as number | null,
      }));
      // 7d moving average over full history then filter
      const all = weights.map((w) => w.weightKg);
      const maFull = weights.map((_, i) => {
        const s = Math.max(0, i - 6);
        const slice = all.slice(s, i + 1);
        return slice.reduce((a, b) => a + b, 0) / slice.length;
      });
      const startIdx = weights.length - pts.length;
      pts.forEach((p, i) => (p.ma = maFull[startIdx + i]));

      const latestW = weights[weights.length - 1]?.weightKg ?? 0;
      const firstInRange = pts[0]?.w ?? latestW;
      const firstEverW = weights[0]?.weightKg ?? 0;
      const ws = pts.map((p) => p.w);
      const last7 = weights.slice(-7);
      return {
        series: pts,
        latest: latestW,
        rangeDelta: latestW - firstInRange,
        minW: Math.min(...ws),
        maxW: Math.max(...ws),
        weeklyAvg: last7.length ? last7.reduce((a, b) => a + b.weightKg, 0) / last7.length : 0,
        firstEver: firstEverW,
        totalChange: latestW - firstEverW,
      };
    }, [weights, range, custom]);

  // kcal bars: last 7 days (fixed ranges) / within the custom period (last 14)
  const { bars: kcalWeek } = useMemo(() => {
    let arr = data?.dailyKcal ?? [];
    if (range === "custom") {
      const lo = custom.from <= custom.to ? custom.from : custom.to;
      const hi = custom.from <= custom.to ? custom.to : custom.from;
      arr = arr.filter((d) => d.date >= lo && d.date <= hi);
    }
    const slice = arr.slice(range === "custom" ? -14 : -7);
    const bars = slice.map((d) => ({
      ...d,
      day: df(new Date(d.date + "T00:00:00"), { weekday: "short" }),
    }));
    return { bars };
  }, [data?.dailyKcal, range, custom, df]);

  const kcalGoal = data?.profile?.kcalGoal ?? 2100;

  // ===== period window + previous-period window (for trends) =====
  const DAY = 86400000;
  const { win, prev } = useMemo(() => {
    const today = localDayStr();
    const todayMs = new Date(today + "T00:00:00").getTime();
    let lo: string;
    let hi: string;
    if (range === "custom") {
      lo = custom.from <= custom.to ? custom.from : custom.to;
      hi = custom.from <= custom.to ? custom.to : custom.from;
    } else if (range === "all") {
      lo = weights[0]?.date ?? today;
      hi = today;
    } else {
      const n = RANGE_DAYS[range];
      lo = localDayStr(new Date(todayMs - (n - 1) * DAY));
      hi = today;
    }
    const lenDays = Math.round((new Date(hi + "T00:00:00").getTime() - new Date(lo + "T00:00:00").getTime()) / DAY) + 1;
    const prevHi = localDayStr(new Date(new Date(lo + "T00:00:00").getTime() - DAY));
    const prevLo = localDayStr(new Date(new Date(lo + "T00:00:00").getTime() - lenDays * DAY));
    return { win: { lo, hi }, prev: { lo: prevLo, hi: prevHi } };
  }, [range, custom, weights]);

  // ===== period-aware averages + trend vs the previous period =====
  const stats = useMemo(() => {
    const inWin = (d: string, w: { lo: string; hi: string }) => d >= w.lo && d <= w.hi;
    const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);

    const kcalDays = (data?.dailyKcal ?? []).filter((d) => inWin(d.date, win) && d.kcal > 0);
    const kcalPrev = (data?.dailyKcal ?? []).filter((d) => inWin(d.date, prev) && d.kcal > 0);
    const avgKcal = Math.round(mean(kcalDays.map((d) => d.kcal)));
    const prevKcal = Math.round(mean(kcalPrev.map((d) => d.kcal)));

    const wIn = weights.filter((w) => inWin(w.date, win));
    const wPrev = weights.filter((w) => inWin(w.date, prev));
    const avgW = wIn.length ? mean(wIn.map((w) => w.weightKg)) : null;
    const prevW = wPrev.length ? mean(wPrev.map((w) => w.weightKg)) : null;

    const watIn = (data?.dailyWater ?? []).filter((d) => inWin(d.date, win) && d.ml > 0);
    const watPrev = (data?.dailyWater ?? []).filter((d) => inWin(d.date, prev) && d.ml > 0);
    const avgWater = Math.round(mean(watIn.map((d) => d.ml)));
    const prevWater = Math.round(mean(watPrev.map((d) => d.ml)));

    const mIn = (data?.dailyMacros ?? []).filter((d) => inWin(d.date, win));
    const macroAvg = {
      protein: Math.round(mean(mIn.map((d) => d.p)) * 10) / 10,
      carbs: Math.round(mean(mIn.map((d) => d.c)) * 10) / 10,
      fat: Math.round(mean(mIn.map((d) => d.f)) * 10) / 10,
    };

    return {
      avgKcal,
      prevKcal,
      avgW,
      prevW,
      avgWater,
      prevWater,
      macroAvg,
      loggedDays: kcalDays.length,
      trend: {
        kcal: kcalPrev.length ? avgKcal - prevKcal : null,
        weight: prevW != null && avgW != null ? avgW - prevW : null,
        water: watPrev.length ? avgWater - prevWater : null,
      },
    };
  }, [data, weights, win, prev]);

  // custom period length in days + readable summary
  const customDays = useMemo(() => {
    const lo = custom.from <= custom.to ? custom.from : custom.to;
    const hi = custom.from <= custom.to ? custom.to : custom.from;
    const n = Math.round((new Date(hi).getTime() - new Date(lo).getTime()) / 86400000) + 1;
    return { n: n > 0 ? n : 0, lo, hi };
  }, [custom]);

  const conv = (kg: number) => (imperial ? kgToLb(kg) : kg);
  const unit = imperial ? t("lb") : t("kg");
  const fmtW = (kg: number) => nf(conv(kg), 1);

  const goalWeight = data?.profile?.goalWeightKg;
  const toGoal = goalWeight != null && latest ? latest - goalWeight : null;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-40 rounded-xl" />
        <Skeleton className="h-[260px] rounded-[22px]" />
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-[22px]" />
          ))}
        </div>
      </div>
    );
  }

  if (!weights.length) {
    return (
      <div className="nutra-card p-10 flex flex-col items-center gap-3 text-center mt-6">
        <Scale className="size-10 text-muted-foreground" />
        <p className="text-sm font-bold">{t("no_weight_yet")}</p>
        <p className="text-xs text-muted-foreground">{t("log_first_weight")}</p>
        <button
          onClick={() => openSheet("weight")}
          className="mt-2 h-11 px-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center gap-2 active:scale-95 transition-transform shadow-md shadow-primary/25"
        >
          <Scale className="size-4" />
          {t("log_first_weight_cta")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* hero */}
      <div className="flex items-end justify-between gap-3 px-1">
        <HeroNumber
          value={fmtW(latest)}
          unit={unit}
          caption={`${t("latest")} · ${t("weight")}`}
          delta={rangeDelta !== 0 ? -rangeDelta : undefined}
          invertDelta={data?.profile?.goalType !== "gain"}
        />
      </div>

      <Segmented
        ariaLabel={t("progress")}
        value={range}
        onChange={setRange}
        options={[
          { value: "1w", label: t("range_1w") },
          { value: "1m", label: t("range_1m") },
          { value: "3m", label: t("range_3m") },
          { value: "all", label: t("range_all") },
          { value: "custom", label: t("range_custom") },
        ]}
      />

      {/* custom period: from → to date pickers + shortcuts + readable summary */}
      {range === "custom" && (
        <section className="nutra-card p-4 flex flex-col gap-3" aria-label={t("range_custom")}>
          <div className="flex items-end gap-2">
            <label className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-xs font-bold text-muted-foreground leading-normal">{t("date_from")}</span>
              <input
                type="date"
                value={custom.from}
                max={custom.to}
                onChange={(e) => e.target.value && setCustom((c) => ({ ...c, from: e.target.value }))}
                aria-label={t("date_from")}
                className="h-11 rounded-[14px] bg-secondary px-3 text-base font-bold tabular focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <label className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-xs font-bold text-muted-foreground leading-normal">{t("date_to")}</span>
              <input
                type="date"
                value={custom.to}
                min={custom.from}
                max={localDayStr()}
                onChange={(e) => e.target.value && setCustom((c) => ({ ...c, to: e.target.value }))}
                aria-label={t("date_to")}
                className="h-11 rounded-[14px] bg-secondary px-3 text-base font-bold tabular focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
          </div>
          {/* shortcuts: last 3 / 7 / 14 days (inclusive of today) */}
          <div className="flex gap-2">
            {([3, 7, 14] as const).map((n) => (
              <button
                key={n}
                onClick={() => {
                  const to = new Date();
                  const from = new Date();
                  from.setDate(from.getDate() - (n - 1));
                  setCustom({ from: localDayStr(from), to: localDayStr(to) });
                }}
                className="flex-1 h-10 rounded-full bg-secondary text-xs font-bold text-secondary-foreground tabular active:scale-95 transition-transform"
              >
                {t(n === 3 ? "last_3_days" : n === 7 ? "last_7_days" : "last_14_days")}
              </button>
            ))}
          </div>
          <p className="text-xs font-semibold text-muted-foreground text-center leading-relaxed">
            {t("date_from")}{" "}
            {df(new Date(customDays.lo + "T00:00:00"), { day: "numeric", month: "long", year: "numeric" })}{" "}
            {t("date_to")}{" "}
            {df(new Date(customDays.hi + "T00:00:00"), { day: "numeric", month: "long", year: "numeric" })}
            {customDays.n > 0 && (
              <span className="tabular"> · {nf(customDays.n)} {t("days_count")}</span>
            )}
          </p>
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <div className="flex flex-col gap-4">
          {/* weight chart */}
          <section className="nutra-card p-4 pt-5" aria-label={t("weight")}>
        <div
          className="h-[240px]"
          dir="ltr"
          role="img"
          aria-label={`${t("weight")} — ${stats.avgW != null ? fmtW(stats.avgW) : ""} ${unit}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 6, right: 8, left: -14, bottom: 0 }}>
              <defs>
                <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 6" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: "var(--muted-foreground)", fontWeight: 500 }}
                tickFormatter={(v: string) =>
                  v.slice(8) + "/" + v.slice(5, 7)
                }
                axisLine={false}
                tickLine={false}
                minTickGap={28}
              />
              <YAxis
                domain={["dataMin - 0.8", "dataMax + 0.8"]}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                width={44}
                tickFormatter={(v: number) => fmtW(v)}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 14,
                  border: "1px solid var(--border)",
                  background: "var(--popover)",
                  boxShadow: "0 6px 20px rgba(16,24,40,0.10)",
                  fontSize: 12,
                  fontFamily: "inherit",
                }}
                labelFormatter={(v) =>
                  df(new Date(v + "T00:00:00"), { day: "numeric", month: "short" })
                }
                formatter={(value: number | string, name) => [
                  fmtW(Number(value)) + " " + unit,
                  name === "w" ? t("weight") : t("moving_avg7"),
                ]}
              />
              <Area
                type="monotone"
                dataKey="w"
                stroke="var(--primary)"
                strokeWidth={2.5}
                fill="url(#wGrad)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="ma"
                stroke="var(--carbs)"
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-4 px-2 pt-1">
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground leading-normal">
            <span className="h-0.5 w-4 rounded bg-primary" aria-hidden />
            {t("weight")}
          </span>
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground leading-normal">
            <span className="h-0.5 w-4 rounded bg-carbs" style={{ backgroundImage: "repeating-linear-gradient(90deg, var(--carbs) 0 4px, transparent 4px 7px)" }} aria-hidden />
            {t("moving_avg7")}
          </span>
        </div>
      </section>

      {/* stats grid — period-aware averages + trend vs previous period */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Scale className="size-3.5" />}
          label={t("avg_weight_period")}
          value={stats.avgW != null ? fmtW(stats.avgW) : "—"}
          unit={stats.avgW != null ? unit : undefined}
          delta={stats.trend.weight ?? undefined}
          invertDelta={data?.profile?.goalType !== "gain"}
        />
        <StatCard
          icon={<Scale className="size-3.5" />}
          label={t("min_max")}
          value={`${fmtW(minW)} – ${fmtW(maxW)}`}
          unit={unit}
        />
        <StatCard
          icon={
            totalChange <= 0 ? (
              <TrendingDown className="size-3.5" />
            ) : (
              <TrendingUp className="size-3.5" />
            )
          }
          label={t("total_change")}
          value={`${totalChange > 0 ? "+" : ""}${fmtW(totalChange)}`}
          unit={unit}
        />
        <StatCard
          icon={<Flame className="size-3.5" />}
          label={toGoal != null ? t("to_goal") : t("goal_weight")}
          value={
            toGoal != null
              ? toGoal > 0
                ? fmtW(toGoal)
                : t("goal_reached")
              : "—"
          }
          unit={toGoal != null && toGoal > 0 ? unit : undefined}
        </div>

        <div className="flex flex-col gap-4">
          {/* weekly calories — average follows the selected period */}
          <section className="nutra-card p-5" aria-label={t("avg_kcal")}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <Flame className="size-4 text-negative" />
            {t("avg_kcal")}
          </h2>
          <div className="flex flex-col items-end gap-1">
            <span className="nutra-chip bg-secondary text-secondary-foreground tabular">
              {nf(stats.avgKcal)} / {nf(kcalGoal)} {t("kcal")}
            </span>
            {stats.trend.kcal != null && stats.trend.kcal !== 0 && (
              <span className="flex items-center gap-1 text-xs font-bold tabular text-muted-foreground leading-normal">
                {stats.trend.kcal > 0 ? <TrendingUp className="size-3 text-negative" /> : <TrendingDown className="size-3 text-positive" />}
                <span className={stats.trend.kcal > 0 ? "text-negative" : "text-positive"}>
                  {stats.trend.kcal > 0 ? "+" : ""}{nf(stats.trend.kcal)}
                </span>
                {t("vs_prev_period")}
              </span>
            )}
          </div>
        </div>
        <div
          className="h-[150px] mt-3"
          dir="ltr"
          role="img"
          aria-label={`${t("avg_kcal")} — ${nf(stats.avgKcal)} ${t("kcal")}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={kcalWeek} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 6" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide domain={[0, kcalGoal * 1.25]} />
              <Tooltip
                cursor={{ fill: "var(--secondary)" }}
                contentStyle={{
                  borderRadius: 14,
                  border: "1px solid var(--border)",
                  background: "var(--popover)",
                  fontSize: 12,
                  fontFamily: "inherit",
                }}
                formatter={(v: number | string) => [`${nf(Number(v))} ${t("kcal")}`, t("eaten")]}
              />
              <ReferenceLine
                y={kcalGoal}
                stroke="var(--negative)"
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />
              <Bar dataKey="kcal" radius={[6, 6, 6, 6]} maxBarSize={26} fill="var(--primary)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* macro + water averages — follow the selected period */}
      <div className="grid grid-cols-1 gap-3">
        <section className="nutra-card p-5">
          <h2 className="text-sm font-bold mb-3">{t("avg_macros")}</h2>
          <MacroBar
            protein={stats.macroAvg.protein}
            carbs={stats.macroAvg.carbs}
            fat={stats.macroAvg.fat}
          />
          <div className="mt-2.5 grid grid-cols-3 text-center">
            {(
              [
                ["protein", stats.macroAvg.protein, "var(--protein)"],
                ["carbs", stats.macroAvg.carbs, "var(--carbs-text)"],
                ["fat", stats.macroAvg.fat, "var(--fat)"],
              ] as const
            ).map(([key, v, color]) => (
              <div key={key} className="flex flex-col gap-0.5">
                <span className="text-xs font-medium leading-normal" style={{ color }}>
                  {t(key as "protein")}
                </span>
                <span className="text-base font-bold tabular">
                  {nf(v, 1)}
                  <span className="text-xs text-muted-foreground">{t("grams")}</span>
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="nutra-card p-5 flex items-center gap-3">
          <span className="size-10 rounded-2xl bg-water/12 text-water grid place-items-center shrink-0">
            <GlassWater className="size-5" />
          </span>
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground">{t("avg_water")}</p>
            <p className="text-lg font-bold tabular">
              {nf(stats.avgWater / 1000, 1)}
              <span className="text-xs font-semibold text-muted-foreground"> {t("liter")}</span>
            </p>
            {stats.trend.water != null && stats.trend.water !== 0 && (
              <p className="text-xs font-bold tabular text-muted-foreground mt-0.5 flex items-center gap-1 leading-normal">
                {stats.trend.water > 0 ? <TrendingUp className="size-3 text-water" /> : <TrendingDown className="size-3 text-water" />}
                <span>{stats.trend.water > 0 ? "+" : ""}{nf(stats.trend.water / 1000, 1)} {t("liter")}</span>
                {t("vs_prev_period")}
              </p>
            )}
          </div>
          <div className="text-end">
            <p className="text-xs font-medium text-muted-foreground">{t("logged_days")}</p>
            <p className="text-lg font-bold tabular">{nf(stats.loggedDays)}</p>
          </div>
        </section>
      </div>
      </div>
    </div>
  );
}
