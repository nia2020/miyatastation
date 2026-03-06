"use client";

import { usePathname } from "next/navigation";
import { DashboardSidebar } from "./DashboardSidebar";
import { SectionViewTracker } from "@/components/dashboard/SectionViewTracker";

type SectionId = "home" | "events" | "forms" | "chat";

interface DashboardShellProps {
  children: React.ReactNode;
  newFlags: { events: boolean; forms: boolean; chat: boolean };
}

export function DashboardShell({ children, newFlags }: DashboardShellProps) {
  const pathname = usePathname();
  const currentSection: SectionId =
    pathname === "/dashboard/events"
      ? "events"
      : pathname === "/dashboard/forms"
        ? "forms"
        : pathname === "/dashboard/chat"
          ? "chat"
          : "home";

  return (
    <>
      <SectionViewTracker />
      <div className="flex flex-col lg:flex-row lg:gap-8 gap-6">
        <DashboardSidebar
          currentPage="dashboard"
          currentSection={currentSection}
          newFlags={newFlags}
        />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </>
  );
}
