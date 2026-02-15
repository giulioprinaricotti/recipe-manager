"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseIngredient } from "@/lib/ingredient-parser";
import { scrapeRecipe, type ScrapedRecipe } from "@/lib/recipe-scraper";
import type { EditedRecipePayload } from "./types";

export async function scrapeRecipeAction(
  url: string
): Promise<{ data: ScrapedRecipe } | { error: string }> {
  try {
    const data = await scrapeRecipe(url);
    if (!data) {
      return { error: "No recipe data found at this URL. The site may not use structured recipe markup." };
    }
    return { data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch URL";
    return { error: message };
  }
}

export async function saveScrapedRecipe(
  recipe: ScrapedRecipe
): Promise<{ id: string } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const created = await prisma.recipe.create({
    data: {
      userId: session.user.id,
      title: recipe.title,
      description: recipe.description,
      sourceUrl: recipe.sourceUrl,
      imageUrl: recipe.imageUrl,
      servings: recipe.servings,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      ingredients: {
        create: recipe.ingredients.map((raw, i) => {
          const { name, quantity, unit } = parseIngredient(raw);
          return { name, quantity, unit, order: i };
        }),
      },
      instructions: {
        create: recipe.instructions.map((description, i) => ({
          stepNumber: i + 1,
          description,
        })),
      },
    },
  });

  return { id: created.id };
}

export async function searchIngredientNames(
  query: string
): Promise<string[]> {
  const session = await auth();
  if (!session?.user?.id) return [];
  if (query.length < 3) return [];

  const results = await prisma.ingredient.findMany({
    where: {
      recipe: { userId: session.user.id },
      name: { contains: query, mode: "insensitive" },
    },
    select: { name: true },
    distinct: ["name"],
    orderBy: { name: "asc" },
    take: 10,
  });

  return results.map((r) => r.name);
}

export async function saveEditedRecipe(
  recipe: EditedRecipePayload
): Promise<{ id: string } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  if (!recipe.title.trim()) {
    return { error: "Recipe title is required" };
  }

  const created = await prisma.recipe.create({
    data: {
      userId: session.user.id,
      title: recipe.title,
      description: recipe.description,
      sourceUrl: recipe.sourceUrl,
      imageUrl: recipe.imageUrl,
      servings: recipe.servings,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      ingredients: {
        create: recipe.ingredients.map((ing, i) => ({
          name: ing.name.trim(),
          quantity: ing.quantity.trim() || null,
          unit: ing.unit.trim() || null,
          order: i,
        })),
      },
      instructions: {
        create: recipe.instructions.map((step, i) => ({
          stepNumber: i + 1,
          description: step.description,
        })),
      },
    },
  });

  return { id: created.id };
}
