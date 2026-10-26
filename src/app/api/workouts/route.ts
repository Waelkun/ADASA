import { NextRequest } from "next/server";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { todayStr, jsonError } from "@/lib/server";
import { mapWorkoutFromDb } from "@/lib/mappers";

/** GET /api/workouts?month=YYYY-MM — workouts in a month (+ stats) */
export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", 401);

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

  const supabase = await createClient();

  const [monthRes, allRes] = await Promise.all([
    supabase
      .from("workouts")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: true }),
    supabase
      .from("workouts")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false }),
  ]);

  const workouts = (monthRes.data || []).map(mapWorkoutFromDb);
  const all = (allRes.data || []).map(mapWorkoutFromDb);

  const today = todayStr();
  const weekStart = new Date(today + "T00:00:00");
  weekStart.setDate(weekStart.getDate() - 6);
  const weekStartStr = `${weekStart.getFullYear()}-${String(
    weekStart.getMonth() + 1
  ).padStart(2, "0")}-${String(weekStart.getDate()).padStart(2, "0")}`;

  const thisWeek = all.filter((w) => w.date >= weekStartStr && w.date <= today);

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

  const counts: Record<string, number> = {};
  const lastTrained: Record<string, string> = {};
  for (const w of all) {
    for (const g of w.muscleGroups) {
      counts[g] = (counts[g] ?? 0) + 1;
      if (!lastTrained[g] || w.date > lastTrained[g]) lastTrained[g] = w.date;
    }
  }

  return Response.json({
    month,
    workouts,
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
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", 401);

  try {
    const b = await req.json();
    if (
      typeof b?.date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(b.date) ||
      !Array.isArray(b.muscleGroups) ||
      !b.muscleGroups.length
    ) {
      return jsonError("date and muscleGroups[] required", 400);
    }
    const validGroups = b.muscleGroups.filter((g: unknown) =>
      ["chest", "back", "arms", "legs", "abs", "shoulders", "cardio", "other"].includes(
        g as string
      )
    );
    if (!validGroups.length) {
      return jsonError("no valid muscle groups", 400);
    }
    const dur = Number(b.durationMin);

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("workouts")
      .insert({
        user_id: user.id,
        date: b.date,
        muscle_groups: validGroups,
        duration_min: Number.isFinite(dur) && dur > 0 && dur < 600 ? Math.round(dur) : null,
        note: typeof b.note === "string" && b.note.trim() ? b.note.trim().slice(0, 200) : null,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("workouts POST error:", error);
      return jsonError("Failed to save workout", 500);
    }

    return Response.json(mapWorkoutFromDb(data), { status: 201 });
  } catch (e) {
    console.error("workouts POST error:", e);
    return jsonError("invalid payload", 400);
  }
}
