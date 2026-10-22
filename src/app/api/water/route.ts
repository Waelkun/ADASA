import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isDayStr, todayStr } from "@/lib/server";

/** GET /api/water?date=YYYY-MM-DD — entries for a day + last 7 days totals */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("date");
  const date = isDayStr(q) ? q : todayStr();

  const from = new Date(date + "T00:00:00");
  from.setDate(from.getDate() - 6);
  const fromStr = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}-${String(
    from.getDate()
  ).padStart(2, "0")}`;

  const entries = await db.waterLog.findMany({
    where: { dayDate: date },
    orderBy: { loggedAt: "asc" },
  });

  const week = await db.waterLog.groupBy({
    by: ["dayDate"],
    where: { dayDate: { gte: fromStr, lte: date } },
    _sum: { amountMl: true },
    orderBy: { dayDate: "asc" },
  });

  return Response.json({
    date,
    total: entries.reduce((a, w) => a + w.amountMl, 0),
    entries: entries.map((w) => ({
      id: w.id,
      amountMl: w.amountMl,
      loggedAt: w.loggedAt.toISOString(),
    })),
    week: week.map((w) => ({ date: w.dayDate, total: w._sum.amountMl ?? 0 })),
  });
}

/** POST /api/water { amountMl, dayDate } */
export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const amount = Math.round(Number(b?.amountMl));
    if (!Number.isFinite(amount) || amount <= 0 || amount > 3000) {
      return Response.json({ error: "amountMl must be 1-3000" }, { status: 400 });
    }
    const dayDate = isDayStr(b?.dayDate) ? b.dayDate : todayStr();
    const entry = await db.waterLog.create({
      data: { amountMl: amount, dayDate, loggedAt: new Date() },
    });
    return Response.json(
      { ...entry, loggedAt: entry.loggedAt.toISOString() },
      { status: 201 }
    );
  } catch (e) {
    console.error("water POST", e);
    return Response.json({ error: "invalid payload" }, { status: 400 });
  }
}
