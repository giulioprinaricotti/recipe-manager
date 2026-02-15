"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RECIPE_TAGS, type TagSlug } from "@/lib/tags";
import type { RecipeContentData } from "../new/types";

const VALID_SLUGS = new Set<string>(RECIPE_TAGS.map((t) => t.slug));

export async function updateRecipeTags(
  recipeId: string,
  tags: string[]
): Promise<{ success: true } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const sanitised = tags.filter((t): t is TagSlug => VALID_SLUGS.has(t));

  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId, userId: session.user.id },
    select: { id: true },
  });

  if (!recipe) {
    return { error: "Recipe not found" };
  }

  await prisma.recipe.update({
    where: { id: recipeId },
    data: { tags: sanitised },
  });

  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath("/recipes");

  return { success: true };
}

export async function updateRecipeContent(
  recipeId: string,
  data: RecipeContentData
): Promise<{ error: string } | void> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId, userId: session.user.id },
    select: { id: true },
  });

  if (!recipe) {
    return { error: "Recipe not found" };
  }

  await prisma.$transaction([
    prisma.ingredient.deleteMany({ where: { recipeId } }),
    prisma.instruction.deleteMany({ where: { recipeId } }),
    ...data.ingredients.map((ing, i) =>
      prisma.ingredient.create({
        data: {
          recipeId,
          name: ing.name.trim(),
          quantity: ing.quantity.trim() || null,
          unit: ing.unit.trim() || null,
          order: i,
        },
      })
    ),
    ...data.instructions.map((step, i) =>
      prisma.instruction.create({
        data: {
          recipeId,
          stepNumber: i + 1,
          description: step.description,
        },
      })
    ),
  ]);

  revalidatePath(`/recipes/${recipeId}`);

  return undefined;
}
