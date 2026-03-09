"use client";

import { usePathname } from "next/navigation";
import { DashboardShell } from "./DashboardShell";
import { NewFlagsProvider } from "@/contexts/NewFlagsContext";

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

  return (
    <NewFlagsProvider newFlags={newFlags}>
      <DashboardShell newFlags={newFlags}>{children}</DashboardShell>
    </NewFlagsProvider>
  );
}
