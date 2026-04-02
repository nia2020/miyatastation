"use client";

import { useState } from "react";
import type { MessageForm } from "@/lib/forms";

interface GoogleFormLinkProps {
  forms?: MessageForm[] | null;
  /** @deprecated 後方互換用、forms を使用してください */
  url?: string | null;
  /** @deprecated 後方互換用、forms を使用してください */
  title?: string | null;
}

export function GoogleFormLink({ forms, url, title }: GoogleFormLinkProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const items: MessageForm[] =
    forms && forms.length > 0
      ? forms.filter((f) => f.url?.trim())
      : url?.trim()
        ? [{ url, sections: [{ title: title?.trim() || "各種フォーム", description: "" }] }]
        : process.env.NEXT_PUBLIC_GOOGLE_FORM_URL?.trim()
          ? [
              {
                url: process.env.NEXT_PUBLIC_GOOGLE_FORM_URL,
                sections: [{ title: "各種フォーム", description: "" }],
              },
            ]
          : [];

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (items.length === 0) {
    return (
      <div className="p-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 text-center text-slate-600 dark:text-slate-400">
        現在募集中のフォームはありません
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map((form, i) => {
        const filledSections = form.sections.filter(
          (s) => s.title?.trim() || s.description?.trim()
        );
        const showFallbackHeading = filledSections.length === 0;

        return (
          <div
            key={i}
            className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm"
          >
            {showFallbackHeading && (
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
                各種フォーム
              </h2>
            )}
            {filledSections.map((sec, si) => (
              <div
                key={si}
                className={
                  si > 0
                    ? "mt-4 pt-4 border-t border-slate-200 dark:border-slate-600"
                    : ""
                }
              >
                {sec.title?.trim() &&
                  (si === 0 ? (
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
                      {sec.title}
                    </h2>
                  ) : (
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
                      {sec.title}
                    </h3>
                  ))}
                {sec.description?.trim() && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 whitespace-pre-wrap">
                    {sec.description}
                  </p>
                )}
              </div>
            ))}
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-4 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800">
              ※ テーマ以外の内容はお控えください
            </p>
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg space-y-3">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">リンク</h4>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm text-slate-600 dark:text-slate-400 break-all font-mono">
                  {form.url}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(form.url, `form-${i}`)}
                  className="shrink-0 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-medium hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
                >
                  {copiedId === `form-${i}` ? "コピーしました" : "コピー"}
                </button>
              </div>
              <a
                href={form.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors"
              >
                リンクを開く
                <span aria-hidden>→</span>
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
