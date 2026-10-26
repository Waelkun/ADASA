import { NextRequest } from "next/server";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { jsonError } from "@/lib/server";
import { mapFoodLogFromDb } from "@/lib/mappers";

/** PATCH /api/food-logs/:id — edit grams and values */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", 401);

  const { id } = await params;

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

    const supabase = await createClient();

    const updates: Record<string, any> = {};
    if (b.grams != null) updates.grams = Math.max(0, num(b.grams));
    if (b.kcal != null) updates.kcal = Math.max(0, num(b.kcal));
    if (b.proteinG != null) updates.protein_g = Math.max(0, num(b.proteinG));
    if (b.carbsG != null) updates.carbs_g = Math.max(0, num(b.carbsG));
    if (b.fatG != null) updates.fat_g = Math.max(0, num(b.fatG));

    if (b.kcal100 !== undefined) updates.kcal100 = numOrNull(b.kcal100);
    if (b.protein100 !== undefined) updates.protein100 = numOrNull(b.protein100);
    if (b.carbs100 !== undefined) updates.carbs100 = numOrNull(b.carbs100);
    if (b.fat100 !== undefined) updates.fat100 = numOrNull(b.fat100);

    const { data, error } = await supabase
      .from("food_logs")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error || !data) {
      return jsonError("not found", 404);
    }

    return Response.json(mapFoodLogFromDb(data));
  } catch (e) {
    console.error("food-logs PATCH error:", e);
    return jsonError("invalid payload", 400);
  }
}

/** DELETE /api/food-logs/:id */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", 401);

  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase
    .from("food_logs")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return jsonError("not found", 404);
  }

  return Response.json({ ok: true });
}
