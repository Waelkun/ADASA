import { NextRequest } from "next/server";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { jsonError } from "@/lib/server";
import { mapFoodFromDb } from "@/lib/mappers";

/** PATCH /api/foods/:id — toggle favorite / edit basic fields */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", 401);

  const { id } = await params;

  try {
    const body = await req.json();
    const supabase = await createClient();

    const updates: Record<string, any> = {};
    if (typeof body.isFavorite === "boolean") {
      updates.is_favorite = body.isFavorite;
    }

    const { data, error } = await supabase
      .from("foods")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error || !data) {
      return jsonError("not found", 404);
    }

    return Response.json(mapFoodFromDb(data));
  } catch (e) {
    return jsonError("invalid payload", 400);
  }
}

/** DELETE /api/foods/:id */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", 401);

  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase
    .from("foods")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return jsonError("not found", 404);
  }

  return Response.json({ ok: true });
}
