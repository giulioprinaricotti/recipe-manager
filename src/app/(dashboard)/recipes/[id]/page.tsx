import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ShareTooBringButton } from "./share-to-bring-button";

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const recipe = await prisma.recipe.findUnique({
    where: { id, userId: session!.user.id },
    include: {
      ingredients: { orderBy: { order: "asc" } },
      instructions: { orderBy: { stepNumber: "asc" } },
    },
  });

  if (!recipe) notFound();

  const totalTime =
    (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0) || undefined;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/recipes"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← My Recipes
        </Link>
      </div>

      {recipe.imageUrl && (
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          className="aspect-video w-full object-cover rounded-xl mb-6"
        />
      )}

      <div className="flex items-start justify-between gap-4 mb-2">
        <h1 className="text-3xl font-semibold">{recipe.title}</h1>
        {recipe.ingredients.length > 0 && (
          <ShareTooBringButton
            recipeId={recipe.id}
            recipeTitle={recipe.title}
            ingredients={recipe.ingredients}
            servings={recipe.servings}
          />
        )}
      </div>

      {recipe.description && (
        <p className="text-muted-foreground mb-4">{recipe.description}</p>
      )}

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
        {recipe.servings && <span>Serves {recipe.servings}</span>}
        {recipe.prepTime && <span>Prep {recipe.prepTime} min</span>}
        {recipe.cookTime && <span>Cook {recipe.cookTime} min</span>}
        {totalTime && <span>Total {totalTime} min</span>}
        {recipe.sourceUrl && (
          <a
            href={recipe.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Source ↗
          </a>
        )}
      </div>

      {recipe.ingredients.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Ingredients</h2>
          <ul className="space-y-1">
            {recipe.ingredients.map((ing) => (
              <li key={ing.id} className="flex gap-2 text-sm">
                {(ing.quantity || ing.unit) && (
                  <span className="text-muted-foreground w-20 shrink-0">
                    {[ing.quantity, ing.unit].filter(Boolean).join(" ")}
                  </span>
                )}
                <span>{ing.name}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {recipe.instructions.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-3">Instructions</h2>
          <ol className="space-y-4">
            {recipe.instructions.map((step) => (
              <li key={step.id} className="flex gap-4 text-sm">
                <span className="text-muted-foreground font-medium w-6 shrink-0 pt-0.5">
                  {step.stepNumber}.
                </span>
                <span className="leading-relaxed">{step.description}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
