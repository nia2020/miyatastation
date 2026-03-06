"use client";

import { usePathname } from "next/navigation";
import { DashboardSidebar } from "./DashboardSidebar";
import { BannerLinks } from "./BannerLinks";
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

  const currentPage =
    pathname === "/member-card"
      ? "member-card"
      : pathname === "/profile"
        ? "profile"
        : pathname === "/dashboard/archive-videos"
          ? "archive-videos"
          : "dashboard";

  return (
    <>
      <SectionViewTracker />
      <div className="flex flex-col lg:flex-row lg:gap-8 gap-6">
        <DashboardSidebar
          currentPage={currentPage}
          currentSection={currentSection}
          newFlags={newFlags}
        />
        <div className="min-w-0 flex-1 space-y-8">
          {children}
          <BannerLinks />
        </div>
      </div>
    </>
  );
}
