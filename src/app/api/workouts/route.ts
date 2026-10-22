import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { todayStr } from "@/lib/server";
import type { Workout } from "@/lib/types";

const parseWorkout = (w: {
  id: string;
  date: string;
  muscleGroups: string;
  durationMin: number | null;
  note: string | null;
}): Workout => ({
  id: w.id,
  date: w.date,
  muscleGroups: JSON.parse(w.muscleGroups) as string[],
  durationMin: w.durationMin,
  note: w.note,
});

/** GET /api/workouts?month=YYYY-MM — workouts in a month (+ stats) */
export async function GET(req: NextRequest) {
  const m = req.nextUrl.searchParams.get("month"); // YYYY-MM
  const valid = m && /^\d{4}-\d{2}$/.test(m);
  const now = new Date();
  const month = valid
    ? m!
    : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [year, mo] = month.split("-").map(Number);
  const start = `${month}-01`;
  const endDate = new Date(year, mo, 0); // last day of month
  const end = `${month}-${String(endDate.getDate()).padStart(2, "0")}`;

  const workouts = await db.workout.findMany({
    where: { date: { gte: start, lte: end } },
    orderBy: { date: "asc" },
  });

  // all workouts for stats (muscle counts, last trained, streak)
  const all = await db.workout.findMany({ orderBy: { date: "desc" } });

  // this week (starting Saturday for MENA week? use Monday-based ISO week — simpler: last 7 days)
  const today = todayStr();
  const weekStart = new Date(today + "T00:00:00");
  weekStart.setDate(weekStart.getDate() - 6);
  const weekStartStr = `${weekStart.getFullYear()}-${String(
    weekStart.getMonth() + 1
  ).padStart(2, "0")}-${String(weekStart.getDate()).padStart(2, "0")}`;

  const thisWeek = all.filter((w) => w.date >= weekStartStr && w.date <= today);

  // workout streak (consecutive weeks meeting target is complex; use consecutive training days gap<=2)
  let streak = 0;
  if (all.length) {
    const dates = [...new Set(all.map((w) => w.date))].sort().reverse();
    let prev: Date | null = null;
    for (const d of dates) {
      const cur = new Date(d + "T00:00:00");
      if (prev) {
        const gap = (prev.getTime() - cur.getTime()) / 86400000;
        if (gap <= 3) streak++;
        else break;
      } else {
        const gapFromToday = (Date.now() - cur.getTime()) / 86400000;
        if (gapFromToday <= 3) streak++;
        else break;
      }
      prev = cur;
    }
  }

  // count per muscle group + last trained date
  const counts: Record<string, number> = {};
  const lastTrained: Record<string, string> = {};
  for (const w of all) {
    const groups = JSON.parse(w.muscleGroups) as string[];
    for (const g of groups) {
      counts[g] = (counts[g] ?? 0) + 1;
      if (!lastTrained[g] || w.date > lastTrained[g]) lastTrained[g] = w.date;
    }
  }

  return Response.json({
    month,
    workouts: workouts.map(parseWorkout),
    stats: {
      thisWeekCount: thisWeek.length,
      streak,
      counts,
      lastTrained,
      lastWorkoutDate: all[0]?.date ?? null,
    },
  });
}

/** POST /api/workouts { date, muscleGroups: string[], durationMin?, note? } */
export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    if (
      typeof b?.date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(b.date) ||
      !Array.isArray(b.muscleGroups) ||
      !b.muscleGroups.length
    ) {
      return Response.json(
        { error: "date and muscleGroups[] required" },
        { status: 400 }
      );
    }
    const validGroups = b.muscleGroups.filter((g: unknown) =>
      ["chest", "back", "arms", "legs", "abs", "shoulders", "cardio", "other"].includes(g as string)
    );
    if (!validGroups.length) {
      return Response.json({ error: "no valid muscle groups" }, { status: 400 });
    }
    const dur = Number(b.durationMin);
    const workout = await db.workout.create({
      data: {
        date: b.date,
        muscleGroups: JSON.stringify(validGroups),
        durationMin: Number.isFinite(dur) && dur > 0 && dur < 600 ? Math.round(dur) : null,
        note: typeof b.note === "string" && b.note.trim() ? b.note.trim().slice(0, 200) : null,
      },
    });
    return Response.json(parseWorkout(workout), { status: 201 });
  } catch (e) {
    console.error("workouts POST", e);
    return Response.json({ error: "invalid payload" }, { status: 400 });
  }
}
