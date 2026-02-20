"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EditRecipeForm } from "./edit-recipe-form";
import { saveEditedRecipe } from "./actions";
import type {
  EditableIngredient,
  EditableInstruction,
  RecipeContentData,
} from "./types";

const initialIngredients: EditableIngredient[] = [
  { key: crypto.randomUUID(), name: "", quantity: "", unit: "" },
];

const initialInstructions: EditableInstruction[] = [
  { key: crypto.randomUUID(), description: "" },
];

export function ManualRecipeForm() {
  const router = useRouter();
  const savedIdRef = useRef<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [servings, setServings] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");

  async function handleSave(
    data: RecipeContentData
  ): Promise<{ error: string } | void> {
    if (!title.trim()) {
      return { error: "Recipe title is required" };
    }

    const result = await saveEditedRecipe({
      title: title.trim(),
      description: description.trim() || undefined,
      servings: servings ? parseInt(servings, 10) || undefined : undefined,
      prepTime: prepTime ? parseInt(prepTime, 10) || undefined : undefined,
      cookTime: cookTime ? parseInt(cookTime, 10) || undefined : undefined,
      ...data,
    });

    if ("error" in result) {
      return { error: result.error };
    }

    savedIdRef.current = result.id;
  }

  const metadataHeader = (
    <div className="flex flex-col gap-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Recipe title"
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description (optional)"
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="servings">Servings</Label>
          <Input
            id="servings"
            type="number"
            min="1"
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            placeholder="e.g. 4"
          />
        </div>
        <div>
          <Label htmlFor="prepTime">Prep (min)</Label>
          <Input
            id="prepTime"
            type="number"
            min="0"
            value={prepTime}
            onChange={(e) => setPrepTime(e.target.value)}
            placeholder="e.g. 15"
          />
        </div>
        <div>
          <Label htmlFor="cookTime">Cook (min)</Label>
          <Input
            id="cookTime"
            type="number"
            min="0"
            value={cookTime}
            onChange={(e) => setCookTime(e.target.value)}
            placeholder="e.g. 30"
          />
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Recipe</CardTitle>
      </CardHeader>
      <CardContent>
        <EditRecipeForm
          initialIngredients={initialIngredients}
          initialInstructions={initialInstructions}
          header={metadataHeader}
          onSave={handleSave}
          onSuccess={() => router.push(`/recipes/${savedIdRef.current}`)}
          saveLabel="Create Recipe"
        />
      </CardContent>
    </Card>
  );
}
