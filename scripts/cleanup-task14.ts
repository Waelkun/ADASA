/** cleanup: remove test entries/foods created during Task-14 verification, restore salmon to seed values */
import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
  // 1) delete test food-log entries
  const del = await p.foodLog.deleteMany({
    where: { OR: [{ name: "شريحة كيك تجربة" }, { name: "Chocolate Protein Bar" }] },
  });
  console.log("deleted test logs:", del.count);

  // 2) delete test foods (created via manual entry / demo scans)
  const delFoods = await p.food.deleteMany({
    where: { OR: [{ name: "شريحة كيك تجربة" }, { name: "Chocolate Protein Bar" }] },
  });
  console.log("deleted test foods:", delFoods.count);

  // 3) restore salmon entry (Oct 22) to seed values: 180g, per-100g from seed
  const salmon = await p.foodLog.findFirst({ where: { name: "سلمون مشوي" } });
  if (salmon) {
    await p.foodLog.update({
      where: { id: salmon.id },
      data: {
        grams: 180,
        kcal: Math.round((208 * 180) / 100), // 374
        proteinG: Math.round((20 * 180) / 100 * 10) / 10, // 36
        carbsG: 0,
        fatG: Math.round((13 * 180) / 100 * 10) / 10, // 23.4
        kcal100: 208,
        protein100: 20,
        carbs100: 0,
        fat100: 13,
      },
    });
    console.log("salmon restored: 180g / 374 kcal (per-100g kept from seed)");
  } else {
    console.log("salmon entry not found");
  }

  const counts = {
    foods: await p.food.count(),
    logs: await p.foodLog.count(),
  };
  console.log("final counts:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
