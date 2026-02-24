"use server";

import crypto from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function createInvitation(recipeId?: string): Promise<{ token: string } | { error: string }> {
  const session = await auth();

  if (!session?.user) {
    return { error: "Not authenticated" };
  }

  if (!session.user.isAdmin) {
    return { error: "Not authorized" };
  }

  if (recipeId) {
    const recipe = await prisma.recipe.findFirst({
      where: { id: recipeId, userId: session.user.id },
    });
    if (!recipe) {
      return { error: "Recipe not found" };
    }
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.invitation.create({
    data: {
      token,
      inviterId: session.user.id,
      recipeId: recipeId ?? null,
      expiresAt,
    },
  });

  return { token };
}

export async function getUserRecipes(): Promise<{ id: string; title: string }[]> {
  const session = await auth();

  if (!session?.user) {
    return [];
  }

  const recipes = await prisma.recipe.findMany({
    where: { userId: session.user.id },
    select: { id: true, title: true },
    orderBy: { title: "asc" },
  });

  return recipes;
}
