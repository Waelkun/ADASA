/**
 * Nutra seed script — idempotent, run with: bun scripts/seed.ts
 * Seeds: profile, weight history (45d), water (7d), workouts (30d), my foods, today's food logs
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const DAY = 86400000;
const now = new Date();
const d = (offsetDays: number, h = 12, m = 0) => {
  const x = new Date(now.getTime() - offsetDays * DAY);
  x.setHours(h, m, 0, 0);
  return x;
};
const iso = (dt: Date) => {
  const y = dt.getFullYear();
  const mo = String(dt.getMonth() + 1).padStart(2, "0");
  const da = String(dt.getDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
};

// deterministic pseudo-random for stable-looking data
let seedState = 42;
const rnd = () => {
  seedState = (seedState * 1103515245 + 12345) % 2147483648;
  return seedState / 2147483648;
};

async function main() {
  // ---- profile ----
  await db.profile.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      displayName: "أحمد",
      sex: "male",
      birthYear: 1995,
      heightCm: 176,
      activityLevel: "moderate",
      goalType: "lose",
      kcalGoal: 2100,
      proteinG: 160,
      carbsG: 190,
      fatG: 70,
      waterGoalMl: 2800,
      goalWeightKg: 78,
      workoutsPerWeek: 4,
      units: "metric",
    },
  });

  // ---- weight logs: 45 days, 82.9 -> ~81.2 with noise ----
  const existingWeights = await db.weightLog.count();
  if (existingWeights === 0) {
    const rows: { date: string; weightKg: number; note?: string }[] = [];
    for (let i = 45; i >= 0; i--) {
      const t = (45 - i) / 45; // 0..1
      const base = 82.9 - t * 1.7; // gradual loss
      const noise = (rnd() - 0.5) * 0.5;
      const w = Math.round((base + noise) * 10) / 10;
      rows.push({ date: iso(d(i)), weightKg: w });
    }
    await db.weightLog.createMany({ data: rows });
  }

  // ---- water logs: last 7 days ----
  if ((await db.waterLog.count()) === 0) {
    const rows: { loggedAt: Date; amountMl: number; dayDate: string }[] = [];
    for (let i = 7; i >= 0; i--) {
      const dayTarget = 2200 + Math.floor(rnd() * 900);
      let acc = 0;
      const hours = [8, 11, 14, 17, 20];
      for (const h of hours) {
        if (acc >= dayTarget) break;
        const amt = [250, 300, 500, 750][Math.floor(rnd() * 4)];
        acc += amt;
        const ts = d(i, h, Math.floor(rnd() * 50));
        rows.push({ loggedAt: ts, amountMl: amt, dayDate: iso(ts) });
      }
    }
    await db.waterLog.createMany({ data: rows });
  }

  // ---- workouts: past 30 days, Push/Pull/Legs pattern ----
  if ((await db.workout.count()) === 0) {
    const presets: { groups: string[]; dur: number }[] = [
      { groups: ["chest", "shoulders", "other"], dur: 65 },
      { groups: ["back", "other"], dur: 70 },
      { groups: ["legs"], dur: 75 },
      { groups: ["arms", "abs"], dur: 50 },
      { groups: ["cardio"], dur: 40 },
    ];
    let k = 0;
    for (let i = 30; i >= 0; i--) {
      const dt = d(i);
      const dow = dt.getDay(); // 0=Sun
      // train ~4x/week: Sat, Mon, Wed, Thu pattern-ish
      if ([1, 3, 4, 6].includes(dow) && rnd() > 0.15) {
        const p = presets[k % presets.length];
        k++;
        await db.workout.create({
          data: {
            date: iso(dt),
            muscleGroups: JSON.stringify(p.groups),
            durationMin: p.dur,
            note: null,
          },
        });
      }
    }
  }

  // ---- my foods ----
  if ((await db.food.count()) === 0) {
    const foods = [
      { name: "صدور دجاج مشوية", brand: null, servingSizeG: 150, kcal100: 165, protein100: 31, carbs100: 0, sugar100: 0, fat100: 3.6, satFat100: 1, fiber100: 0, salt100: 0.15, isFavorite: true },
      { name: "أرز أبيض مطبوخ", brand: null, servingSizeG: 200, kcal100: 130, protein100: 2.7, carbs100: 28, sugar100: 0.1, fat100: 0.3, satFat100: 0.1, fiber100: 0.4, salt100: 0.01, isFavorite: true },
      { name: "بيض مسلوق", brand: null, servingSizeG: 100, kcal100: 155, protein100: 13, carbs100: 1.1, sugar100: 1.1, fat100: 11, satFat100: 3.3, fiber100: 0, salt100: 0.5, isFavorite: true },
      { name: "زبادي يوناني", brand: "نادك", servingSizeG: 170, kcal100: 97, protein100: 9, carbs100: 3.9, sugar100: 3.9, fat100: 5, satFat100: 3.3, fiber100: 0, salt100: 0.1, isFavorite: true },
      { name: "شوفان", brand: "كويكر", servingSizeG: 40, kcal100: 389, protein100: 16.9, carbs100: 66.3, sugar100: 1, fat100: 6.9, satFat100: 1.2, fiber100: 10.6, salt100: 0.02, isFavorite: false },
      { name: "موز", brand: null, servingSizeG: 120, kcal100: 89, protein100: 1.1, carbs100: 22.8, sugar100: 12.2, fat100: 0.3, satFat100: 0.1, fiber100: 2.6, salt100: 0, isFavorite: false },
      { name: "تفاح", brand: null, servingSizeG: 180, kcal100: 52, protein100: 0.3, carbs100: 13.8, sugar100: 10.4, fat100: 0.2, satFat100: 0, fiber100: 2.4, salt100: 0, isFavorite: false },
      { name: "خبز عربي", brand: null, servingSizeG: 90, kcal100: 250, protein100: 8, carbs100: 50, sugar100: 1, fat100: 1.5, satFat100: 0.3, fiber100: 2.5, salt100: 1.2, isFavorite: false },
      { name: "زيت زيتون", brand: null, servingSizeG: 15, kcal100: 884, protein100: 0, carbs100: 0, sugar100: 0, fat100: 100, satFat100: 14, fiber100: 0, salt100: 0, isFavorite: false },
      { name: "لبن/حليب ١٪", brand: "المراعي", servingSizeG: 250, kcal100: 42, protein100: 3.4, carbs100: 5, sugar100: 5, fat100: 1, satFat100: 0.6, fiber100: 0, salt100: 0.09, isFavorite: false },
      { name: "سلمون مشوي", brand: null, servingSizeG: 180, kcal100: 208, protein100: 20, carbs100: 0, sugar100: 0, fat100: 13, satFat100: 3.1, fiber100: 0, salt100: 0.2, isFavorite: true },
      { name: "بطاطا حلوة مشوية", brand: null, servingSizeG: 200, kcal100: 90, protein100: 2, carbs100: 20.7, sugar100: 6.5, fat100: 0.2, satFat100: 0.1, fiber100: 3.3, salt100: 0.1, isFavorite: false },
      { name: "فول مدمس", brand: null, servingSizeG: 200, kcal100: 110, protein100: 7.6, carbs100: 19.6, sugar100: 0.6, fat100: 0.5, satFat100: 0.1, fiber100: 5.4, salt100: 0.3, isFavorite: false },
      { name: "طحينة", brand: null, servingSizeG: 30, kcal100: 595, protein100: 17, carbs100: 21, sugar100: 0.5, fat100: 53.8, satFat100: 7.5, fiber100: 9.3, salt100: 0.4, isFavorite: false },
      { name: "جبنة قريش", brand: null, servingSizeG: 100, kcal100: 98, protein100: 11, carbs100: 3.4, sugar100: 3.4, fat100: 4.3, satFat100: 2.7, fiber100: 0, salt100: 0.9, isFavorite: false },
    ];
    await db.food.createMany({ data: foods });
  }

  // ---- today's food logs (only if none) ----
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayCount = await db.foodLog.count({ where: { loggedAt: { gte: todayStart } } });
  if (todayCount === 0) {
    const chicken = await db.food.findFirst({ where: { name: { contains: "دجاج" } } });
    const rice = await db.food.findFirst({ where: { name: { contains: "أرز" } } });
    const eggs = await db.food.findFirst({ where: { name: { contains: "بيض" } } });
    const oats = await db.food.findFirst({ where: { name: { contains: "شوفان" } } });
    const yogurt = await db.food.findFirst({ where: { name: { contains: "زبادي" } } });
    const banana = await db.food.findFirst({ where: { name: { contains: "موز" } } });

    const mk = (
      f: { id: string } | null,
      name: string,
      grams: number,
      kcal100: number,
      p: number,
      c: number,
      fat: number,
      meal: string,
      h: number,
      mi: number
    ) => {
      const ts = d(0, h, mi);
      return {
        foodId: f?.id ?? null,
        name,
        loggedAt: ts,
        dayDate: iso(ts),
        mealType: meal,
        grams,
        kcal: Math.round((kcal100 * grams) / 100),
        proteinG: Math.round(((p * grams) / 100) * 10) / 10,
        carbsG: Math.round(((c * grams) / 100) * 10) / 10,
        fatG: Math.round(((fat * grams) / 100) * 10) / 10,
        source: "myfoods",
      };
    };

    await db.foodLog.createMany({
      data: [
        mk(eggs, "بيض مسلوق", 120, 155, 13, 1.1, 11, "breakfast", 8, 5),
        mk(oats, "شوفان", 50, 389, 16.9, 66.3, 6.9, "breakfast", 8, 10),
        mk(banana, "موز", 120, 89, 1.1, 22.8, 0.3, "breakfast", 8, 15),
        mk(chicken, "صدور دجاج مشوية", 180, 165, 31, 0, 3.6, "lunch", 13, 30),
        mk(rice, "أرز أبيض مطبوخ", 200, 130, 2.7, 28, 0.3, "lunch", 13, 35),
        mk(yogurt, "زبادي يوناني", 170, 97, 9, 3.9, 5, "snack", 17, 0),
      ],
    });
  }

  const counts = {
    foods: await db.food.count(),
    foodLogs: await db.foodLog.count(),
    weights: await db.weightLog.count(),
    water: await db.waterLog.count(),
    workouts: await db.workout.count(),
  };
  console.log("Seed complete:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
