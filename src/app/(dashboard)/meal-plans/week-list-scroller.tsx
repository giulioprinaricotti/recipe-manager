"use client";

import { useEffect, useRef } from "react";

export function WeekListScroller({
  currentWeekId,
  children,
}: {
  currentWeekId: string;
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current?.querySelector(
      `[data-week-id="${currentWeekId}"]`
    );
    if (el) {
      el.scrollIntoView({ block: "center", behavior: "instant" });
    }
  }, [currentWeekId]);

  return <div ref={containerRef}>{children}</div>;
}
