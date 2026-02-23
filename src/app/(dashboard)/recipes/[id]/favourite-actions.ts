"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function toggleFavourite(
  recipeId: string,
  currentlyFavourited: boolean
) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const userId = session.user.id;

  // Prevent favouriting own recipes
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: { userId: true },
  });
  if (!recipe) throw new Error("Recipe not found");
  if (recipe.userId === userId) return;

  if (currentlyFavourited) {
    await prisma.favourite.delete({
      where: { userId_recipeId: { userId, recipeId } },
    });
  } else {
    await prisma.favourite.create({
      data: { userId, recipeId },
    });
  }

  revalidatePath("/recipes");
}
