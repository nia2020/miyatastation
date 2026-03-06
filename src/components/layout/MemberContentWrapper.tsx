"use client";

import { usePathname } from "next/navigation";
import { DashboardShell } from "./DashboardShell";

interface MemberContentWrapperProps {
  children: React.ReactNode;
  newFlags: { events: boolean; forms: boolean; chat: boolean };
}

export function MemberContentWrapper({
  children,
  newFlags,
}: MemberContentWrapperProps) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return <>{children}</>;
  }

  return <DashboardShell newFlags={newFlags}>{children}</DashboardShell>;
}
