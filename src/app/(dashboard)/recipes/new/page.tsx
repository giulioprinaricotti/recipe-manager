import {
  isTextImportEnabled,
  MAX_RECIPE_TEXT_LENGTH,
} from "@/lib/recipe-text-extractor";
import { NewRecipeClient } from "./new-recipe-client";

export default function NewRecipePage() {
  return (
    <NewRecipeClient
      textImportEnabled={isTextImportEnabled()}
      maxTextLength={MAX_RECIPE_TEXT_LENGTH}
    />
  );
}
