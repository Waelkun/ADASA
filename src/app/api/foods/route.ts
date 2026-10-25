import { NextRequest } from "next/server";
import { db } from "@/lib/db";

/** GET /api/foods?q=&fav=1&sort=usage — search my foods (sort=usage: most-used first, then newest) */
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  const fav = req.nextUrl.searchParams.get("fav") === "1";
  const usageSort = req.nextUrl.searchParams.get("sort") === "usage";

  if (usageSort) {
    // meal-builder list: full catalogue ordered by real usage (log count), newest first as tie-break
    const [foods, counts] = await Promise.all([
      db.food.findMany({ take: 300 }),
      db.foodLog.groupBy({
        by: ["foodId"],
        where: { foodId: { not: null } },
        _count: { _all: true },
      }),
    ]);
    const countMap = new Map(counts.map((c) => [c.foodId, c._count._all]));
    const filtered = q
      ? foods.filter(
          (f) =>
            f.name.toLowerCase().includes(q.toLowerCase()) ||
            (f.brand ?? "").toLowerCase().includes(q.toLowerCase())
        )
      : foods;
    filtered.sort(
      (a, b) =>
        (countMap.get(b.id) ?? 0) - (countMap.get(a.id) ?? 0) ||
        b.createdAt.getTime() - a.createdAt.getTime()
    );
    return Response.json(filtered);
  }

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
    // additive: compressed thumbnail (data URL)
    const imgOk = (v: unknown): v is string =>
      typeof v === "string" && v.startsWith("data:image/") && v.length < 400_000;
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
        imageUrl: imgOk(b.imageUrl) ? b.imageUrl : null,
        isFavorite: !!b.isFavorite,
      },
    });
    return Response.json(food, { status: 201 });
  } catch (e) {
    console.error("foods POST", e);
    return Response.json({ error: "invalid payload" }, { status: 400 });
  }
}
