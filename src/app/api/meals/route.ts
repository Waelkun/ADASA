import { NextRequest } from "next/server";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { jsonError } from "@/lib/server";
import { mapSavedMealFromDb } from "@/lib/mappers";

/**
 * GET /api/meals — saved meals ("وجباتي"), newest first
 * POST /api/meals — save a meal snapshot {name, items[]}
 */
export async function GET() {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", 401);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("saved_meals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("meals GET error:", error);
    return jsonError("Failed to fetch meals", 500);
  }

  return Response.json((data || []).map(mapSavedMealFromDb));
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", 401);

  try {
    const b = await req.json();
    const name = typeof b?.name === "string" && b.name.trim() ? b.name.trim().slice(0, 60) : "";
    if (!name) return jsonError("name required", 400);
    if (!Array.isArray(b?.items) || b.items.length === 0 || b.items.length > 50) {
      return jsonError("items required (1-50)", 400);
    }
    const num = (v: unknown) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 ? n : 0;
    };
    const numOrNull = (v: unknown) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 ? n : null;
    };
    const imgOk = (v: unknown): v is string =>
      typeof v === "string" && v.startsWith("data:image/") && v.length < 400_000;
    const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

    // snapshot each item exactly as logged
    const items = b.items.map((it: Record<string, unknown>) => ({
      foodId: typeof it?.foodId === "string" && it.foodId ? it.foodId : null,
      name: str(it?.name, 80) || "—",
      grams: num(it?.grams),
      kcal: num(it?.kcal),
      proteinG: num(it?.proteinG),
      carbsG: num(it?.carbsG),
      fatG: num(it?.fatG),
      kcal100: numOrNull(it?.kcal100),
      protein100: numOrNull(it?.protein100),
      carbs100: numOrNull(it?.carbs100),
      fat100: numOrNull(it?.fat100),
      imageUrl: imgOk(it?.imageUrl) ? it.imageUrl : null,
    }));

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("saved_meals")
      .insert({
        user_id: user.id,
        name,
        items,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("meals POST error:", error);
      return jsonError("Failed to save meal", 500);
    }

    return Response.json(mapSavedMealFromDb(data), { status: 201 });
  } catch (e) {
    console.error("meals POST error:", e);
    return jsonError("invalid payload", 400);
  }
}
