import { NextRequest } from "next/server";
import { db } from "@/lib/db";

/** DELETE /api/meals/[id] — remove a saved meal */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await db.savedMeal.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "not found" }, { status: 404 });
  }
}
