import * as cheerio from "cheerio";

export interface ScrapedRecipe {
  title: string;
  description?: string;
  imageUrl?: string;
  servings?: number;
  prepTime?: number;
  cookTime?: number;
  ingredients: string[];
  instructions: string[];
  sourceUrl: string;
}

function parseDuration(duration: string | undefined): number | undefined {
  if (!duration) return undefined;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return undefined;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  return hours * 60 + minutes || undefined;
}

export async function scrapeRecipe(
  url: string
): Promise<ScrapedRecipe | null> {
  const response = await fetch(url, {
    headers: { "User-Agent": "RecipeManager/1.0" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const jsonLdScripts = $('script[type="application/ld+json"]');

  for (let i = 0; i < jsonLdScripts.length; i++) {
    try {
      const content = $(jsonLdScripts[i]).html();
      if (!content) continue;

      const data = JSON.parse(content);
      const recipe = findRecipe(data);
      if (recipe) {
        return parseRecipeSchema(recipe, url);
      }
    } catch {
      continue;
    }
  }

  return null;
}

function findRecipe(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== "object") return null;

  const obj = data as Record<string, unknown>;

  if (obj["@type"] === "Recipe") return obj;

  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findRecipe(item);
      if (found) return found;
    }
  }

  if (Array.isArray(obj["@graph"])) {
    for (const item of obj["@graph"]) {
      const found = findRecipe(item);
      if (found) return found;
    }
  }

  return null;
}

function parseRecipeSchema(
  recipe: Record<string, unknown>,
  sourceUrl: string
): ScrapedRecipe {
  const rawIngredients = recipe.recipeIngredient;
  const ingredients = Array.isArray(rawIngredients)
    ? rawIngredients.map(String)
    : [];

  const rawInstructions = recipe.recipeInstructions;
  const instructions: string[] = [];
  if (Array.isArray(rawInstructions)) {
    for (const step of rawInstructions) {
      if (typeof step === "string") {
        instructions.push(step);
      } else if (typeof step === "object" && step !== null) {
        const s = step as Record<string, unknown>;
        if (s.text) instructions.push(String(s.text));
      }
    }
  }

  const yieldVal = recipe.recipeYield;
  let servings: number | undefined;
  if (typeof yieldVal === "number") {
    servings = yieldVal;
  } else if (typeof yieldVal === "string") {
    const match = yieldVal.match(/(\d+)/);
    servings = match ? parseInt(match[1], 10) : undefined;
  } else if (Array.isArray(yieldVal) && yieldVal.length > 0) {
    const match = String(yieldVal[0]).match(/(\d+)/);
    servings = match ? parseInt(match[1], 10) : undefined;
  }

  let imageUrl: string | undefined;
  if (typeof recipe.image === "string") {
    imageUrl = recipe.image;
  } else if (Array.isArray(recipe.image) && recipe.image.length > 0) {
    imageUrl =
      typeof recipe.image[0] === "string"
        ? recipe.image[0]
        : ((recipe.image[0] as Record<string, unknown>)?.url as string);
  } else if (typeof recipe.image === "object" && recipe.image !== null) {
    imageUrl = (recipe.image as Record<string, unknown>).url as string;
  }

  return {
    title: String(recipe.name || "Untitled Recipe"),
    description: recipe.description ? String(recipe.description) : undefined,
    imageUrl,
    servings,
    prepTime: parseDuration(recipe.prepTime as string | undefined),
    cookTime: parseDuration(recipe.cookTime as string | undefined),
    ingredients,
    instructions,
    sourceUrl,
  };
}
