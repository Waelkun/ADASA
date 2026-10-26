import { NextRequest } from "next/server";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { getUserProfile, isDayStr, todayStr, calcStreak, jsonError } from "@/lib/server";
import {
  mapFoodLogFromDb,
  mapWaterLogFromDb,
  mapWeightFromDb,
  mapWorkoutFromDb,
} from "@/lib/mappers";
import { effectiveKcalGoal } from "@/lib/nutrition";

/** GET /api/today?date=YYYY-MM-DD — aggregated Today screen payload */
export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", 401);

  const q = req.nextUrl.searchParams.get("date");
  const date = isDayStr(q) ? q : todayStr();

  const supabase = await createClient();

  const [
    profile,
    foodLogsRes,
    waterRes,
    weightRes,
    workoutRes,
    streak,
  ] = await Promise.all([
    getUserProfile(supabase, user.id),
    supabase
      .from("food_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("day_date", date)
      .order("logged_at", { ascending: true }),
    supabase
      .from("water_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("day_date", date)
      .order("logged_at", { ascending: true }),
    supabase
      .from("weight_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", date)
      .maybeSingle(),
    supabase
      .from("workouts")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", date)
      .maybeSingle(),
    calcStreak(supabase, user.id, date),
  ]);

  const rawLogs = foodLogsRes.data || [];
  const rawWater = waterRes.data || [];
  const weightData = weightRes.data;
  const workoutData = workoutRes.data;

  const logs = rawLogs.map(mapFoodLogFromDb);
  const waterEntries = rawWater.map(mapWaterLogFromDb);

  const totals = logs.reduce(
    (acc, l) => ({
      kcal: acc.kcal + l.kcal,
      protein: acc.protein + l.proteinG,
      carbs: acc.carbs + l.carbsG,
      fat: acc.fat + l.fatG,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );

  totals.kcal = Math.round(totals.kcal);
  totals.protein = Math.round(totals.protein * 10) / 10;
  totals.carbs = Math.round(totals.carbs * 10) / 10;
  totals.fat = Math.round(totals.fat * 10) / 10;

  const kcalGoalToday = effectiveKcalGoal(
    profile.kcalGoal,
    profile.zigzagPlan,
    profile.zigzagStart,
    date
  );

  return Response.json({
    profile: { ...profile, kcalGoal: kcalGoalToday, kcalGoalBase: profile.kcalGoal },
    logs,
    totals,
    waterToday: {
      total: waterEntries.reduce((a, w) => a + w.amountMl, 0),
      entries: waterEntries,
    },
    weightToday: weightData ? mapWeightFromDb(weightData) : null,
    workoutToday: workoutData ? mapWorkoutFromDb(workoutData) : null,
    streak,
  });
}
