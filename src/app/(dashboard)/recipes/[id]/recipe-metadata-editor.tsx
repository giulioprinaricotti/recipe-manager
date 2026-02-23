"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateRecipeMetadata } from "./actions";

interface RecipeMetadataEditorProps {
  recipeId: string;
  servings: number | null;
  prepTime: number | null;
  cookTime: number | null;
  sourceUrl: string | null;
  isOwn: boolean;
}

export function RecipeMetadataEditor({
  recipeId,
  servings,
  prepTime,
  cookTime,
  sourceUrl,
  isOwn,
}: RecipeMetadataEditorProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editServings, setEditServings] = useState(servings?.toString() ?? "");
  const [editPrepTime, setEditPrepTime] = useState(prepTime?.toString() ?? "");
  const [editCookTime, setEditCookTime] = useState(cookTime?.toString() ?? "");

  const totalTime = (prepTime ?? 0) + (cookTime ?? 0) || undefined;

  function handleEdit() {
    setEditServings(servings?.toString() ?? "");
    setEditPrepTime(prepTime?.toString() ?? "");
    setEditCookTime(cookTime?.toString() ?? "");
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    const result = await updateRecipeMetadata(recipeId, {
      servings: editServings ? parseInt(editServings) : undefined,
      prepTime: editPrepTime ? parseInt(editPrepTime) : undefined,
      cookTime: editCookTime ? parseInt(editCookTime) : undefined,
    });
    setSaving(false);

    if (result && "error" in result) return;

    setEditing(false);
    router.refresh();
  }

  if (editing) {
    return (
      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div>
          <label className="text-xs text-muted-foreground">Servings</label>
          <Input
            type="number"
            min="0"
            value={editServings}
            onChange={(e) => setEditServings(e.target.value)}
            className="w-24 h-8"
            placeholder="—"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Prep (min)</label>
          <Input
            type="number"
            min="0"
            value={editPrepTime}
            onChange={(e) => setEditPrepTime(e.target.value)}
            className="w-24 h-8"
            placeholder="—"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Cook (min)</label>
          <Input
            type="number"
            min="0"
            value={editCookTime}
            onChange={(e) => setEditCookTime(e.target.value)}
            className="w-24 h-8"
            placeholder="—"
          />
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleSave}
            disabled={saving}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setEditing(false)}
            disabled={saving}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6 group/meta">
      {servings && <span>Serves {servings}</span>}
      {prepTime && <span>Prep {prepTime} min</span>}
      {cookTime && <span>Cook {cookTime} min</span>}
      {totalTime && <span>Total {totalTime} min</span>}
      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Source ↗
        </a>
      )}
      {isOwn && (
        <button
          onClick={handleEdit}
          className="opacity-0 group-hover/meta:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
