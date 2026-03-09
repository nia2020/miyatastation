"use client";

import { createContext, useContext, useState, useCallback } from "react";

export type NewFlags = { events: boolean; forms: boolean; chat: boolean };
export type SectionId = "events" | "forms" | "chat";

type NewFlagsContextValue = {
  newFlags: NewFlags;
  clearSectionViewed: (section: SectionId) => void;
};

const NewFlagsContext = createContext<NewFlagsContextValue | null>(null);

export function NewFlagsProvider({
  newFlags: initialFlags,
  children,
}: {
  newFlags: NewFlags;
  children: React.ReactNode;
}) {
  const [newFlags, setNewFlags] = useState<NewFlags>(initialFlags);

  const clearSectionViewed = useCallback((section: SectionId) => {
    setNewFlags((prev) => ({ ...prev, [section]: false }));
  }, []);

  return (
    <NewFlagsContext.Provider value={{ newFlags, clearSectionViewed }}>
      {children}
    </NewFlagsContext.Provider>
  );
}

export function useNewFlags(): NewFlags {
  const ctx = useContext(NewFlagsContext);
  return ctx?.newFlags ?? { events: false, forms: false, chat: false };
}

export function useClearSectionViewed(): ((section: SectionId) => void) | undefined {
  const ctx = useContext(NewFlagsContext);
  return ctx?.clearSectionViewed;
}
