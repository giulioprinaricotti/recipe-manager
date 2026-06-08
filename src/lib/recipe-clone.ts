import type { Prisma } from "@/generated/prisma";

type PrismaTx = Prisma.TransactionClient;

/**
 * Deep-clone a recipe (including ingredients and instructions) into another
 * user's collection. Used by the invite flow: the recipient gets an
 * independent copy, so the owner's later edits do not propagate.
 *
 * Must run inside a Prisma transaction so the clone is atomic with whatever
 * invitation/favourite bookkeeping the caller is also doing.
 */
export async function cloneRecipeForUser(
  tx: PrismaTx,
  sourceRecipeId: string,
  targetUserId: string
): Promise<string | null> {
  const source = await tx.recipe.findUnique({
    where: { id: sourceRecipeId },
    include: { ingredients: true, instructions: true },
  });
  if (!source) return null;

  const created = await tx.recipe.create({
    data: {
      userId: targetUserId,
      title: source.title,
      description: source.description,
      sourceUrl: source.sourceUrl,
      imageUrl: source.imageUrl,
      imageAttribution: source.imageAttribution,
      servings: source.servings,
      prepTime: source.prepTime,
      cookTime: source.cookTime,
      tags: source.tags,
      clonedFromId: source.id,
      ingredients: {
        create: source.ingredients.map((ing) => ({
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          order: ing.order,
          optional: ing.optional,
          alternativeGroupId: ing.alternativeGroupId,
        })),
      },
      instructions: {
        create: source.instructions.map((step) => ({
          stepNumber: step.stepNumber,
          description: step.description,
        })),
      },
    },
    select: { id: true },
  });

  return created.id;
}
