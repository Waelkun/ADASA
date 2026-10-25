import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isDayStr, todayStr } from "@/lib/server";
import type { MealType, SourceType } from "@/lib/types";

/** GET /api/food-logs?date=YYYY-MM-DD */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("date");
  const date = isDayStr(q) ? q : todayStr();
  const logs = await db.foodLog.findMany({
    where: { dayDate: date },
    orderBy: { loggedAt: "asc" },
  });
  return Response.json(
    logs.map((l) => ({
      ...l,
      loggedAt: l.loggedAt.toISOString(),
      mealType: l.mealType as MealType,
      source: l.source as SourceType,
    }))
  );
}

/** POST /api/food-logs — add an entry */
export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const num = (v: unknown) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };
    // additive nullable fields (per-100g + thumbnail); old clients may omit them
    const numOrNull = (v: unknown) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 ? n : null;
    };
    const imgOk = (v: unknown): v is string =>
      typeof v === "string" && v.startsWith("data:image/") && v.length < 400_000;
    if (!b?.name || !b?.dayDate || !isDayStr(b.dayDate)) {
      return Response.json({ error: "name and dayDate required" }, { status: 400 });
    }
    const meal = ["breakfast", "lunch", "dinner", "snack"].includes(b.mealType)
      ? b.mealType
      : "snack";
    const log = await db.foodLog.create({
      data: {
        foodId: typeof b.foodId === "string" && b.foodId ? b.foodId : null,
        name: String(b.name).slice(0, 80),
        loggedAt: b.loggedAt ? new Date(b.loggedAt) : new Date(),
        dayDate: b.dayDate,
        mealType: meal,
        grams: Math.max(0, num(b.grams)),
        kcal: Math.max(0, num(b.kcal)),
        proteinG: Math.max(0, num(b.proteinG)),
        carbsG: Math.max(0, num(b.carbsG)),
        fatG: Math.max(0, num(b.fatG)),
        source: ["scan", "manual", "myfoods"].includes(b.source) ? b.source : "manual",
        kcal100: numOrNull(b.kcal100),
        protein100: numOrNull(b.protein100),
        carbs100: numOrNull(b.carbs100),
        fat100: numOrNull(b.fat100),
        imageUrl: imgOk(b.imageUrl) ? b.imageUrl : null,
      },
    });
    return Response.json(
      { ...log, loggedAt: log.loggedAt.toISOString() },
      { status: 201 }
    );
  } catch (e) {
    console.error("food-logs POST", e);
    return Response.json({ error: "invalid payload" }, { status: 400 });
  }
}
