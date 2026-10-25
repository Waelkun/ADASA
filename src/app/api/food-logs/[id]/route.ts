import { NextRequest } from "next/server";
import { db } from "@/lib/db";

/** PATCH /api/food-logs/:id — edit grams (client sends proportionally recomputed totals) */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const data: Record<string, number | null> = {};
    for (const k of ["grams", "kcal", "proteinG", "carbsG", "fatG"]) {
      if (b?.[k] != null) data[k] = Math.max(0, num(b[k]));
    }
    for (const k of ["kcal100", "protein100", "carbs100", "fat100"]) {
      if (b?.[k] !== undefined) data[k] = numOrNull(b[k]);
    }
    const log = await db.foodLog.update({ where: { id }, data });
    return Response.json({ ...log, loggedAt: log.loggedAt.toISOString() });
  } catch (e) {
    console.error("food-logs PATCH", e);
    return Response.json({ error: "not found or invalid payload" }, { status: 400 });
  }
}

/** DELETE /api/food-logs/:id */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await db.foodLog.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "not found" }, { status: 404 });
  }
}
