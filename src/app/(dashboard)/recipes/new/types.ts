export interface EditableIngredient {
  key: string;
  name: string;
  quantity: string;
  unit: string;
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
  servings?: number;
  prepTime?: number;
  cookTime?: number;
  ingredients: {
    name: string;
    quantity: string;
    unit: string;
  }[];
  instructions: {
    description: string;
  }[];
}
