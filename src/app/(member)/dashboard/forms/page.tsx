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
  const hasAny = messageCollection.length > 0 || !!googleForm;

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
        メッセージ募集・各種フォーム
      </h2>
      {!hasAny ? (
        <div className="p-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 text-center text-slate-600 dark:text-slate-400">
          現在募集中のフォームはありません
        </div>
      ) : (
        <div className="space-y-10">
          {messageCollection.length > 0 ? (
            <section id="message-collection" className="scroll-mt-24 space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-600 pb-2">
                メッセージ募集
              </h3>
              <GoogleFormLink forms={messageCollection} />
            </section>
          ) : null}
          {googleForm ? (
            <section id="google-forms" className="scroll-mt-24 space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-600 pb-2">
                各種フォーム
              </h3>
              <GoogleFormLink forms={[googleForm]} />
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
