"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditRecipeForm } from "../new/edit-recipe-form";
import { updateRecipeContent } from "./actions";
import type {
  EditableIngredient,
  EditableInstruction,
  RecipeContentData,
} from "../new/types";

interface Ingredient {
  id: string;
  name: string;
  quantity: string | null;
  unit: string | null;
  optional: boolean;
  alternativeGroupId: string | null;
}

interface Instruction {
  id: string;
  stepNumber: number;
  description: string;
}

interface RecipeEditorProps {
  recipeId: string;
  ingredients: Ingredient[];
  instructions: Instruction[];
  isOwn: boolean;
}

export function RecipeEditor({
  recipeId,
  ingredients,
  instructions,
  isOwn,
}: RecipeEditorProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  if (editing) {
    const editableIngredients: EditableIngredient[] = ingredients.map(
      (ing) => ({
        key: ing.id,
        name: ing.name,
        quantity: ing.quantity ?? "",
        unit: ing.unit ?? "",
        optional: ing.optional,
        alternativeGroupId: ing.alternativeGroupId,
      })
    );

    const editableInstructions: EditableInstruction[] = instructions.map(
      (step) => ({
        key: step.id,
        description: step.description,
      })
    );

    async function handleSave(
      data: RecipeContentData
    ): Promise<{ error: string } | void> {
      return updateRecipeContent(recipeId, data);
    }

    return (
      <EditRecipeForm
        initialIngredients={editableIngredients}
        initialInstructions={editableInstructions}
        onSave={handleSave}
        onSuccess={() => {
          setEditing(false);
          router.refresh();
        }}
        onCancel={() => setEditing(false)}
        saveLabel="Save Changes"
      />
    );
  }

  return (
    <div>
      {ingredients.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Ingredients</h2>
            {isOwn && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Edit
              </Button>
            )}
          </div>
          <ul className="space-y-1">
            {(() => {
              const items: React.ReactNode[] = [];
              const seen = new Set<string>();
              for (const ing of ingredients) {
                if (ing.alternativeGroupId) {
                  if (seen.has(ing.alternativeGroupId)) continue;
                  seen.add(ing.alternativeGroupId);
                  const alts = ingredients.filter(
                    (i) => i.alternativeGroupId === ing.alternativeGroupId
                  );
                  const first = alts[0];
                  const isOptional = alts.some((a) => a.optional);
                  items.push(
                    <li key={ing.id} className="flex gap-2 text-sm">
                      {(first.quantity || first.unit) && (
                        <span className="text-muted-foreground w-20 shrink-0">
                          {[first.quantity, first.unit].filter(Boolean).join(" ")}
                        </span>
                      )}
                      <span>
                        {alts.map((a) => a.name).join(" or ")}
                        {isOptional && (
                          <span className="text-muted-foreground ml-1">(optional)</span>
                        )}
                      </span>
                    </li>
                  );
                } else {
                  items.push(
                    <li key={ing.id} className="flex gap-2 text-sm">
                      {(ing.quantity || ing.unit) && (
                        <span className="text-muted-foreground w-20 shrink-0">
                          {[ing.quantity, ing.unit].filter(Boolean).join(" ")}
                        </span>
                      )}
                      <span>
                        {ing.name}
                        {ing.optional && (
                          <span className="text-muted-foreground ml-1">(optional)</span>
                        )}
                      </span>
                    </li>
                  );
                }
              }
              return items;
            })()}
          </ul>
        </section>
      )}

      {instructions.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-3">Instructions</h2>
          <ol className="space-y-4">
            {instructions.map((step) => (
              <li key={step.id} className="flex gap-4 text-sm">
                <span className="text-muted-foreground font-medium w-6 shrink-0 pt-0.5">
                  {step.stepNumber}.
                </span>
                <span className="leading-relaxed" dangerouslySetInnerHTML={{ __html: step.description }} />
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
