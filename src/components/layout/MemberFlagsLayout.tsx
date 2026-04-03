"use client";

import { NewFlagsProvider, type NewFlags } from "@/contexts/NewFlagsContext";

export function MemberFlagsLayout({
  newFlags,
  children,
}: {
  newFlags: NewFlags;
  children: React.ReactNode;
}) {
  return <NewFlagsProvider newFlags={newFlags}>{children}</NewFlagsProvider>;
}
