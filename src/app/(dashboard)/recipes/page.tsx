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

export default async function RecipesPage() {
  const session = await auth();

  const recipes = await prisma.recipe.findMany({
    where: { userId: session!.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: { ingredients: true, instructions: true },
      },
    },
  });

  if (recipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-2xl font-semibold">No recipes yet</h2>
        <p className="mt-2 text-muted-foreground">
          Start building your collection by adding your first recipe.
        </p>
        <Button asChild className="mt-6">
          <Link href="/recipes/new">Add Your First Recipe</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">My Recipes</h1>
        <Button asChild>
          <Link href="/recipes/new">Add Recipe</Link>
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recipes.map((recipe) => (
          <Link key={recipe.id} href={`/recipes/${recipe.id}`}>
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
                  {recipe.prepTime && <span>Prep: {recipe.prepTime}min</span>}
                  {recipe.cookTime && <span>Cook: {recipe.cookTime}min</span>}
                  {recipe.servings && <span>Serves: {recipe.servings}</span>}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
