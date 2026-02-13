"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RECIPE_TAGS, type TagSlug } from "@/lib/tags";

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
