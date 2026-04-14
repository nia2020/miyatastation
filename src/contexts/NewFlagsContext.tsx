"use client";

import { createContext, useContext, useState, useCallback } from "react";

export type NewFlags = {
  events: boolean;
  messageCollection: boolean;
  googleForms: boolean;
  chat: boolean;
  archiveVideos: boolean;
};

export type SectionId =
  | "events"
  | "message_collection"
  | "google_forms"
  | "chat"
  | "archive_videos";

type NewFlagsContextValue = {
  newFlags: NewFlags;
  clearSectionViewed: (section: SectionId) => void;
};

const defaultFlags: NewFlags = {
  events: false,
  messageCollection: false,
  googleForms: false,
  chat: false,
  archiveVideos: false,
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
    setNewFlags((prev) => {
      switch (section) {
        case "events":
          return { ...prev, events: false };
        case "message_collection":
          return { ...prev, messageCollection: false };
        case "google_forms":
          return { ...prev, googleForms: false };
        case "chat":
          return { ...prev, chat: false };
        case "archive_videos":
          return { ...prev, archiveVideos: false };
        default:
          return prev;
      }
    });
  }, []);

  return (
    <NewFlagsContext.Provider value={{ newFlags, clearSectionViewed }}>
      {children}
    </NewFlagsContext.Provider>
  );
}

export function useNewFlags(): NewFlags {
  const ctx = useContext(NewFlagsContext);
  return ctx?.newFlags ?? defaultFlags;
}

export function useClearSectionViewed(): ((section: SectionId) => void) | undefined {
  const ctx = useContext(NewFlagsContext);
  return ctx?.clearSectionViewed;
}
