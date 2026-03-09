"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import type { SectionId } from "@/contexts/NewFlagsContext";
import { useClearSectionViewed } from "@/contexts/NewFlagsContext";

const SECTION_MAP: Record<string, SectionId> = {
  "/dashboard/events": "events",
  "/dashboard/forms": "forms",
  "/dashboard/chat": "chat",
};

export function SectionViewTracker() {
  const pathname = usePathname();
  const trackedRef = useRef<string | null>(null);
  const clearSectionViewed = useClearSectionViewed();

  useEffect(() => {
    const section = SECTION_MAP[pathname];
    if (!section || trackedRef.current === pathname) return;

    const record = async () => {
      const res = await fetch("/api/profile/section-viewed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section }),
      });
      if (res.ok) {
        trackedRef.current = pathname;
        clearSectionViewed?.(section);
      }
    };

    record();
  }, [pathname, clearSectionViewed]);

  return null;
}
