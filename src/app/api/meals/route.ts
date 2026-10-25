import { NextRequest } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/meals — saved meals ("وجباتي"), newest first
 * POST /api/meals — save a meal snapshot {name, items[]}
 */
export async function GET() {
  const meals = await db.savedMeal.findMany({ orderBy: { createdAt: "desc" } });
  return Response.json(
    meals.map((m) => ({ id: m.id, name: m.name, items: JSON.parse(m.items), createdAt: m.createdAt.toISOString() }))
  );
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const name = typeof b?.name === "string" && b.name.trim() ? b.name.trim().slice(0, 60) : "";
    if (!name) return Response.json({ error: "name required" }, { status: 400 });
    if (!Array.isArray(b?.items) || b.items.length === 0 || b.items.length > 50) {
      return Response.json({ error: "items required (1-50)" }, { status: 400 });
    }
    const num = (v: unknown) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 ? n : 0;
    };
    const numOrNull = (v: unknown) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 ? n : null;
    };
    const imgOk = (v: unknown): v is string =>
      typeof v === "string" && v.startsWith("data:image/") && v.length < 400_000;
    const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

    // snapshot each item exactly as logged (grams + totals + per-100g + thumb)
    const items = b.items.map((it: Record<string, unknown>) => ({
      foodId: typeof it?.foodId === "string" && it.foodId ? it.foodId : null,
      name: str(it?.name, 80) || "—",
      grams: num(it?.grams),
      kcal: num(it?.kcal),
      proteinG: num(it?.proteinG),
      carbsG: num(it?.carbsG),
      fatG: num(it?.fatG),
      kcal100: numOrNull(it?.kcal100),
      protein100: numOrNull(it?.protein100),
      carbs100: numOrNull(it?.carbs100),
      fat100: numOrNull(it?.fat100),
      imageUrl: imgOk(it?.imageUrl) ? it.imageUrl : null,
    }));
    const meal = await db.savedMeal.create({
      data: { name, items: JSON.stringify(items) },
    });
    return Response.json(
      { id: meal.id, name: meal.name, items, createdAt: meal.createdAt.toISOString() },
      { status: 201 }
    );
  } catch (e) {
    console.error("meals POST", e);
    return Response.json({ error: "invalid payload" }, { status: 400 });
  }
}
