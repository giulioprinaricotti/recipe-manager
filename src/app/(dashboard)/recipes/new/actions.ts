"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseIngredient } from "@/lib/ingredient-parser";
import { scrapeRecipe, type ScrapedRecipe } from "@/lib/recipe-scraper";
import { UnsafeUrlError } from "@/lib/safe-fetch";
import { fetchInstagramCaption, isInstagramPostUrl } from "@/lib/instagram-caption";
import { consumeTextImportQuota } from "@/lib/import-usage";
import {
  extractRecipeFromText,
  isTextImportEnabled,
  MAX_RECIPE_TEXT_LENGTH,
  type ExtractedRecipe,
  type ExtractionFailure,
} from "@/lib/recipe-text-extractor";
import { getTag, type TagSlug } from "@/lib/tags";
import type { EditedRecipePayload } from "./types";

/** A draft from a link: recipe sites give no tags, Instagram captions may. */
export type ImportedRecipe = ScrapedRecipe & { tags?: TagSlug[] };

const INSTAGRAM_NO_RECIPE =
  "The caption of this post has no recipe. It may be in the images or only spoken in the video.";
const INSTAGRAM_UNREADABLE =
  "Could not read this Instagram post. Open it in Instagram, copy the caption and share or paste the text instead.";

export async function scrapeRecipeAction(
  url: string
): Promise<{ data: ImportedRecipe } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  try {
    const normalizedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    if (isInstagramPostUrl(normalizedUrl)) {
      return await importInstagramPost(session.user.id, normalizedUrl);
    }
    const data = await scrapeRecipe(normalizedUrl);
    if (!data) {
      return { error: "No recipe data found at this URL. The site may not use structured recipe markup." };
    }
    return { data };
  } catch (err) {
    if (err instanceof UnsafeUrlError) return { error: err.message };
    if (err instanceof Error && err.name === "TimeoutError") {
      return { error: "The site took too long to respond." };
    }
    const message = err instanceof Error ? err.message : "Failed to fetch URL";
    return { error: message };
  }
}

const TEXT_IMPORT_ERRORS: Record<ExtractionFailure, string> = {
  empty: "Paste some text first.",
  too_long: `That text is too long. The limit is ${MAX_RECIPE_TEXT_LENGTH} characters.`,
  no_recipe:
    "No recipe found in this text. It needs at least some ingredients or steps.",
  invalid_response: "Could not read a recipe from this text. Try again.",
  unavailable: "Text import is not available right now. Try again later.",
};

/**
 * An Instagram post has no recipe markup: its caption goes through the same
 * paid extraction, and the same daily allowance, as pasted text. The caption
 * is fetched first so a post we cannot read costs nothing.
 */
async function importInstagramPost(
  userId: string,
  url: string
): Promise<{ data: ImportedRecipe } | { error: string }> {
  if (!isTextImportEnabled()) return { error: INSTAGRAM_UNREADABLE };

  const fetched = await fetchInstagramCaption(url);
  if (!fetched.ok) return { error: INSTAGRAM_UNREADABLE };

  const result = await extractWithQuota(userId, fetched.caption);
  if ("error" in result) {
    return result.error === TEXT_IMPORT_ERRORS.no_recipe
      ? { error: INSTAGRAM_NO_RECIPE }
      : result;
  }
  return { data: { ...result.data, sourceUrl: fetched.postUrl } };
}

export async function extractRecipeFromTextAction(
  text: string
): Promise<{ data: ExtractedRecipe } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }
  return extractWithQuota(session.user.id, text);
}

async function extractWithQuota(
  userId: string,
  text: string
): Promise<{ data: ExtractedRecipe } | { error: string }> {
  if (!isTextImportEnabled()) {
    return { error: TEXT_IMPORT_ERRORS.unavailable };
  }

  // Checked here as well so an empty or oversized text never spends quota.
  const trimmed = typeof text === "string" ? text.trim() : "";
  if (!trimmed) return { error: TEXT_IMPORT_ERRORS.empty };
  if (trimmed.length > MAX_RECIPE_TEXT_LENGTH) {
    return { error: TEXT_IMPORT_ERRORS.too_long };
  }

  let allowed: boolean;
  try {
    allowed = await consumeTextImportQuota(userId);
  } catch (err) {
    // Without a working counter the paid call stays closed.
    console.error("Text import quota check failed", err);
    return { error: TEXT_IMPORT_ERRORS.unavailable };
  }
  if (!allowed) {
    return { error: "Daily limit for text imports reached. Try again tomorrow." };
  }

  const result = await extractRecipeFromText(trimmed);
  if (!result.ok) return { error: TEXT_IMPORT_ERRORS[result.reason] };
  return { data: result.recipe };
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
          return { name, quantity, unit, order: i, optional: false, alternativeGroupId: null };
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
      imageAttribution: recipe.imageAttribution,
      servings: recipe.servings,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      tags: (recipe.tags ?? []).filter((slug) => getTag(slug)),
      ingredients: {
        create: recipe.ingredients.map((ing, i) => ({
          name: ing.name.trim(),
          quantity: ing.quantity.trim() || null,
          unit: ing.unit.trim() || null,
          order: i,
          optional: ing.optional,
          alternativeGroupId: ing.alternativeGroupId,
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
