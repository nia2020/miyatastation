"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function MemberError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Member area error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-lg w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-8 shadow-lg">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">
          エラーが発生しました
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 font-mono break-all">
          {error.message}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-500 mb-6">
          ブラウザの開発者ツール（F12）のコンソールにも詳細が表示されます。
        </p>
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            再試行
          </button>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 font-medium"
          >
            ダッシュボードへ
          </Link>
        </div>
      </div>
    </div>
  );
}
