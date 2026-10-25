import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getProfile } from "@/lib/server";

export async function GET() {
  const profile = await getProfile();
  return Response.json(profile);
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const num = (v: unknown, lo: number, hi: number, fallback: number) => {
      const n = Number(v);
      if (!Number.isFinite(n) || n < lo || n > hi) return fallback;
      return n;
    };
    await getProfile();
    const updated = await db.profile.update({
      where: { id: 1 },
      data: {
        displayName:
          typeof body.displayName === "string" && body.displayName.trim()
            ? body.displayName.trim().slice(0, 40)
            : undefined,
        sex: body.sex === "female" ? "female" : body.sex === "male" ? "male" : undefined,
        birthYear: body.birthYear != null ? num(body.birthYear, 1930, 2015, 1995) : undefined,
        heightCm: body.heightCm != null ? num(body.heightCm, 100, 250, 175) : undefined,
        activityLevel: ["sedentary", "light", "moderate", "active", "very_active"].includes(
          body.activityLevel
        )
          ? body.activityLevel
          : undefined,
        goalType: ["lose", "maintain", "gain"].includes(body.goalType)
          ? body.goalType
          : undefined,
        kcalGoal: num(body.kcalGoal, 800, 6000, 2100),
        proteinG: num(body.proteinG, 10, 500, 160),
        carbsG: num(body.carbsG, 0, 800, 190),
        fatG: num(body.fatG, 10, 300, 70),
        waterGoalMl: num(body.waterGoalMl, 500, 8000, 2800),
        // undefined = not provided (leave as-is); null/"" = explicit clear
        goalWeightKg:
          body.goalWeightKg === undefined
            ? undefined
            : body.goalWeightKg == null || body.goalWeightKg === ""
              ? null
              : num(body.goalWeightKg, 30, 300, 78),
        workoutsPerWeek: num(body.workoutsPerWeek, 1, 7, 4),
        units: body.units === "imperial" ? "imperial" : "metric",
        // welcome screen completion (only ever set to true here)
        onboardingCompleted: body.onboardingCompleted === true ? true : undefined,
      },
    });
    return Response.json(updated);
  } catch (e) {
    console.error("profile PUT", e);
    return Response.json({ error: "invalid payload" }, { status: 400 });
  }
}
