/** Restore the pre-test profile state (item-3 test cleanup) */
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  // restore original profile values (displayName أحمد / lose) — the flag
  // onboardingCompleted stays true (its pre-test value)
  await db.profile.update({
    where: { id: 1 },
    data: { displayName: "أحمد", goalType: "lose" },
  });
  // remove the weight entry created by the onboarding test (today, 82.5)
  await db.weightLog.deleteMany({ where: { date: "2026-10-25", weightKg: 82.5 } });
  const p = await db.profile.findUnique({ where: { id: 1 } });
  const w = await db.weightLog.findMany({ where: { date: "2026-10-25" } });
  console.log("restored:", JSON.stringify({ displayName: p?.displayName, goalType: p?.goalType, onboardingCompleted: p?.onboardingCompleted, kcalGoal: p?.kcalGoal, weightsToday: w.length }));
  await db.$disconnect();
}
main();
