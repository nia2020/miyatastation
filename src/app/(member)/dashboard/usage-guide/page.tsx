import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function parseUsageGuide(value: string | null): string[] {
  if (!value?.trim()) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === "string")
      .map((s) => String(s).trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

export default async function UsageGuidePage() {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("site_config")
    .select("value")
    .eq("key", "usage_guide")
    .maybeSingle();

  const items = parseUsageGuide(row?.value ?? null);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
        ご利用案内
      </h2>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        メンバーサイトのご利用に関する案内です。
      </p>
      <div className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-6">
        {items.length > 0 ? (
          <ul className="space-y-4">
            {items.map((item, i) => (
              <li key={i} className="flex gap-3">
                <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                  {i + 1}
                </span>
                <span className="text-slate-700 dark:text-slate-300 pt-0.5 whitespace-pre-line">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-500 dark:text-slate-400">
            現在、ご利用案内はありません。
          </p>
        )}
      </div>
    </div>
  );
}
