import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Link
        href="/admin/users"
        className="block p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md transition-all"
      >
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">アカウント発行</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          会員アカウントの新規発行（管理者のみ）
        </p>
      </Link>

      <Link
        href="/admin/events"
        className="block p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md transition-all"
      >
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">イベント管理</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Zoomイベントの追加・編集・削除
        </p>
      </Link>

      <Link
        href="/admin/forms"
        className="block p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md transition-all"
      >
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">フォーム管理</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          週次フォームのテーマ・質問の設定
        </p>
      </Link>

      <Link
        href="/admin/birthdays"
        className="block p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md transition-all"
      >
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">お誕生日一覧</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          誕生日が登録されている会員の一覧
        </p>
      </Link>

      <Link
        href="/admin/archive-videos"
        className="block p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md transition-all"
      >
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">アーカイブ動画</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          YouTubeリンクと公開期間の設定
        </p>
      </Link>
    </div>
  );
}
