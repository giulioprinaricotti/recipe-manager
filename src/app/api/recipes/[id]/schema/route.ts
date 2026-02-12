import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      ingredients: { orderBy: { order: "asc" } },
      instructions: { orderBy: { stepNumber: "asc" } },
    },
  });

  if (!recipe) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const jsonLd = {
    "@context": "http://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    description: recipe.description ?? undefined,
    image: recipe.imageUrl ?? undefined,
    recipeYield: recipe.servings ? String(recipe.servings) : undefined,
    prepTime: recipe.prepTime ? `PT${recipe.prepTime}M` : undefined,
    cookTime: recipe.cookTime ? `PT${recipe.cookTime}M` : undefined,
    recipeIngredient: recipe.ingredients.map((ing) =>
      [ing.quantity, ing.unit, ing.name].filter(Boolean).join(" ")
    ),
    recipeInstructions: recipe.instructions.map((step) => ({
      "@type": "HowToStep",
      text: step.description,
    })),
  };

  return NextResponse.json(jsonLd, {
    headers: { "Content-Type": "application/ld+json" },
  });
}
