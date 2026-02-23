import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TagBadge } from "@/components/tag-badge";
import { TagFilterBar } from "./tag-filter-bar";
import { RecipeViewToggle } from "./recipe-view-toggle";
import { FavouriteButton } from "./favourite-button";

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ tags?: string; view?: string }>;
}) {
  const session = await auth();
  const userId = session!.user.id;
  const { tags: tagsParam, view } = await searchParams;
  const activeTags = tagsParam?.split(",").filter(Boolean) ?? [];
  const isMineView = view === "mine";

  // Fetch favourite IDs for the current user
  const favourites = await prisma.favourite.findMany({
    where: { userId },
    select: { recipeId: true },
  });
  const favouriteIds = new Set(favourites.map((f) => f.recipeId));

  const tagFilter = activeTags.length > 0 ? { tags: { hasSome: activeTags } } : {};

  let whereClause: object;
  if (isMineView) {
    // Own recipes + explicitly favourited recipes
    whereClause = {
      OR: [
        { userId, ...tagFilter },
        { id: { in: Array.from(favouriteIds) }, ...tagFilter },
      ],
    };
  } else {
    whereClause = tagFilter;
  }

  const recipes = await prisma.recipe.findMany({
    where: whereClause,
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: { ingredients: true, instructions: true },
      },
      user: { select: { name: true, email: true } },
    },
  });

  const pageTitle = isMineView ? "My Recipes" : "Recipes";

  if (recipes.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">{pageTitle}</h1>
          <div className="flex items-center gap-3">
            <Suspense fallback={null}>
              <RecipeViewToggle />
            </Suspense>
            <Button asChild>
              <Link href="/recipes/new">Add Recipe</Link>
            </Button>
          </div>
        </div>
        <Suspense fallback={null}>
          <TagFilterBar />
        </Suspense>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <h2 className="text-2xl font-semibold">
            {activeTags.length > 0 ? "No matching recipes" : "No recipes yet"}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {activeTags.length > 0
              ? "Try removing some tag filters."
              : "Start building your collection by adding your first recipe."}
          </p>
          {activeTags.length === 0 && (
            <Button asChild className="mt-6">
              <Link href="/recipes/new">Add Your First Recipe</Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">{pageTitle}</h1>
        <div className="flex items-center gap-3">
          <Suspense fallback={null}>
            <RecipeViewToggle />
          </Suspense>
          <Button asChild>
            <Link href="/recipes/new">Add Recipe</Link>
          </Button>
        </div>
      </div>
      <Suspense fallback={null}>
        <TagFilterBar />
      </Suspense>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recipes.map((recipe) => {
          const isOwn = recipe.userId === userId;
          const isFavourited = isOwn || favouriteIds.has(recipe.id);
          const authorName = recipe.user.name || recipe.user.email;
          return (
            <div key={recipe.id} className="relative">
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
                    {!isOwn && (
                      <p className="text-xs text-muted-foreground">By {authorName}</p>
                    )}
                    {recipe.description && (
                      <CardDescription className="line-clamp-2">
                        {recipe.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      {recipe.prepTime && <span>Prep: {recipe.prepTime}min</span>}
                      {recipe.cookTime && <span>Cook: {recipe.cookTime}min</span>}
                      {recipe.servings && <span>Serves: {recipe.servings}</span>}
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
              <div className="absolute top-2 right-2">
                <FavouriteButton
                  recipeId={recipe.id}
                  isFavourited={isFavourited}
                  isOwn={isOwn}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
