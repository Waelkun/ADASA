import { NextRequest } from "next/server";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { getUserProfile, jsonError } from "@/lib/server";
import { mapProfileFromDb } from "@/lib/mappers";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", 401);

  const supabase = await createClient();
  const profile = await getUserProfile(supabase, user.id);
  return Response.json(profile);
}

export async function PUT(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", 401);

  try {
    const body = await req.json();
    const num = (v: unknown, lo: number, hi: number, fallback: number) => {
      const n = Number(v);
      if (!Number.isFinite(n) || n < lo || n > hi) return fallback;
      return n;
    };

    const supabase = await createClient();

    // Map frontend camelCase fields to snake_case db fields
    const updates: Record<string, any> = {};

    if (typeof body.displayName === "string" && body.displayName.trim()) {
      updates.display_name = body.displayName.trim().slice(0, 40);
    }
    if (body.sex === "female" || body.sex === "male") {
      updates.sex = body.sex;
    }
    if (body.birthYear != null) {
      updates.birth_year = num(body.birthYear, 1930, 2015, 1995);
    }
    if (body.heightCm != null) {
      updates.height_cm = num(body.heightCm, 100, 250, 175);
    }
    if (["sedentary", "light", "moderate", "active", "very_active"].includes(body.activityLevel)) {
      updates.activity_level = body.activityLevel;
    }
    if (["lose", "maintain", "gain"].includes(body.goalType)) {
      updates.goal_type = body.goalType;
    }
    if (body.kcalGoal != null) {
      updates.kcal_goal = num(body.kcalGoal, 800, 6000, 2100);
    }
    if (body.proteinG != null) {
      updates.protein_g = num(body.proteinG, 10, 500, 160);
    }
    if (body.carbsG != null) {
      updates.carbs_g = num(body.carbsG, 0, 800, 190);
    }
    if (body.fatG != null) {
      updates.fat_g = num(body.fatG, 10, 300, 70);
    }
    if (body.waterGoalMl != null) {
      updates.water_goal_ml = num(body.waterGoalMl, 500, 8000, 2800);
    }
    if (body.goalWeightKg !== undefined) {
      updates.goal_weight_kg =
        body.goalWeightKg == null || body.goalWeightKg === ""
          ? null
          : num(body.goalWeightKg, 30, 300, 78);
    }
    if (body.workoutsPerWeek != null) {
      updates.workouts_per_week = num(body.workoutsPerWeek, 1, 7, 4);
    }
    if (body.units === "imperial" || body.units === "metric") {
      updates.units = body.units;
    }
    if (body.onboardingCompleted === true) {
      updates.onboarding_completed = true;
    }
    if (body.zigzagPlan !== undefined) {
      updates.zigzag_plan = ["plan1", "plan2"].includes(body.zigzagPlan)
        ? body.zigzagPlan
        : null;
    }
    if (body.zigzagStart !== undefined) {
      updates.zigzag_start =
        typeof body.zigzagStart === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.zigzagStart)
          ? body.zigzagStart
          : null;
    }

    const { data: updated, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error || !updated) {
      // If profile doesn't exist, upsert
      const { data: upserted, error: upsertErr } = await supabase
        .from("profiles")
        .upsert({ user_id: user.id, ...updates }, { onConflict: "user_id" })
        .select()
        .single();

      if (upsertErr) throw upsertErr;
      return Response.json(mapProfileFromDb(upserted));
    }

    return Response.json(mapProfileFromDb(updated));
  } catch (e) {
    console.error("profile PUT", e);
    return jsonError("invalid payload", 400);
  }
}
