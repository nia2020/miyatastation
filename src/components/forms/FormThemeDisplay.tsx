"use client";

import type { FormTheme } from "@/types/database";

interface FormThemeDisplayProps {
  formTheme: FormTheme;
}

export function FormThemeDisplay({ formTheme }: FormThemeDisplayProps) {
  const hasGoogleForm = formTheme.google_form_url?.trim();

  if (!hasGoogleForm) {
    return (
      <div className="p-6 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-xl">
        <h2 className="text-xl font-semibold text-amber-800 dark:text-amber-300 mb-2">
          {formTheme.theme}
        </h2>
        <p className="text-amber-700 dark:text-amber-400">
          このフォームは設定中です。しばらくお待ちください。
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
        {formTheme.theme}
      </h2>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
        週: {new Date(formTheme.week_start).toLocaleDateString("ja-JP")} 〜
      </p>

      <a
        href={formTheme.google_form_url!}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 w-full justify-center py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors"
      >
        Googleフォームで回答する
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </a>
    </div>
  );
}
