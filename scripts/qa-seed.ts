/**
 * Seed a repeatable QA state into a LOCAL database. Called by scripts/qa-state.sh.
 *
 * Usage:
 *   npx tsx scripts/qa-seed.ts user   # QA user + three recipes
 *   npx tsx scripts/qa-seed.ts menu   # ...plus this week's menu with all three
 *
 * Idempotent: the QA user is deleted (cascade) and recreated on every run.
 * Refuses to run unless DATABASE_URL points at localhost / 127.0.0.1.
 */

import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { getWeekStart, toWeekId } from "../src/lib/weeks.js";

export const QA_EMAIL = "qa@dueforchette.test";
export const QA_PASSWORD = "qa-password-local";

const RECIPES = [
  {
    title: "Spaghetti al pomodoro",
    servings: 2,
    ingredients: [
      { name: "spaghetti", quantity: "200", unit: "g" },
      { name: "pomodoro", quantity: "400", unit: "g" },
      { name: "basilico", quantity: null, unit: null },
      { name: "olio extravergine", quantity: "2", unit: "tbsp" },
    ],
    steps: ["Cuoci la salsa.", "Cuoci la pasta e condisci."],
  },
  {
    title: "Shakshuka",
    servings: 2,
    ingredients: [
      { name: "tomato", quantity: "400", unit: "g" },
      { name: "uova", quantity: "4", unit: null },
      { name: "cipolla", quantity: "1", unit: null },
    ],
    steps: ["Soffriggi la cipolla.", "Aggiungi pomodoro e uova."],
  },
  {
    title: "Frittata di zucchine",
    servings: 2,
    ingredients: [
      { name: "uova", quantity: "4", unit: null },
      { name: "zucchine", quantity: "2", unit: null },
    ],
    steps: ["Sbatti le uova.", "Cuoci con le zucchine."],
  },
];

function assertLocalDatabase(url: string | undefined): string {
  if (!url) {
    console.error("refusing: DATABASE_URL is not set");
    process.exit(1);
  }
  const host = new URL(url).hostname;
  if (host !== "localhost" && host !== "127.0.0.1") {
    console.error("refusing: DATABASE_URL is not a local database");
    process.exit(1);
  }
  return url;
}

async function main() {
  const step = process.argv[2];
  if (step !== "user" && step !== "menu") {
    console.error("Usage: npx tsx scripts/qa-seed.ts user|menu");
    process.exit(2);
  }

  const url = assertLocalDatabase(process.env.DATABASE_URL);
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

  await prisma.user.deleteMany({ where: { email: QA_EMAIL } });
  const user = await prisma.user.create({
    data: {
      email: QA_EMAIL,
      name: "QA",
      passwordHash: await bcrypt.hash(QA_PASSWORD, 10),
    },
  });

  const recipes = [];
  for (const r of RECIPES) {
    recipes.push(
      await prisma.recipe.create({
        data: {
          userId: user.id,
          title: r.title,
          servings: r.servings,
          ingredients: { create: r.ingredients.map((i, order) => ({ ...i, order })) },
          instructions: {
            create: r.steps.map((description, i) => ({ stepNumber: i + 1, description })),
          },
        },
      })
    );
  }

  console.log(`user=${user.id} email=${QA_EMAIL} recipes=${recipes.length}`);

  if (step === "menu") {
    const weekStart = getWeekStart(new Date());
    await prisma.mealPlan.create({
      data: {
        userId: user.id,
        weekStart,
        items: { create: recipes.map((r, order) => ({ recipeId: r.id, order })) },
      },
    });
    console.log(`week=${toWeekId(weekStart)} items=${recipes.length}`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
