"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scrapeRecipe, type ScrapedRecipe } from "@/lib/recipe-scraper";

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
        create: recipe.ingredients.map((name, i) => ({
          name,
          order: i,
        })),
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
