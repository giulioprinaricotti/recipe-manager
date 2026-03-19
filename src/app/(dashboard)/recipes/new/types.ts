export interface EditableIngredient {
  key: string;
  name: string;
  quantity: string;
  unit: string;
  optional: boolean;
  alternativeGroupId: string | null;
}

export interface EditableInstruction {
  key: string;
  description: string;
}

export interface RecipeContentData {
  ingredients: {
    name: string;
    quantity: string;
    unit: string;
    optional: boolean;
    alternativeGroupId: string | null;
  }[];
  instructions: {
    description: string;
  }[];
}

export interface EditedRecipePayload {
  title: string;
  description?: string;
  sourceUrl?: string;
  imageUrl?: string;
  imageAttribution?: string;
  servings?: number;
  prepTime?: number;
  cookTime?: number;
  ingredients: {
    name: string;
    quantity: string;
    unit: string;
    optional: boolean;
    alternativeGroupId: string | null;
  }[];
  instructions: {
    description: string;
  }[];
}
