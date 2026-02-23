"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export function RecipeViewToggle() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view");
  const isMine = view === "mine";

  function buildHref(newView: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (newView) {
      params.set("view", newView);
    } else {
      params.delete("view");
    }
    const qs = params.toString();
    return `/recipes${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="flex items-center rounded-lg border p-0.5 text-sm">
      <Link
        href={buildHref(null)}
        className={cn(
          "rounded-md px-3 py-1 transition-colors",
          !isMine
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        All Recipes
      </Link>
      <Link
        href={buildHref("mine")}
        className={cn(
          "rounded-md px-3 py-1 transition-colors",
          isMine
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        My Recipes
      </Link>
    </div>
  );
}
