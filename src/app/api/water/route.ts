import { NextRequest } from "next/server";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { isDayStr, todayStr, jsonError } from "@/lib/server";
import { mapWaterLogFromDb } from "@/lib/mappers";

/** GET /api/water?date=YYYY-MM-DD — entries for a day + last 7 days totals */
export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", 401);

  const q = req.nextUrl.searchParams.get("date");
  const date = isDayStr(q) ? q : todayStr();

  const from = new Date(date + "T00:00:00");
  from.setDate(from.getDate() - 6);
  const fromStr = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}-${String(
    from.getDate()
  ).padStart(2, "0")}`;

  const supabase = await createClient();

  const [entriesRes, weekRes] = await Promise.all([
    supabase
      .from("water_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("day_date", date)
      .order("logged_at", { ascending: true }),
    supabase
      .from("water_logs")
      .select("day_date, amount_ml")
      .eq("user_id", user.id)
      .gte("day_date", fromStr)
      .lte("day_date", date),
  ]);

  const entries = (entriesRes.data || []).map(mapWaterLogFromDb);

  const weekMap = new Map<string, number>();
  for (const w of weekRes.data || []) {
    const d = String(w.day_date);
    weekMap.set(d, (weekMap.get(d) ?? 0) + Number(w.amount_ml));
  }
  const week = Array.from(weekMap.entries())
    .map(([d, total]) => ({ date: d, total }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return Response.json({
    date,
    total: entries.reduce((a, w) => a + w.amountMl, 0),
    entries,
    week,
  });
}

/** POST /api/water { amountMl, dayDate } */
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", 401);

  try {
    const b = await req.json();
    const amount = Math.round(Number(b?.amountMl));
    if (!Number.isFinite(amount) || amount <= 0 || amount > 3000) {
      return jsonError("amountMl must be 1-3000", 400);
    }
    const dayDate = isDayStr(b?.dayDate) ? b.dayDate : todayStr();

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("water_logs")
      .insert({
        user_id: user.id,
        amount_ml: amount,
        day_date: dayDate,
        logged_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !data) {
      console.error("water POST error:", error);
      return jsonError("Failed to log water", 500);
    }

    return Response.json(mapWaterLogFromDb(data), { status: 201 });
  } catch (e) {
    console.error("water POST error:", e);
    return jsonError("invalid payload", 400);
  }
}
