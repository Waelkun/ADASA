import { NextRequest } from "next/server";
import { db } from "@/lib/db";

/** DELETE /api/water/:id — undo last entry */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await db.waterLog.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "not found" }, { status: 404 });
  }
}
