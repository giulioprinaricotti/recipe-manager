"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateRecipeTitle } from "./actions";

interface RecipeTitleEditorProps {
  recipeId: string;
  title: string;
  isOwn: boolean;
}

export function RecipeTitleEditor({
  recipeId,
  title,
  isOwn,
}: RecipeTitleEditorProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editTitle, setEditTitle] = useState(title);

  function handleEdit() {
    setEditTitle(title);
    setEditing(true);
  }

  async function handleSave() {
    if (!editTitle.trim()) return;
    setSaving(true);
    const result = await updateRecipeTitle(recipeId, editTitle);
    setSaving(false);

    if (result && "error" in result) return;

    setEditing(false);
    router.refresh();
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="text-3xl font-semibold h-auto py-1"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") setEditing(false);
          }}
        />
        <div className="flex gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleSave}
            disabled={saving || !editTitle.trim()}
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
    <div className="group/title flex items-center gap-2">
      <h1 className="text-3xl font-semibold">{title}</h1>
      {isOwn && (
        <button
          onClick={handleEdit}
          className="opacity-0 group-hover/title:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
