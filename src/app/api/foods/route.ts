import { NextRequest } from "next/server";
import { db } from "@/lib/db";

/** GET /api/foods?q=&fav=1 — search my foods */
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  const fav = req.nextUrl.searchParams.get("fav") === "1";

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [{ name: { contains: q } }, { brand: { contains: q } }];
  }
  if (fav) where.isFavorite = true;

  const foods = await db.food.findMany({
    where,
    orderBy: [{ isFavorite: "desc" }, { name: "asc" }],
    take: 60,
  });
  return Response.json(foods);
}

/** POST /api/foods — create a food (after scan or manual) */
export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const num = (v: unknown, d = 0) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 ? n : d;
    };
    if (!b?.name || typeof b.name !== "string" || !b.name.trim()) {
      return Response.json({ error: "name required" }, { status: 400 });
    }
    const food = await db.food.create({
      data: {
        name: b.name.trim().slice(0, 80),
        brand: typeof b.brand === "string" && b.brand.trim() ? b.brand.trim().slice(0, 60) : null,
        servingSizeG: b.servingSizeG != null ? num(b.servingSizeG) : null,
        kcal100: num(b.kcal100),
        protein100: num(b.protein100),
        carbs100: num(b.carbs100),
        sugar100: b.sugar100 != null ? num(b.sugar100) : null,
        fat100: num(b.fat100),
        satFat100: b.satFat100 != null ? num(b.satFat100) : null,
        fiber100: b.fiber100 != null ? num(b.fiber100) : null,
        salt100: b.salt100 != null ? num(b.salt100) : null,
        isFavorite: !!b.isFavorite,
      },
    });
    return Response.json(food, { status: 201 });
  } catch (e) {
    console.error("foods POST", e);
    return Response.json({ error: "invalid payload" }, { status: 400 });
  }
}
