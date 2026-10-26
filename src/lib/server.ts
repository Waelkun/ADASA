import { mapProfileFromDb } from "./mappers";
import type { Profile } from "./types";

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

/** Ensure profile exists in Supabase and return it in camelCase */
export async function getUserProfile(supabase: any, userId: string): Promise<Profile> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (data) {
    return mapProfileFromDb(data);
  }

  // Fallback: create default profile if trigger hasn't fired yet
  const { data: created, error: insertError } = await supabase
    .from("profiles")
    .upsert({ user_id: userId }, { onConflict: "user_id" })
    .select()
    .single();

  if (insertError) {
    console.error("Failed to ensure profile:", insertError);
    throw insertError;
  }

  return mapProfileFromDb(created);
}

/** streak of consecutive logged days ending today (or yesterday) */
export async function calcStreak(supabase: any, userId: string, dayDate: string): Promise<number> {
  const { data } = await supabase
    .from("food_logs")
    .select("day_date")
    .eq("user_id", userId);

  if (!data || data.length === 0) return 0;

  const set = new Set<string>(data.map((r: any) => String(r.day_date)));
  let streak = 0;
  const cursor = new Date(dayDate + "T00:00:00");
  // if today not logged, start from yesterday so streak isn't zeroed mid-day
  if (!set.has(dayDate)) cursor.setDate(cursor.getDate() - 1);

  for (let i = 0; i < 365; i++) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, "0");
    const d = String(cursor.getDate()).padStart(2, "0");
    if (!set.has(`${y}-${m}-${d}`)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
