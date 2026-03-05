import { createClient } from "@/lib/supabase/server";
import { GoogleFormLink } from "@/components/forms/GoogleFormLink";

type MessageForm = { title: string; url: string; description?: string };

function parseForms(value: string | null): MessageForm[] {
  if (!value?.trim()) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (f): f is MessageForm =>
          f &&
          typeof f === "object" &&
          typeof (f as MessageForm).title === "string" &&
          typeof (f as MessageForm).url === "string"
      )
      .map((f) => ({
        title: (f as MessageForm).title,
        url: (f as MessageForm).url,
        description: typeof (f as MessageForm).description === "string" ? (f as MessageForm).description : "",
      }));
  } catch {
    return [];
  }
}

export default async function FormsPage() {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("site_config")
    .select("key, value")
    .in("key", [
      "message_collection_forms",
      "google_form_url",
      "message_collection_title",
    ]);

  const config = rows?.reduce(
    (acc, r) => {
      acc[r.key] = r.value;
      return acc;
    },
    {} as Record<string, string | null>
  );

  let forms = parseForms(config?.message_collection_forms ?? null);
  if (forms.length === 0) {
    const legacyUrl = config?.google_form_url?.trim();
    const legacyTitle = config?.message_collection_title?.trim();
    if (legacyUrl) {
      forms = [{ title: legacyTitle || "メッセージ募集", url: legacyUrl, description: "" }];
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">週次フォーム</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          テーマに沿った質問に回答してください
        </p>
      </div>

      <GoogleFormLink forms={forms} />
    </div>
  );
}
