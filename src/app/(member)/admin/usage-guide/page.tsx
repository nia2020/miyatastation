import { UsageGuideAdmin } from "@/components/admin/UsageGuideAdmin";

export default function AdminUsageGuidePage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
          ご利用案内管理
        </h2>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          会員向けご利用案内ページの内容を編集・追加できます。
        </p>
      </div>

      <UsageGuideAdmin />
    </div>
  );
}
