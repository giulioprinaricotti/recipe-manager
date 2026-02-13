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
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    ...(recipe.description && { description: recipe.description }),
    ...(recipe.imageUrl && { image: recipe.imageUrl }),
    ...(recipe.servings && { recipeYield: String(recipe.servings) }),
    ...(recipe.prepTime && { prepTime: `PT${recipe.prepTime}M` }),
    ...(recipe.cookTime && { cookTime: `PT${recipe.cookTime}M` }),
    recipeIngredient: recipe.ingredients.map((ing) =>
      [ing.quantity, ing.unit, ing.name].filter(Boolean).join(" ")
    ),
    recipeInstructions: recipe.instructions.map((step) => ({
      "@type": "HowToStep",
      text: step.description,
    })),
  };

  const html = `<!DOCTYPE html>
<html>
<head>
<script type="application/ld+json">
${JSON.stringify(jsonLd)}
</script>
</head>
<body></body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
