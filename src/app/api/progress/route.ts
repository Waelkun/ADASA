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
      where: { dayDate: { gte: from30 } },
      select: { dayDate: true, proteinG: true, carbsG: true, fatG: true },
    }),
    db.waterLog.groupBy({
      by: ["dayDate"],
      where: { dayDate: { gte: from7 } },
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

  // macro averages over logged days only
  const loggedDays = new Set(macroRows.map((r) => r.dayDate));
  const macroAvg = { protein: 0, carbs: 0, fat: 0 };
  if (macroRows.length && loggedDays.size) {
    for (const r of macroRows) {
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

  return Response.json({
    profile,
    weights,
    dailyKcal,
    macroAvg,
    waterAvg,
    streak,
    loggedDays30: loggedDays.size,
  });
}
