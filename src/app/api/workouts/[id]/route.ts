import { NextRequest } from "next/server";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { jsonError } from "@/lib/server";
import { mapWorkoutFromDb } from "@/lib/mappers";

/** DELETE /api/workouts/:id */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", 401);

  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase
    .from("workouts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return jsonError("not found", 404);
  }

  return Response.json({ ok: true });
}

/** PATCH /api/workouts/:id { muscleGroups?, durationMin?, note? } */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", 401);

  const { id } = await params;

  try {
    const b = await req.json();
    const updates: Record<string, any> = {};

    if (Array.isArray(b.muscleGroups) && b.muscleGroups.length) {
      updates.muscle_groups = b.muscleGroups.filter((g: unknown) =>
        ["chest", "back", "arms", "legs", "abs", "shoulders", "cardio", "other"].includes(
          g as string
        )
      );
    }
    if (b.durationMin != null) {
      const d = Number(b.durationMin);
      updates.duration_min = Number.isFinite(d) && d > 0 ? Math.round(d) : null;
    }
    if (b.note !== undefined) {
      updates.note =
        typeof b.note === "string" && b.note.trim() ? b.note.trim().slice(0, 200) : null;
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("workouts")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error || !data) {
      return jsonError("not found", 404);
    }

    return Response.json(mapWorkoutFromDb(data));
  } catch {
    return jsonError("not found", 404);
  }
}
