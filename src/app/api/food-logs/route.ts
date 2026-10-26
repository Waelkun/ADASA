import { NextRequest } from "next/server";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { isDayStr, todayStr, jsonError } from "@/lib/server";
import { mapFoodLogFromDb } from "@/lib/mappers";

/** GET /api/food-logs?date=YYYY-MM-DD */
export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", 401);

  const q = req.nextUrl.searchParams.get("date");
  const date = isDayStr(q) ? q : todayStr();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("food_logs")
    .select("*")
    .eq("user_id", user.id)
    .eq("day_date", date)
    .order("logged_at", { ascending: true });

  if (error) {
    console.error("food-logs GET error:", error);
    return jsonError("Failed to fetch food logs", 500);
  }

  return Response.json((data || []).map(mapFoodLogFromDb));
}

/** POST /api/food-logs — add an entry */
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", 401);

  try {
    const b = await req.json();
    const num = (v: unknown) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };
    const numOrNull = (v: unknown) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 ? n : null;
    };
    const imgOk = (v: unknown): v is string =>
      typeof v === "string" && v.startsWith("data:image/") && v.length < 400_000;

    if (!b?.name || !b?.dayDate || !isDayStr(b.dayDate)) {
      return jsonError("name and dayDate required", 400);
    }

    const meal = ["breakfast", "lunch", "dinner", "snack"].includes(b.mealType)
      ? b.mealType
      : "snack";

    const supabase = await createClient();

    const insertData = {
      user_id: user.id,
      food_id: typeof b.foodId === "string" && b.foodId ? b.foodId : null,
      name: String(b.name).slice(0, 80),
      logged_at: b.loggedAt ? new Date(b.loggedAt).toISOString() : new Date().toISOString(),
      day_date: b.dayDate,
      meal_type: meal,
      grams: Math.max(0, num(b.grams)),
      kcal: Math.max(0, num(b.kcal)),
      protein_g: Math.max(0, num(b.proteinG)),
      carbs_g: Math.max(0, num(b.carbsG)),
      fat_g: Math.max(0, num(b.fatG)),
      source: ["scan", "manual", "myfoods"].includes(b.source) ? b.source : "manual",
      kcal100: numOrNull(b.kcal100),
      protein100: numOrNull(b.protein100),
      carbs100: numOrNull(b.carbs100),
      fat100: numOrNull(b.fat100),
      image_url: imgOk(b.imageUrl) ? b.imageUrl : null,
    };

    const { data, error } = await supabase
      .from("food_logs")
      .insert(insertData)
      .select()
      .single();

    if (error || !data) {
      console.error("food-logs POST error:", error);
      return jsonError("Failed to add food log", 500);
    }

    return Response.json(mapFoodLogFromDb(data), { status: 201 });
  } catch (e) {
    console.error("food-logs POST error:", e);
    return jsonError("invalid payload", 400);
  }
}
