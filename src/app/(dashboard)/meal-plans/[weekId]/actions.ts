"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fromWeekId } from "@/lib/weeks";

export async function addRecipeToMealPlan(
  weekId: string,
  recipeId: string
): Promise<{ success: true } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const weekStart = fromWeekId(weekId);

  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId, userId: session.user.id },
    select: { id: true },
  });
  if (!recipe) {
    return { error: "Recipe not found" };
  }

  const mealPlan = await prisma.mealPlan.upsert({
    where: {
      userId_weekStart: { userId: session.user.id, weekStart },
    },
    create: { userId: session.user.id, weekStart },
    update: {},
  });

  const lastItem = await prisma.mealPlanItem.findFirst({
    where: { mealPlanId: mealPlan.id },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  try {
    await prisma.mealPlanItem.create({
      data: {
        mealPlanId: mealPlan.id,
        recipeId,
        order: (lastItem?.order ?? -1) + 1,
      },
    });
  } catch {
    return { error: "Recipe already in this week's plan" };
  }

  revalidatePath(`/meal-plans/${weekId}`);
  revalidatePath("/meal-plans");

  return { success: true };
}

export async function removeRecipeFromMealPlan(
  weekId: string,
  recipeId: string
): Promise<{ success: true } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const weekStart = fromWeekId(weekId);

  const mealPlan = await prisma.mealPlan.findUnique({
    where: {
      userId_weekStart: { userId: session.user.id, weekStart },
    },
    select: { id: true },
  });
  if (!mealPlan) {
    return { error: "Meal plan not found" };
  }

  await prisma.mealPlanItem.deleteMany({
    where: { mealPlanId: mealPlan.id, recipeId },
  });

  revalidatePath(`/meal-plans/${weekId}`);
  revalidatePath("/meal-plans");

  return { success: true };
}

export async function getRecipesForPicker(
  weekId: string,
  search?: string
): Promise<{
  recipes: Array<{
    id: string;
    title: string;
    imageUrl: string | null;
    tags: string[];
    alreadyAdded: boolean;
  }>;
}> {
  const session = await auth();
  if (!session?.user?.id) return { recipes: [] };

  const weekStart = fromWeekId(weekId);

  const [recipes, mealPlan] = await Promise.all([
    prisma.recipe.findMany({
      where: {
        userId: session.user.id,
        ...(search
          ? { title: { contains: search, mode: "insensitive" as const } }
          : {}),
      },
      select: { id: true, title: true, imageUrl: true, tags: true },
      orderBy: { title: "asc" },
    }),
    prisma.mealPlan.findUnique({
      where: {
        userId_weekStart: { userId: session.user.id, weekStart },
      },
      select: { items: { select: { recipeId: true } } },
    }),
  ]);

  const addedIds = new Set(mealPlan?.items.map((i) => i.recipeId) ?? []);

  return {
    recipes: recipes.map((r) => ({
      ...r,
      alreadyAdded: addedIds.has(r.id),
    })),
  };
}
