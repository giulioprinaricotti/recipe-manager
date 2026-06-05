"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { TAG_CATEGORIES, getTagsByCategory } from "@/lib/tags";
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
    <div className="space-y-3 mb-4">
      {TAG_CATEGORIES.map((cat) => {
        const tagsInCat = getTagsByCategory(cat.slug);
        if (tagsInCat.length === 0) return null;
        return (
          <div key={cat.slug}>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              {cat.label}
            </div>
            <div className="flex flex-wrap gap-2">
              {tagsInCat.map((tag) => {
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
          </div>
        );
      })}
    </div>
  );
}
