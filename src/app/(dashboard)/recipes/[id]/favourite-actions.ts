"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Remove a legacy cross-user Favourite (grants pre-dating private recipes).
 * No "add" action exists: new sharing goes through the invite/clone flow.
 */
export async function removeLegacyFavourite(recipeId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const userId = session.user.id;

  await prisma.favourite
    .delete({ where: { userId_recipeId: { userId, recipeId } } })
    .catch(() => {
      /* already removed — no-op */
    });

  revalidatePath("/recipes");
}
