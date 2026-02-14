import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fromWeekId, formatWeekLabel } from "@/lib/weeks";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TagBadge } from "@/components/tag-badge";
import { AddRecipeDialog } from "./add-recipe-dialog";
import { RemoveRecipeButton } from "./remove-recipe-button";
import { ShareWeekToBringButton } from "./share-week-to-bring-button";

export default async function MealPlanWeekPage({
  params,
}: {
  params: Promise<{ weekId: string }>;
}) {
  const { weekId } = await params;
  const session = await auth();
  const weekStart = fromWeekId(weekId);

  const mealPlan = await prisma.mealPlan.findUnique({
    where: {
      userId_weekStart: {
        userId: session!.user.id,
        weekStart,
      },
    },
    include: {
      items: {
        include: {
          recipe: {
            select: {
              id: true,
              title: true,
              description: true,
              imageUrl: true,
              prepTime: true,
              cookTime: true,
              servings: true,
              tags: true,
              ingredients: {
                orderBy: { order: "asc" },
                select: { name: true, quantity: true, unit: true },
              },
            },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  const recipes = mealPlan?.items.map((i) => i.recipe) ?? [];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/meal-plans"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Meal Plans
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">
          {formatWeekLabel(weekStart)}
        </h1>
        <div className="flex gap-2">
          {recipes.length > 0 && (
            <ShareWeekToBringButton
              weekId={weekId}
              userId={session!.user.id}
              recipes={recipes}
            />
          )}
          <AddRecipeDialog weekId={weekId} />
        </div>
      </div>

      {recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <h2 className="text-2xl font-semibold">No recipes planned</h2>
          <p className="mt-2 text-muted-foreground">
            Add some recipes to plan your meals for this week.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="relative group">
              <Link href={`/recipes/${recipe.id}`}>
                <Card className="hover:shadow-md transition-shadow overflow-hidden">
                  {recipe.imageUrl && (
                    <img
                      src={recipe.imageUrl}
                      alt={recipe.title}
                      className="aspect-video w-full object-cover"
                    />
                  )}
                  <CardHeader>
                    <CardTitle>{recipe.title}</CardTitle>
                    {recipe.description && (
                      <CardDescription className="line-clamp-2">
                        {recipe.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      {recipe.prepTime && (
                        <span>Prep: {recipe.prepTime}min</span>
                      )}
                      {recipe.cookTime && (
                        <span>Cook: {recipe.cookTime}min</span>
                      )}
                      {recipe.servings && (
                        <span>Serves: {recipe.servings}</span>
                      )}
                    </div>
                    {recipe.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {recipe.tags.map((slug) => (
                          <TagBadge key={slug} slug={slug} />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
              <RemoveRecipeButton weekId={weekId} recipeId={recipe.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
