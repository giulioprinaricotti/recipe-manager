"use client";

import { useRouter } from "next/navigation";
import { ImagePicker } from "../new/image-picker";
import { updateRecipeCoverImage } from "./actions";

interface RecipeCoverImageProps {
  recipeId: string;
  imageUrl: string | null;
  imageAttribution: string | null;
  title: string;
}

export function RecipeCoverImage({
  recipeId,
  imageUrl,
  imageAttribution,
  title,
}: RecipeCoverImageProps) {
  const router = useRouter();

  async function handleChange(
    url: string | undefined,
    attribution: string | undefined
  ) {
    await updateRecipeCoverImage(recipeId, url, attribution);
    router.refresh();
  }

  if (imageUrl) {
    return (
      <>
        <div className={imageAttribution ? "mb-2" : "mb-6"}>
          <img
            src={imageUrl}
            alt={title}
            className="aspect-video w-full object-cover rounded-xl"
          />
        </div>
        {imageAttribution &&
          (() => {
            const [name, profileUrl] = imageAttribution.split("|");
            return (
              <p className="text-xs text-muted-foreground mb-4">
                Photo by{" "}
                <a
                  href={profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {name}
                </a>{" "}
                on{" "}
                <a
                  href="https://unsplash.com/?utm_source=recipe_manager&utm_medium=referral"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Unsplash
                </a>
              </p>
            );
          })()}
      </>
    );
  }

  return (
    <div className="mb-6">
      <ImagePicker
        value={undefined}
        onChange={handleChange}
        defaultQuery={title}
      />
    </div>
  );
}
