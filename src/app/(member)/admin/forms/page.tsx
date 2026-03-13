import { ConfigFormAdmin } from "@/components/admin/ConfigFormAdmin";

export default function AdminFormsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">フォーム管理</h2>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          各種フォームのリンク設定
        </p>
      </div>

      <ConfigFormAdmin />
    </div>
  );
}
