import { NextRequest } from "next/server";
import { db } from "@/lib/db";

/** PATCH /api/foods/:id — toggle favorite / edit basic fields */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await _req.json();
    const food = await db.food.update({
      where: { id },
      data: { isFavorite: !!body.isFavorite },
    });
    return Response.json(food);
  } catch {
    return Response.json({ error: "not found" }, { status: 404 });
  }
}

/** DELETE /api/foods/:id */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await db.food.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "not found" }, { status: 404 });
  }
}
