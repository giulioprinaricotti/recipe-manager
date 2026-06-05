import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fromWeekId, formatWeekLabel } from "@/lib/weeks";
import { formatIngredientLines } from "@/lib/ingredient-utils";
import { aggregateIngredients } from "@/lib/ingredient-aggregator";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ weekId: string }> }
) {
  const { weekId } = await params;
  const userId = req.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const weekStart = fromWeekId(weekId);

  const mealPlan = await prisma.mealPlan.findUnique({
    where: {
      userId_weekStart: { userId, weekStart },
    },
    include: {
      items: {
        include: {
          recipe: {
            include: {
              ingredients: { orderBy: { order: "asc" } },
            },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!mealPlan) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Flatten ingredients across the week, aggregate duplicates (same name +
  // unit) into a single line, then format for Bring! / clipboard.
  const rawIngredients = mealPlan.items.flatMap(
    (item) => item.recipe.ingredients
  );
  const aggregated = aggregateIngredients(rawIngredients);
  const allIngredients = formatIngredientLines(aggregated);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: `Meal Plan – ${formatWeekLabel(weekStart)}`,
    recipeIngredient: allIngredients,
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
