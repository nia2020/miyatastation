import { createClient } from "@/lib/supabase/server";
import { GoogleFormLink } from "@/components/forms/GoogleFormLink";
import { parseMessageForms } from "@/lib/forms";

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
  const messageForms = parseMessageForms(configMap);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
        各種フォーム
      </h2>
      <GoogleFormLink forms={messageForms} />
    </div>
  );
}
