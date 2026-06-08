import { prisma } from "@/lib/prisma";

/**
 * Recipes are private to their owner. Legacy Favourite rows (from when
 * recipes were globally visible) keep granting read-only access until the
 * owner removes them — no new cross-user Favourites can be created.
 */
export async function canViewRecipe(
  recipeId: string,
  userId: string
): Promise<{ allowed: boolean; isOwn: boolean; isLegacyShared: boolean }> {
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: { userId: true },
  });
  if (!recipe) return { allowed: false, isOwn: false, isLegacyShared: false };

  if (recipe.userId === userId) {
    return { allowed: true, isOwn: true, isLegacyShared: false };
  }

  const fav = await prisma.favourite.findUnique({
    where: { userId_recipeId: { userId, recipeId } },
    select: { userId: true },
  });
  return {
    allowed: !!fav,
    isOwn: false,
    isLegacyShared: !!fav,
  };
}
