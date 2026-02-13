import { getTag } from "@/lib/tags";
import { cn } from "@/lib/utils";

export function TagBadge({
  slug,
  className,
}: {
  slug: string;
  className?: string;
}) {
  const tag = getTag(slug);
  if (!tag) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        tag.colorClasses,
        className
      )}
    >
      {tag.label}
    </span>
  );
}
