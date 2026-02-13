/**
 * Backfill existing ingredients with parsed quantity/unit.
 *
 * Reads all Ingredient rows where quantity IS NULL, parses the name field
 * (which currently contains the full raw string), and updates name/quantity/unit.
 *
 * Usage:
 *   npx tsx scripts/backfill-ingredient-parsing.ts
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { parseIngredient } from "../src/lib/ingredient-parser.js";

async function main() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });
  const prisma = new PrismaClient({ adapter });

  const BATCH = 100;
  let cursor: string | undefined;
  let total = 0;
  let updated = 0;

  while (true) {
    const rows = await prisma.ingredient.findMany({
      where: { quantity: null },
      take: BATCH,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: "asc" },
    });
    if (rows.length === 0) break;
    cursor = rows[rows.length - 1].id;
    total += rows.length;

    for (const row of rows) {
      const parsed = parseIngredient(row.name);
      if (parsed.quantity !== null || parsed.name !== row.name) {
        await prisma.ingredient.update({
          where: { id: row.id },
          data: {
            name: parsed.name,
            quantity: parsed.quantity,
            unit: parsed.unit,
          },
        });
        updated++;
      }
    }
    console.log(`Processed ${total} rows, updated ${updated}`);
  }

  console.log(`Done. Total: ${total}, updated: ${updated}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
