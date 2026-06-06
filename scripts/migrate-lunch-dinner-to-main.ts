/**
 * Migrate Recipe.tags: collapse "lunch" + "dinner" -> "main".
 *
 * One-shot, idempotent: re-running after success is a no-op because
 * no rows match the WHERE filter anymore. Safe to ship + run.
 *
 * Usage:
 *   npx tsx scripts/migrate-lunch-dinner-to-main.ts
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";

const FROM_SLUGS = ["lunch", "dinner"] as const;
const TO_SLUG = "main";

async function main() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });
  const prisma = new PrismaClient({ adapter });

  const candidates = await prisma.recipe.findMany({
    where: { tags: { hasSome: [...FROM_SLUGS] } },
    select: { id: true, title: true, tags: true },
  });

  if (candidates.length === 0) {
    console.log("Nothing to migrate. All recipes already clean.");
    await prisma.$disconnect();
    return;
  }

  console.log(`Found ${candidates.length} recipe(s) to migrate.`);

  let updated = 0;
  for (const r of candidates) {
    const replaced = r.tags.map((t: string) =>
      (FROM_SLUGS as readonly string[]).includes(t) ? TO_SLUG : t
    );
    // Dedupe (handles recipes tagged with both "lunch" AND "dinner")
    const deduped = Array.from(new Set(replaced));

    await prisma.recipe.update({
      where: { id: r.id },
      data: { tags: deduped },
    });
    updated++;
    console.log(
      `  ${r.id}  ${r.title}  [${r.tags.join(",")}] -> [${deduped.join(",")}]`
    );
  }

  console.log(`\nDone. ${updated} recipe(s) updated.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
