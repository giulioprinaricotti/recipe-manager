import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWeekStart, toWeekId } from "@/lib/weeks";
import { ShareTooBringButton } from "./share-to-bring-button";
import { RecipeTagEditor } from "./recipe-tag-editor";
import { RecipeEditor } from "./recipe-editor";
import { RecipeMetadataEditor } from "./recipe-metadata-editor";
import { RecipeCoverImage } from "./recipe-cover-image";
import { AddToNextWeekButton } from "./add-to-next-week-button";

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      ingredients: { orderBy: { order: "asc" } },
      instructions: { orderBy: { stepNumber: "asc" } },
      user: { select: { name: true, email: true } },
    },
  });

  if (!recipe) notFound();

  const isOwn = recipe.userId === session!.user.id;

  const currentWeek = getWeekStart(new Date());
  const nextWeek = new Date(currentWeek);
  nextWeek.setUTCDate(nextWeek.getUTCDate() + 7);
  const nextWeekId = toWeekId(nextWeek);

  const nextWeekPlan = await prisma.mealPlan.findUnique({
    where: {
      userId_weekStart: { userId: session!.user.id, weekStart: nextWeek },
    },
    select: { items: { where: { recipeId: id }, select: { id: true } } },
  });
  const isPlannedNextWeek = (nextWeekPlan?.items.length ?? 0) > 0;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/recipes"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Recipes
        </Link>
      </div>

      <RecipeCoverImage
        recipeId={recipe.id}
        imageUrl={recipe.imageUrl}
        imageAttribution={recipe.imageAttribution}
        title={recipe.title}
        isOwn={isOwn}
      />

      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-semibold">{recipe.title}</h1>
          {!isOwn && (
            <p className="text-sm text-muted-foreground mt-1">
              Added by {recipe.user.name || recipe.user.email}
            </p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <AddToNextWeekButton recipeId={recipe.id} nextWeekId={nextWeekId} alreadyPlanned={isPlannedNextWeek} />
          {recipe.ingredients.length > 0 && (
            <ShareTooBringButton
              recipeId={recipe.id}
              recipeTitle={recipe.title}
              ingredients={recipe.ingredients}
              servings={recipe.servings}
            />
          )}
        </div>
      </div>

      {recipe.description && (
        <p className="text-muted-foreground mb-4">{recipe.description}</p>
      )}

      <RecipeMetadataEditor
        recipeId={recipe.id}
        servings={recipe.servings}
        prepTime={recipe.prepTime}
        cookTime={recipe.cookTime}
        sourceUrl={recipe.sourceUrl}
        isOwn={isOwn}
      />

      <div className="mb-6">
        <RecipeTagEditor recipeId={recipe.id} initialTags={recipe.tags} isOwn={isOwn} />
      </div>

      <RecipeEditor
        recipeId={recipe.id}
        ingredients={recipe.ingredients}
        instructions={recipe.instructions}
        isOwn={isOwn}
      />
    </div>
  );
}
