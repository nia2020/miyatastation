"use client";

import { useState, useEffect } from "react";
import {
  MESSAGE_FORM_MAX_SECTIONS,
  type MessageForm,
  type MessageFormSection,
} from "@/lib/forms";

type FormItem = MessageForm;

const emptySection = (): MessageFormSection => ({ title: "", description: "" });

const defaultForm = (): FormItem => ({
  url: "",
  sections: [emptySection()],
});

function normalizeFormFromApi(f: MessageForm): FormItem {
  const sections = f.sections?.length
    ? f.sections.slice(0, MESSAGE_FORM_MAX_SECTIONS).map((s) => ({
        title: s.title ?? "",
        description: s.description ?? "",
      }))
    : [emptySection()];
  return { url: f.url ?? "", sections };
}

export function ConfigFormAdmin() {
  const [forms, setForms] = useState<FormItem[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/config", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setForms(
          Array.isArray(data.forms) && data.forms.length > 0
            ? data.forms.map((f: MessageForm) => normalizeFormFromApi(f))
            : [defaultForm()]
        );
        setAnnouncement(typeof data.announcement === "string" ? data.announcement : "");
      })
      .catch(() => setForms([defaultForm()]))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valid = forms.filter((f) => f.url.trim());
    if (valid.length === 0 && !announcement.trim()) {
      alert("お知らせまたは各種フォームのURLを少なくとも1つ入力してください");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forms: valid, announcement }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "保存に失敗しました");
      }
      setForms(valid.length > 0 ? valid.map(normalizeFormFromApi) : [defaultForm()]);
      alert("保存しました");
    } catch (err) {
      alert(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const addForm = () => {
    setForms((prev) => [...prev, defaultForm()]);
  };

  const removeForm = (i: number) => {
    setForms((prev) => prev.filter((_, idx) => idx !== i));
  };

  const updateFormUrl = (i: number, value: string) => {
    setForms((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], url: value };
      return next;
    });
  };

  const updateSection = (
    formIndex: number,
    sectionIndex: number,
    field: keyof MessageFormSection,
    value: string
  ) => {
    setForms((prev) => {
      const next = [...prev];
      const sections = [...next[formIndex].sections];
      sections[sectionIndex] = { ...sections[sectionIndex], [field]: value };
      next[formIndex] = { ...next[formIndex], sections };
      return next;
    });
  };

  const addSection = (formIndex: number) => {
    setForms((prev) => {
      const next = [...prev];
      const row = next[formIndex];
      if (row.sections.length >= MESSAGE_FORM_MAX_SECTIONS) return prev;
      next[formIndex] = { ...row, sections: [...row.sections, emptySection()] };
      return next;
    });
  };

  const removeSection = (formIndex: number, sectionIndex: number) => {
    setForms((prev) => {
      const next = [...prev];
      const row = next[formIndex];
      if (row.sections.length <= 1) return prev;
      next[formIndex] = {
        ...row,
        sections: row.sections.filter((_, j) => j !== sectionIndex),
      };
      return next;
    });
  };

  if (loading) {
    return (
      <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600">
        <p className="text-slate-600 dark:text-slate-400">読み込み中...</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8"
    >
      <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 space-y-4">
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">運営からのお知らせ</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            TOPの目立つ位置に表示されます。空欄の場合は非表示です。
          </p>
        </div>
        <textarea
          value={announcement}
          onChange={(e) => setAnnouncement(e.target.value)}
          className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 min-h-[120px]"
          placeholder="例：次回のイベントは3/15を予定しています。詳細はイベント情報をご確認ください。"
          rows={4}
        />
      </div>

      <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 space-y-6">
      <div>
        <h3 className="font-semibold text-slate-800 dark:text-slate-200">各種フォームの設定</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          メンバー向けの「各種フォーム」に表示するフォームを追加できます。1つのフォームごとにリンク（URL）は1つです。タイトルと詳細は最大3組まで登録できます。
        </p>
      </div>

      <div className="space-y-4">
        {forms.map((form, i) => (
          <div
            key={i}
            className="p-4 border border-slate-200 dark:border-slate-600 rounded-lg space-y-3 bg-slate-50/50 dark:bg-slate-700/30"
          >
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                フォーム {i + 1}
              </span>
              {forms.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeForm(i)}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                >
                  削除
                </button>
              )}
            </div>

            {form.sections.map((section, si) => (
              <div
                key={si}
                className="space-y-3 p-3 rounded-lg border border-slate-200/80 dark:border-slate-600/80 bg-white/60 dark:bg-slate-800/40"
              >
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    タイトル・詳細 {si + 1}
                    {form.sections.length > 1 ? ` / ${form.sections.length}` : ""}
                  </span>
                  {form.sections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSection(i, si)}
                      className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 shrink-0"
                    >
                      この組を削除
                    </button>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    タイトル
                  </label>
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => updateSection(i, si, "title", e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800"
                    placeholder="各種フォーム"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    詳細
                  </label>
                  <textarea
                    value={section.description}
                    onChange={(e) => updateSection(i, si, "description", e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 min-h-[80px]"
                    placeholder="フォームの説明や補足を記載"
                    rows={3}
                  />
                </div>
              </div>
            ))}

            {form.sections.length < MESSAGE_FORM_MAX_SECTIONS && (
              <button
                type="button"
                onClick={() => addSection(i)}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
              >
                + タイトル・詳細を追加（最大{MESSAGE_FORM_MAX_SECTIONS}組）
              </button>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                URL
              </label>
              <input
                type="url"
                value={form.url}
                onChange={(e) => updateFormUrl(i, e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800"
                placeholder="https://forms.gle/xxxxx"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={addForm}
          className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 font-medium"
        >
          + フォームを追加
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-50 font-medium"
        >
          {saving ? "保存中..." : "保存"}
        </button>
      </div>
      </div>
    </form>
  );
}
