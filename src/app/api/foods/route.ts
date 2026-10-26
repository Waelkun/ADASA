import { NextRequest } from "next/server";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { jsonError } from "@/lib/server";
import { mapFoodFromDb } from "@/lib/mappers";

/** GET /api/foods?q=&fav=1&sort=usage — search my foods */
export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", 401);

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  const fav = req.nextUrl.searchParams.get("fav") === "1";
  const usageSort = req.nextUrl.searchParams.get("sort") === "usage";

  const supabase = await createClient();

  if (usageSort) {
    const [foodsRes, logsRes] = await Promise.all([
      supabase
        .from("foods")
        .select("*")
        .eq("user_id", user.id)
        .limit(300),
      supabase
        .from("food_logs")
        .select("food_id")
        .eq("user_id", user.id)
        .not("food_id", "is", null),
    ]);

    const foods = (foodsRes.data || []).map(mapFoodFromDb);
    const countMap = new Map<string, number>();

    for (const log of logsRes.data || []) {
      if (log.food_id) {
        countMap.set(log.food_id, (countMap.get(log.food_id) ?? 0) + 1);
      }
    }

    const filtered = q
      ? foods.filter(
          (f) =>
            f.name.toLowerCase().includes(q.toLowerCase()) ||
            (f.brand ?? "").toLowerCase().includes(q.toLowerCase())
        )
      : foods;

    filtered.sort(
      (a, b) =>
        (countMap.get(b.id) ?? 0) - (countMap.get(a.id) ?? 0) ||
        a.name.localeCompare(b.name)
    );

    return Response.json(filtered);
  }

  let query = supabase
    .from("foods")
    .select("*")
    .eq("user_id", user.id);

  if (fav) {
    query = query.eq("is_favorite", true);
  }

  if (q) {
    query = query.or(`name.ilike.%${q}%,brand.ilike.%${q}%`);
  }

  const { data, error } = await query
    .order("is_favorite", { ascending: false })
    .order("name", { ascending: true })
    .limit(60);

  if (error) {
    console.error("foods GET error:", error);
    return jsonError("Failed to fetch foods", 500);
  }

  return Response.json((data || []).map(mapFoodFromDb));
}

/** POST /api/foods — create a food (after scan or manual) */
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", 401);

  try {
    const b = await req.json();
    const num = (v: unknown, d = 0) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 ? n : d;
    };

    const imgOk = (v: unknown): v is string =>
      typeof v === "string" && v.startsWith("data:image/") && v.length < 400_000;

    if (!b?.name || typeof b.name !== "string" || !b.name.trim()) {
      return jsonError("name required", 400);
    }

    const supabase = await createClient();

    const insertData = {
      user_id: user.id,
      name: b.name.trim().slice(0, 80),
      brand:
        typeof b.brand === "string" && b.brand.trim()
          ? b.brand.trim().slice(0, 60)
          : null,
      serving_size_g: b.servingSizeG != null ? num(b.servingSizeG) : null,
      kcal100: num(b.kcal100),
      protein100: num(b.protein100),
      carbs100: num(b.carbs100),
      sugar100: b.sugar100 != null ? num(b.sugar100) : null,
      fat100: num(b.fat100),
      sat_fat100: b.satFat100 != null ? num(b.satFat100) : null,
      fiber100: b.fiber100 != null ? num(b.fiber100) : null,
      salt100: b.salt100 != null ? num(b.salt100) : null,
      image_url: imgOk(b.imageUrl) ? b.imageUrl : null,
      is_favorite: Boolean(b.isFavorite),
    };

    const { data, error } = await supabase
      .from("foods")
      .insert(insertData)
      .select()
      .single();

    if (error || !data) {
      console.error("foods POST error:", error);
      return jsonError("Failed to save food", 500);
    }

    return Response.json(mapFoodFromDb(data), { status: 201 });
  } catch (e) {
    console.error("foods POST error:", e);
    return jsonError("invalid payload", 400);
  }
}
