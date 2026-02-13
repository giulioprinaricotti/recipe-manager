"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { RECIPE_TAGS } from "@/lib/tags";
import { cn } from "@/lib/utils";

export function TagFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTags = new Set(
    searchParams.get("tags")?.split(",").filter(Boolean) ?? []
  );

  function toggle(slug: string) {
    const next = new Set(activeTags);
    if (next.has(slug)) {
      next.delete(slug);
    } else {
      next.add(slug);
    }

    const params = new URLSearchParams(searchParams.toString());
    if (next.size === 0) {
      params.delete("tags");
    } else {
      params.set("tags", Array.from(next).join(","));
    }

    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {RECIPE_TAGS.map((tag) => {
        const active = activeTags.has(tag.slug);
        return (
          <button
            key={tag.slug}
            onClick={() => toggle(tag.slug)}
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors",
              "border cursor-pointer",
              active
                ? `${tag.colorClasses} border-transparent`
                : "bg-background text-muted-foreground border-border hover:border-foreground"
            )}
          >
            {tag.label}
          </button>
        );
      })}
    </div>
  );
}
