import { db } from "@/lib/db";
import { getProfile, todayStr, calcStreak } from "@/lib/server";

const DAY = 86400000;
const dayString = (dt: Date) =>
  `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
    dt.getDate()
  ).padStart(2, "0")}`;

/** GET /api/progress — weight series, daily kcal (8w), macro & water averages, streak */
export async function GET() {
  const today = todayStr();
  const todayDt = new Date(today + "T00:00:00");
  const from56 = dayString(new Date(todayDt.getTime() - 55 * DAY));
  const from30 = dayString(new Date(todayDt.getTime() - 29 * DAY));
  const from7 = dayString(new Date(todayDt.getTime() - 6 * DAY));

  const [profile, weights, kcalRows, macroRows, waterRows, streak] = await Promise.all([
    getProfile(),
    db.weightLog.findMany({ orderBy: { date: "asc" } }),
    db.foodLog.groupBy({
      by: ["dayDate"],
      where: { dayDate: { gte: from56 } },
      _sum: { kcal: true },
    }),
    db.foodLog.findMany({
      where: { dayDate: { gte: from56 } },
      select: { dayDate: true, proteinG: true, carbsG: true, fatG: true },
    }),
    db.waterLog.groupBy({
      by: ["dayDate"],
      where: { dayDate: { gte: from56 } },
      _sum: { amountMl: true },
    }),
    calcStreak(today),
  ]);

  const kcalMap = new Map(kcalRows.map((r) => [r.dayDate, Math.round(r._sum.kcal ?? 0)]));
  const dailyKcal: { date: string; kcal: number }[] = [];
  for (let i = 55; i >= 0; i--) {
    const d = dayString(new Date(todayDt.getTime() - i * DAY));
    dailyKcal.push({ date: d, kcal: kcalMap.get(d) ?? 0 });
  }

  // macro averages over logged days only (last 30d — kept for compatibility)
  const macro30 = macroRows.filter((r) => r.dayDate >= from30);
  const loggedDays = new Set(macro30.map((r) => r.dayDate));
  const macroAvg = { protein: 0, carbs: 0, fat: 0 };
  if (macro30.length && loggedDays.size) {
    for (const r of macro30) {
      macroAvg.protein += r.proteinG;
      macroAvg.carbs += r.carbsG;
      macroAvg.fat += r.fatG;
    }
    macroAvg.protein = Math.round((macroAvg.protein / loggedDays.size) * 10) / 10;
    macroAvg.carbs = Math.round((macroAvg.carbs / loggedDays.size) * 10) / 10;
    macroAvg.fat = Math.round((macroAvg.fat / loggedDays.size) * 10) / 10;
  }

  const waterAvg = waterRows.length
    ? Math.round(waterRows.reduce((a, w) => a + (w._sum.amountMl ?? 0), 0) / 7)
    : 0;

  // per-day macro averages + per-day water (56d) — lets the client compute
  // period-aware averages and previous-period trends (additive)
  const dayCount = new Map<string, number>();
  const macroSum = new Map<string, { p: number; c: number; f: number }>();
  for (const r of macroRows) {
    const s = macroSum.get(r.dayDate) ?? { p: 0, c: 0, f: 0 };
    s.p += r.proteinG;
    s.c += r.carbsG;
    s.f += r.fatG;
    macroSum.set(r.dayDate, s);
    dayCount.set(r.dayDate, (dayCount.get(r.dayDate) ?? 0) + 1);
  }
  const dailyMacros = [...macroSum.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, s]) => {
      const n = dayCount.get(date) ?? 1;
      return {
        date,
        p: Math.round((s.p / n) * 10) / 10,
        c: Math.round((s.c / n) * 10) / 10,
        f: Math.round((s.f / n) * 10) / 10,
      };
    });
  const dailyWater = waterRows
    .map((w) => ({ date: w.dayDate, ml: w._sum.amountMl ?? 0 }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  return Response.json({
    profile,
    weights,
    dailyKcal,
    macroAvg,
    waterAvg,
    dailyMacros,
    dailyWater,
    streak,
    loggedDays30: loggedDays.size,
  });
}
