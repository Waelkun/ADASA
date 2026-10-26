import { NextRequest } from "next/server";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { jsonError } from "@/lib/server";
import { mapWeightFromDb } from "@/lib/mappers";

/** GET /api/weight — all weight entries ascending */
export async function GET() {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", 401);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("weight_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: true });

  if (error) {
    console.error("weight GET error:", error);
    return jsonError("Failed to fetch weights", 500);
  }

  return Response.json((data || []).map(mapWeightFromDb));
}

/** POST /api/weight { date, weightKg, note? } — upsert one per day */
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", 401);

  try {
    const b = await req.json();
    const w = Number(b?.weightKg);
    if (!Number.isFinite(w) || w < 25 || w > 350) {
      return jsonError("weightKg must be 25-350", 400);
    }
    if (typeof b?.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(b.date)) {
      return jsonError("date required (YYYY-MM-DD)", 400);
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("weight_logs")
      .upsert(
        {
          user_id: user.id,
          date: b.date,
          weight_kg: w,
          note: b.note ?? null,
        },
        { onConflict: "user_id,date" }
      )
      .select()
      .single();

    if (error || !data) {
      console.error("weight POST error:", error);
      return jsonError("Failed to save weight", 500);
    }

    return Response.json(mapWeightFromDb(data));
  } catch (e) {
    console.error("weight POST error:", e);
    return jsonError("invalid payload", 400);
  }
}
