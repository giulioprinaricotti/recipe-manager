"use client";

import { useState, type ReactNode } from "react";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { IngredientAutocomplete } from "./ingredient-autocomplete";
import type {
  EditableIngredient,
  EditableInstruction,
  RecipeContentData,
} from "./types";

interface EditRecipeFormProps {
  initialIngredients: EditableIngredient[];
  initialInstructions: EditableInstruction[];
  header?: ReactNode;
  onSave: (data: RecipeContentData) => Promise<{ error: string } | void>;
  onSuccess?: () => void;
  onCancel?: () => void;
  saveLabel?: string;
}

const emptyAddRow = { name: "", quantity: "", unit: "" };

export function EditRecipeForm({
  initialIngredients,
  initialInstructions,
  header,
  onSave,
  onSuccess,
  onCancel,
  saveLabel = "Save Recipe",
}: EditRecipeFormProps) {
  const [ingredients, setIngredients] = useState(initialIngredients);
  const [instructions, setInstructions] = useState(initialInstructions);
  const [addRow, setAddRow] = useState(emptyAddRow);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateIngredient(
    key: string,
    field: keyof EditableIngredient,
    value: string
  ) {
    setIngredients((prev) =>
      prev.map((ing) => (ing.key === key ? { ...ing, [field]: value } : ing))
    );
  }

  function removeIngredient(key: string) {
    setIngredients((prev) => prev.filter((ing) => ing.key !== key));
  }

  function toggleQb(key: string) {
    setIngredients((prev) =>
      prev.map((ing) => {
        if (ing.key !== key) return ing;
        if (ing.quantity === "q.b.") {
          return { ...ing, quantity: "", unit: "" };
        }
        return { ...ing, quantity: "q.b.", unit: "" };
      })
    );
  }

  function addIngredient() {
    if (!addRow.name.trim()) return;
    setIngredients((prev) => [
      ...prev,
      { key: crypto.randomUUID(), ...addRow },
    ]);
    setAddRow(emptyAddRow);
  }

  function toggleAddRowQb() {
    if (addRow.quantity === "q.b.") {
      setAddRow({ ...addRow, quantity: "", unit: "" });
    } else {
      setAddRow({ ...addRow, quantity: "q.b.", unit: "" });
    }
  }

  function updateInstruction(key: string, description: string) {
    setInstructions((prev) =>
      prev.map((step) => (step.key === key ? { ...step, description } : step))
    );
  }

  function removeInstruction(key: string) {
    setInstructions((prev) => prev.filter((step) => step.key !== key));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    const filteredIngredients = ingredients.filter(
      (ing) => ing.name.trim() !== ""
    );
    const filteredInstructions = instructions.filter(
      (step) => step.description.trim() !== ""
    );

    const result = await onSave({
      ingredients: filteredIngredients.map((ing) => ({
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
      })),
      instructions: filteredInstructions.map((step) => ({
        description: step.description,
      })),
    });

    setSaving(false);

    if (result && "error" in result) {
      setError(result.error);
    } else {
      onSuccess?.();
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {header}

      {/* Ingredients */}
      <section>
        <h3 className="text-sm font-medium mb-2">Ingredients</h3>
        <div className="space-y-2">
          {ingredients.map((ing) => (
            <div key={ing.key} className="flex items-center gap-2">
              <IngredientAutocomplete
                value={ing.name}
                onChange={(v) => updateIngredient(ing.key, "name", v)}
              />
              <Input
                value={ing.quantity}
                onChange={(e) =>
                  updateIngredient(ing.key, "quantity", e.target.value)
                }
                placeholder="Qty"
                className="w-20"
                disabled={ing.quantity === "q.b."}
              />
              <Input
                value={ing.unit}
                onChange={(e) =>
                  updateIngredient(ing.key, "unit", e.target.value)
                }
                placeholder="Unit"
                className="w-16"
                disabled={ing.quantity === "q.b."}
              />
              <Button
                type="button"
                variant={ing.quantity === "q.b." ? "default" : "outline"}
                size="sm"
                className="shrink-0 text-xs px-2"
                onClick={() => toggleQb(ing.key)}
              >
                q.b.
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeIngredient(ing.key)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {/* Add ingredient row */}
          <div className="flex items-center gap-2">
            <IngredientAutocomplete
              value={addRow.name}
              onChange={(v) => setAddRow({ ...addRow, name: v })}
              placeholder="Add ingredient..."
            />
            <Input
              value={addRow.quantity}
              onChange={(e) =>
                setAddRow({ ...addRow, quantity: e.target.value })
              }
              placeholder="Qty"
              className="w-20"
              disabled={addRow.quantity === "q.b."}
            />
            <Input
              value={addRow.unit}
              onChange={(e) =>
                setAddRow({ ...addRow, unit: e.target.value })
              }
              placeholder="Unit"
              className="w-16"
              disabled={addRow.quantity === "q.b."}
            />
            <Button
              type="button"
              variant={addRow.quantity === "q.b." ? "default" : "outline"}
              size="sm"
              className="shrink-0 text-xs px-2"
              onClick={toggleAddRowQb}
            >
              q.b.
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground hover:text-foreground"
              onClick={addIngredient}
              disabled={!addRow.name.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Instructions */}
      <section>
        <h3 className="text-sm font-medium mb-2">Steps</h3>
        <div className="space-y-2">
          {instructions.map((step, i) => (
            <div key={step.key} className="flex items-start gap-2">
              <span className="text-sm text-muted-foreground font-medium w-6 shrink-0 pt-2.5">
                {i + 1}.
              </span>
              <Textarea
                value={step.description}
                onChange={(e) =>
                  updateInstruction(step.key, e.target.value)
                }
                className="min-h-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 mt-1 text-muted-foreground hover:text-destructive"
                onClick={() => removeInstruction(step.key)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </section>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={saving}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? "Saving..." : saveLabel}
        </Button>
      </div>
    </div>
  );
}
