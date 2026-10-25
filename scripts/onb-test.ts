/** Test helper: snapshot + toggle onboarding flag / restore (item 3 testing) */
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  const cmd = process.argv[2];
  if (cmd === "set-null") {
    await db.profile.update({ where: { id: 1 }, data: { onboardingCompleted: null } });
    console.log("onboardingCompleted = null");
  } else if (cmd === "restore") {
    await db.profile.update({ where: { id: 1 }, data: { onboardingCompleted: true } });
    console.log("onboardingCompleted = true");
  } else if (cmd === "show") {
    const p = await db.profile.findUnique({ where: { id: 1 } });
    console.log(JSON.stringify(p, null, 1));
  }
  await db.$disconnect();
}
main();
