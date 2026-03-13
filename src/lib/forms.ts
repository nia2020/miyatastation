export function parseMessageForms(configMap: Record<string, string | null> | null | undefined) {
  let forms: { title: string; url: string; description?: string }[] = [];
  try {
    const parsed = configMap?.message_collection_forms?.trim();
    if (parsed) {
      const arr = JSON.parse(parsed) as unknown;
      if (Array.isArray(arr)) {
        forms = arr
          .filter(
            (f): f is { title: string; url: string; description?: string } =>
              f &&
              typeof f === "object" &&
              typeof (f as { title: string; url: string }).title === "string" &&
              typeof (f as { title: string; url: string }).url === "string"
          )
          .map((f) => ({
            title: (f as { title: string; url: string; description?: string }).title,
            url: (f as { title: string; url: string }).url,
            description: typeof (f as { description?: string }).description === "string" ? (f as { description: string }).description : "",
          }));
      }
    }
  } catch {}
  if (forms.length === 0 && configMap?.google_form_url?.trim()) {
    forms = [{
      title: configMap?.message_collection_title?.trim() || "各種フォーム",
      url: configMap.google_form_url,
      description: "",
    }];
  }
  return forms;
}
