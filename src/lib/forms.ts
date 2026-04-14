export type MessageFormSection = {
  title: string;
  description: string;
};

export type MessageForm = {
  url: string;
  sections: MessageFormSection[];
};

export const MESSAGE_FORM_MAX_SECTIONS = 3;

/** JSON / DB 行から正規化。レガシー形式 { title, url, description } も解釈する */
export function coerceMessageForm(f: unknown): MessageForm | null {
  if (!f || typeof f !== "object") return null;
  const o = f as Record<string, unknown>;
  const url = typeof o.url === "string" ? o.url.trim() : "";
  if (!url) return null;

  if (Array.isArray(o.sections)) {
    const raw = o.sections.slice(0, MESSAGE_FORM_MAX_SECTIONS);
    const sections: MessageFormSection[] =
      raw.length > 0
        ? raw.map((s) => {
            if (!s || typeof s !== "object") return { title: "", description: "" };
            const x = s as Record<string, unknown>;
            return {
              title: typeof x.title === "string" ? x.title.trim() : "",
              description: typeof x.description === "string" ? x.description.trim() : "",
            };
          })
        : [];
    if (sections.length > 0) {
      return { url, sections };
    }
  }

  const title = typeof o.title === "string" ? o.title.trim() : "";
  const description = typeof o.description === "string" ? o.description.trim() : "";
  return { url, sections: [{ title, description }] };
}

/** メッセージ募集（JSON）と各種フォーム（Google URL）を分離（同一ページで両方表示する用） */
export function splitMessageForms(
  configMap: Record<string, string | null> | null | undefined
): { messageCollection: MessageForm[]; googleForm: MessageForm | null } {
  let messageCollection: MessageForm[] = [];
  try {
    const parsed = configMap?.message_collection_forms?.trim();
    if (parsed) {
      const arr = JSON.parse(parsed) as unknown;
      if (Array.isArray(arr)) {
        messageCollection = arr.map(coerceMessageForm).filter((f): f is MessageForm => f !== null);
      }
    }
  } catch {
    /* ignore */
  }
  let googleForm: MessageForm | null = null;
  if (configMap?.google_form_url?.trim()) {
    const title = configMap?.message_collection_title?.trim() || "各種フォーム";
    googleForm = {
      url: configMap.google_form_url.trim(),
      sections: [{ title, description: "" }],
    };
  }
  return { messageCollection, googleForm };
}

export function parseMessageForms(configMap: Record<string, string | null> | null | undefined) {
  const { messageCollection, googleForm } = splitMessageForms(configMap);
  if (messageCollection.length > 0) return messageCollection;
  if (googleForm) return [googleForm];
  return [];
}
