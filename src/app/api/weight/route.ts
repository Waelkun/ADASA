import { NextRequest } from "next/server";
import { db } from "@/lib/db";

/** GET /api/weight — all weight entries ascending */
export async function GET() {
  const entries = await db.weightLog.findMany({ orderBy: { date: "asc" } });
  return Response.json(entries);
}

/** POST /api/weight { date, weightKg, note? } — upsert one per day */
export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const w = Number(b?.weightKg);
    if (!Number.isFinite(w) || w < 25 || w > 350) {
      return Response.json({ error: "weightKg must be 25-350" }, { status: 400 });
    }
    if (typeof b?.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(b.date)) {
      return Response.json({ error: "date required (YYYY-MM-DD)" }, { status: 400 });
    }
    const entry = await db.weightLog.upsert({
      where: { date: b.date },
      update: { weightKg: w, note: b.note ?? null },
      create: { date: b.date, weightKg: w, note: b.note ?? null },
    });
    return Response.json(entry);
  } catch (e) {
    console.error("weight POST", e);
    return Response.json({ error: "invalid payload" }, { status: 400 });
  }
}
