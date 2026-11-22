import {
  isTextImportEnabled,
  MAX_RECIPE_TEXT_LENGTH,
} from "@/lib/recipe-text-extractor";
import { classifySharedContent, sharedParamsFrom } from "@/lib/shared-content";
import { NewRecipeClient } from "./new-recipe-client";

export default async function NewRecipePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Android's share sheet opens this page with title/text/url parameters.
  // Over-long text is passed through: the server action reports the error.
  const shared = classifySharedContent(sharedParamsFrom(await searchParams));

  return (
    <NewRecipeClient
      textImportEnabled={isTextImportEnabled()}
      maxTextLength={MAX_RECIPE_TEXT_LENGTH}
      shared={shared}
    />
  );
}
