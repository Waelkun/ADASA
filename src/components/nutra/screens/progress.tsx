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
import { useProgress } from "@/lib/api";
import { Segmented } from "../segmented";
import { HeroNumber, StatCard } from "../stat-card";
import { MacroBar } from "../macro-donut";
import { Skeleton } from "@/components/ui/skeleton";
import { kgToLb } from "@/lib/nutrition";

type Range = "1w" | "1m" | "3m" | "all";
const RANGE_DAYS: Record<Range, number> = { "1w": 7, "1m": 30, "3m": 90, all: 10000 };

export function ProgressScreen() {
  const { t, nf, lang } = useI18n();
  const [range, setRange] = useState<Range>("1m");
  const { data, isLoading } = useProgress();
  const imperial = data?.profile?.units === "imperial";

  const weights = data?.weights ?? [];

  // weight series for range + 7d moving average
  const { series, latest, rangeDelta, minW, maxW, weeklyAvg, firstEver, totalChange } =
    useMemo(() => {
      const cut = new Date(Date.now() - RANGE_DAYS[range] * 86400000)
        .toISOString()
        .slice(0, 10);
      const inRange = weights.filter((w) => w.date >= cut);
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
    }, [weights, range]);

  // last 7 days kcal
  const kcalWeek = useMemo(() => {
    const arr = (data?.dailyKcal ?? []).slice(-7);
    return arr.map((d) => ({
      ...d,
      day: new Date(d.date + "T00:00:00").toLocaleDateString(lang === "ar" ? "ar-SY-u-nu-latn" : "en-US", {
        weekday: "short",
      }),
    }));
  }, [data?.dailyKcal, lang]);

  const kcalGoal = data?.profile?.kcalGoal ?? 2100;
  const avgKcal = kcalWeek.length
    ? Math.round(kcalWeek.reduce((a, b) => a + b.kcal, 0) / kcalWeek.length)
    : 0;

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
        ]}
      />

      {/* weight chart */}
      <section className="nutra-card p-4 pt-5" aria-label={t("weight")}>
        <div className="h-[240px]" dir="ltr">
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
                tick={{ fontSize: 10, fill: "var(--muted-foreground)", fontWeight: 500 }}
                tickFormatter={(v: string) =>
                  v.slice(8) + "/" + v.slice(5, 7)
                }
                axisLine={false}
                tickLine={false}
                minTickGap={28}
              />
              <YAxis
                domain={["dataMin - 0.8", "dataMax + 0.8"]}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
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
                labelFormatter={(v) => {
                  const d = new Date(v + "T00:00:00");
                  return d.toLocaleDateString(lang === "ar" ? "ar-SY-u-nu-latn" : "en-US", {
                    day: "numeric",
                    month: "short",
                  });
                }}
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
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <span className="h-0.5 w-4 rounded bg-primary" aria-hidden />
            {t("weight")}
          </span>
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <span className="h-0.5 w-4 rounded bg-carbs" style={{ backgroundImage: "repeating-linear-gradient(90deg, var(--carbs) 0 4px, transparent 4px 7px)" }} aria-hidden />
            {t("moving_avg7")}
          </span>
        </div>
      </section>

      {/* stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<TrendingUp className="size-3.5" />}
          label={t("weekly_avg")}
          value={fmtW(weeklyAvg)}
          unit={unit}
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
        />
      </div>

      {/* weekly calories */}
      <section className="nutra-card p-5" aria-label={t("avg_kcal")}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <Flame className="size-4 text-negative" />
            {t("avg_kcal")}
          </h2>
          <span className="nutra-chip bg-secondary text-secondary-foreground tabular">
            {nf(avgKcal)} / {nf(kcalGoal)} {t("kcal")}
          </span>
        </div>
        <div className="h-[150px] mt-3" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={kcalWeek} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 6" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
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

      {/* macro + water averages */}
      <div className="grid grid-cols-1 gap-3">
        <section className="nutra-card p-5">
          <h2 className="text-sm font-bold mb-3">{t("avg_macros")}</h2>
          <MacroBar
            protein={data?.macroAvg.protein ?? 0}
            carbs={data?.macroAvg.carbs ?? 0}
            fat={data?.macroAvg.fat ?? 0}
          />
          <div className="mt-2.5 grid grid-cols-3 text-center">
            {(
              [
                ["protein", data?.macroAvg.protein ?? 0, "var(--protein)"],
                ["carbs", data?.macroAvg.carbs ?? 0, "var(--carbs)"],
                ["fat", data?.macroAvg.fat ?? 0, "var(--fat)"],
              ] as const
            ).map(([key, v, color]) => (
              <div key={key} className="flex flex-col gap-0.5">
                <span className="text-[11px] font-medium" style={{ color }}>
                  {t(key as "protein")}
                </span>
                <span className="text-base font-bold tabular">
                  {nf(v, 1)}
                  <span className="text-[10px] text-muted-foreground">{t("grams")}</span>
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
              {nf((data?.waterAvg ?? 0) / 1000, 1)}
              <span className="text-xs font-semibold text-muted-foreground"> {t("liter")}</span>
            </p>
          </div>
          <div className="text-end">
            <p className="text-xs font-medium text-muted-foreground">{t("logged_days")}</p>
            <p className="text-lg font-bold tabular">{nf(data?.loggedDays30 ?? 0)}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
