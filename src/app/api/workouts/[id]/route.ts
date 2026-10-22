import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import type { Workout } from "@/lib/types";

/** DELETE /api/workouts/:id */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await db.workout.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "not found" }, { status: 404 });
  }
}

/** PATCH /api/workouts/:id { muscleGroups?, durationMin?, note? } */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const b = await req.json();
    const data: Record<string, unknown> = {};
    if (Array.isArray(b.muscleGroups) && b.muscleGroups.length) {
      data.muscleGroups = JSON.stringify(
        b.muscleGroups.filter((g: unknown) =>
          ["chest", "back", "arms", "legs", "abs", "shoulders", "cardio", "other"].includes(
            g as string
          )
        )
      );
    }
    if (b.durationMin != null) {
      const d = Number(b.durationMin);
      data.durationMin = Number.isFinite(d) && d > 0 ? Math.round(d) : null;
    }
    if (b.note !== undefined) {
      data.note = typeof b.note === "string" && b.note.trim() ? b.note.trim().slice(0, 200) : null;
    }
    const w = await db.workout.update({ where: { id }, data });
    return Response.json({
      id: w.id,
      date: w.date,
      muscleGroups: JSON.parse(w.muscleGroups),
      durationMin: w.durationMin,
      note: w.note,
    } satisfies Workout);
  } catch {
    return Response.json({ error: "not found" }, { status: 404 });
  }
}
