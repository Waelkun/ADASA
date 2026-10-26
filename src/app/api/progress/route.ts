import { createClient, getAuthUser } from "@/lib/supabase/server";
import { getUserProfile, todayStr, calcStreak, jsonError } from "@/lib/server";
import { mapWeightFromDb } from "@/lib/mappers";

const DAY = 86400000;
const dayString = (dt: Date) =>
  `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
    dt.getDate()
  ).padStart(2, "0")}`;

/** GET /api/progress — weight series, daily kcal (8w), macro & water averages, streak */
export async function GET() {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", 401);

  const today = todayStr();
  const todayDt = new Date(today + "T00:00:00");
  const from56 = dayString(new Date(todayDt.getTime() - 55 * DAY));
  const from30 = dayString(new Date(todayDt.getTime() - 29 * DAY));

  const supabase = await createClient();

  const [
    profile,
    weightsRes,
    foodLogsRes,
    waterLogsRes,
    streak,
  ] = await Promise.all([
    getUserProfile(supabase, user.id),
    supabase
      .from("weight_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: true }),
    supabase
      .from("food_logs")
      .select("day_date, kcal, protein_g, carbs_g, fat_g")
      .eq("user_id", user.id)
      .gte("day_date", from56),
    supabase
      .from("water_logs")
      .select("day_date, amount_ml")
      .eq("user_id", user.id)
      .gte("day_date", from56),
    calcStreak(supabase, user.id, today),
  ]);

  const rawWeights = weightsRes.data || [];
  const foodLogs = foodLogsRes.data || [];
  const waterLogs = waterLogsRes.data || [];

  const weights = rawWeights.map(mapWeightFromDb);

  // Group food logs by day_date for daily kcal
  const kcalMap = new Map<string, number>();
  for (const l of foodLogs) {
    const d = String(l.day_date);
    kcalMap.set(d, (kcalMap.get(d) ?? 0) + Number(l.kcal));
  }

  const dailyKcal: { date: string; kcal: number }[] = [];
  for (let i = 55; i >= 0; i--) {
    const d = dayString(new Date(todayDt.getTime() - i * DAY));
    dailyKcal.push({ date: d, kcal: Math.round(kcalMap.get(d) ?? 0) });
  }

  // Macro averages over logged days only (last 30d)
  const macro30 = foodLogs.filter((r) => String(r.day_date) >= from30);
  const loggedDays = new Set(macro30.map((r) => String(r.day_date)));
  const macroAvg = { protein: 0, carbs: 0, fat: 0 };
  if (macro30.length && loggedDays.size) {
    for (const r of macro30) {
      macroAvg.protein += Number(r.protein_g ?? 0);
      macroAvg.carbs += Number(r.carbs_g ?? 0);
      macroAvg.fat += Number(r.fat_g ?? 0);
    }
    macroAvg.protein = Math.round((macroAvg.protein / loggedDays.size) * 10) / 10;
    macroAvg.carbs = Math.round((macroAvg.carbs / loggedDays.size) * 10) / 10;
    macroAvg.fat = Math.round((macroAvg.fat / loggedDays.size) * 10) / 10;
  }

  // Group water by day_date
  const waterMap = new Map<string, number>();
  for (const w of waterLogs) {
    const d = String(w.day_date);
    waterMap.set(d, (waterMap.get(d) ?? 0) + Number(w.amount_ml));
  }

  // 7-day water average
  const from7 = dayString(new Date(todayDt.getTime() - 6 * DAY));
  let last7WaterTotal = 0;
  for (const [d, total] of waterMap.entries()) {
    if (d >= from7 && d <= today) {
      last7WaterTotal += total;
    }
  }
  const waterAvg = Math.round(last7WaterTotal / 7);

  // Daily macros total sum per day
  const macroSum = new Map<string, { p: number; c: number; f: number }>();
  for (const r of foodLogs) {
    const d = String(r.day_date);
    const s = macroSum.get(d) ?? { p: 0, c: 0, f: 0 };
    s.p += Number(r.protein_g ?? 0);
    s.c += Number(r.carbs_g ?? 0);
    s.f += Number(r.fat_g ?? 0);
    macroSum.set(d, s);
  }

  const dailyMacros = [...macroSum.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, s]) => ({
      date,
      p: Math.round(s.p * 10) / 10,
      c: Math.round(s.c * 10) / 10,
      f: Math.round(s.f * 10) / 10,
    }));

  const dailyWater = [...waterMap.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, ml]) => ({ date, ml }));

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
