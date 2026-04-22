import { createClient } from "@/lib/supabase/server";
import { GoogleFormLink } from "@/components/forms/GoogleFormLink";
import { splitMessageForms } from "@/lib/forms";

export const dynamic = "force-dynamic";

export default async function DashboardFormsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: configRows } = await supabase
    .from("site_config")
    .select("key, value")
    .in("key", [
      "message_collection_forms",
      "google_form_url",
      "message_collection_title",
    ]);
  const configMap = configRows?.reduce(
    (acc, r) => {
      acc[r.key] = r.value;
      return acc;
    },
    {} as Record<string, string | null>
  );
  const { messageCollection, googleForm } = splitMessageForms(configMap);
  const allForms = [...messageCollection, ...(googleForm ? [googleForm] : [])];
  const hasAny = allForms.length > 0;

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
        各種フォーム
      </h2>
      {!hasAny ? (
        <div className="p-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 text-center text-slate-600 dark:text-slate-400">
          現在募集中のフォームはありません
        </div>
      ) : (
        <GoogleFormLink forms={allForms} />
      )}
    </div>
  );
}
