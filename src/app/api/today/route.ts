import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getProfile, isDayStr, todayStr, calcStreak } from "@/lib/server";
import type { MealType, SourceType, Workout } from "@/lib/types";

/** GET /api/today?date=YYYY-MM-DD — aggregated Today screen payload */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("date");
  const date = isDayStr(q) ? q : todayStr();

  const [profile, logs, waterEntries, weightToday, workoutsToday, streak] = await Promise.all([
    getProfile(),
    db.foodLog.findMany({
      where: { dayDate: date },
      orderBy: { loggedAt: "asc" },
    }),
    db.waterLog.findMany({ where: { dayDate: date }, orderBy: { loggedAt: "asc" } }),
    db.weightLog.findUnique({ where: { date } }),
    db.workout.findFirst({ where: { date } }),
    calcStreak(date),
  ]);

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

  return Response.json({
    profile,
    logs: logs.map((l) => ({
      ...l,
      loggedAt: l.loggedAt.toISOString(),
      mealType: l.mealType as MealType,
      source: l.source as SourceType,
    })),
    totals,
    waterToday: {
      total: waterEntries.reduce((a, w) => a + w.amountMl, 0),
      entries: waterEntries.map((w) => ({
        id: w.id,
        amountMl: w.amountMl,
        loggedAt: w.loggedAt.toISOString(),
      })),
    },
    weightToday,
    workoutToday: workoutsToday
      ? ({
          id: workoutsToday.id,
          date: workoutsToday.date,
          muscleGroups: JSON.parse(workoutsToday.muscleGroups) as string[],
          durationMin: workoutsToday.durationMin,
          note: workoutsToday.note,
        } as Workout)
      : null,
    streak,
  });
}
