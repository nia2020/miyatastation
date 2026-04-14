"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import type { SectionId } from "@/contexts/NewFlagsContext";
import { useClearSectionViewed } from "@/contexts/NewFlagsContext";

const SECTION_MAP: Record<string, SectionId | SectionId[]> = {
  "/dashboard/events": "events",
  "/dashboard/forms": ["message_collection", "google_forms"],
  "/dashboard/chat": "chat",
  "/dashboard/archive-videos": "archive_videos",
};

export function SectionViewTracker() {
  const pathname = usePathname();
  const trackedRef = useRef<string | null>(null);
  const clearSectionViewed = useClearSectionViewed();

  useEffect(() => {
    const entry = SECTION_MAP[pathname];
    if (!entry || trackedRef.current === pathname) return;

    const sections = Array.isArray(entry) ? entry : [entry];

    const record = async () => {
      const results = await Promise.all(
        sections.map((section) =>
          fetch("/api/profile/section-viewed", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ section }),
          })
        )
      );
      if (results.every((r) => r.ok)) {
        trackedRef.current = pathname;
        sections.forEach((s) => clearSectionViewed?.(s));
      }
    };

    record();
  }, [pathname, clearSectionViewed]);

  return null;
}
