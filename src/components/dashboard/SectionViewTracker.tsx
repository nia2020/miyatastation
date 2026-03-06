"use client";

import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const SECTION_MAP: Record<string, string> = {
  "/dashboard/events": "events",
  "/dashboard/forms": "forms",
  "/dashboard/chat": "chat",
};

export function SectionViewTracker() {
  const pathname = usePathname();
  const router = useRouter();
  const trackedRef = useRef<string | null>(null);

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
        router.refresh();
      }
    };

    record();
  }, [pathname, router]);

  return null;
}
