import { db } from "@/lib/db";

/** Ensure the single demo profile exists and return it */
export async function getProfile() {
  let p = await db.profile.findUnique({ where: { id: 1 } });
  if (!p) {
    p = await db.profile.create({ data: { id: 1 } });
  }
  return p;
}

/** Validate YYYY-MM-DD */
export function isDayStr(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

/** today in YYYY-MM-DD (server fallback; client should pass its own) */
export function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

/** streak of consecutive logged days ending today (or yesterday) */
export async function calcStreak(dayDate: string): Promise<number> {
  const days = await db.foodLog.findMany({
    select: { dayDate: true },
    distinct: ["dayDate"],
  });
  const set = new Set(days.map((d) => d.dayDate));
  let streak = 0;
  const cursor = new Date(dayDate + "T00:00:00");
  // if today not logged, start from yesterday so streak isn't zeroed mid-day
  if (!set.has(dayDate)) cursor.setDate(cursor.getDate() - 1);
  for (;;) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, "0");
    const d = String(cursor.getDate()).padStart(2, "0");
    if (!set.has(`${y}-${m}-${d}`)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
