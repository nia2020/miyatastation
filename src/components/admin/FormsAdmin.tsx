"use client";

import { useState } from "react";
import type { FormTheme } from "@/types/database";

interface FormsAdminProps {
  formThemes: FormTheme[];
}

export function FormsAdmin({ formThemes }: FormsAdminProps) {
  const [themeList, setThemeList] = useState(formThemes);
  const [editing, setEditing] = useState<FormTheme | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);

  const getWeekStart = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    return monday.toISOString().slice(0, 10);
  };

  const defaultForm = {
    theme: "",
    google_form_url: "",
    week_start: getWeekStart(),
    is_active: true,
  };

  const [formData, setFormData] = useState(defaultForm);

  const handleSave = async () => {
    if (!formData.theme || !formData.google_form_url.trim()) {
      alert("テーマとGoogleフォームのURLを入力してください");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editing
            ? { ...formData, id: editing.id }
            : formData
        ),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "保存に失敗しました");
      }

      const { formTheme } = await res.json();
      if (editing) {
        setThemeList((prev) =>
          prev.map((f) => (f.id === formTheme.id ? formTheme : f))
        );
      } else {
        setThemeList((prev) => [formTheme, ...prev]);
      }
      setEditing(null);
      setIsCreating(false);
      setFormData({ ...defaultForm, week_start: getWeekStart() });
    } catch (err) {
      alert(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("このフォームテーマを削除しますか？")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/forms", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error("削除に失敗しました");

      setThemeList((prev) => prev.filter((f) => f.id !== id));
      setEditing(null);
      setIsCreating(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "削除に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (formTheme: FormTheme) => {
    setEditing(formTheme);
    setIsCreating(false);
    setFormData({
      theme: formTheme.theme,
      google_form_url: formTheme.google_form_url ?? "",
      week_start: formTheme.week_start.slice(0, 10),
      is_active: formTheme.is_active,
    });
  };

  const startCreate = () => {
    setEditing(null);
    setIsCreating(true);
    setFormData({ ...defaultForm, week_start: getWeekStart() });
  };

  const cancel = () => {
    setEditing(null);
    setIsCreating(false);
  };

  return (
    <div className="space-y-6">
      <button
        onClick={startCreate}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
      >
        新規フォームテーマ追加
      </button>

      {(editing || isCreating) && (
        <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 space-y-4">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">
            {editing ? "フォーム編集" : "新規フォームテーマ"}
          </h3>
          <p className="text-sm text-slate-600">
            Googleフォームで作成したフォームのURLを登録してください
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                テーマ
              </label>
              <input
                type="text"
                value={formData.theme}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, theme: e.target.value }))
                }
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800"
                placeholder="今週のテーマ"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                GoogleフォームのURL
              </label>
              <input
                type="url"
                value={formData.google_form_url}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, google_form_url: e.target.value }))
                }
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800"
                placeholder="https://forms.google.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                週の開始日
              </label>
              <input
                type="date"
                value={formData.week_start}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, week_start: e.target.value }))
                }
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, is_active: e.target.checked }))
                }
                className="rounded"
              />
              <label htmlFor="is_active" className="text-sm text-slate-700 dark:text-slate-300">
                募集中として表示する
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "保存中..." : "保存"}
            </button>
            <button
              onClick={cancel}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {themeList.map((formTheme) => (
          <div
            key={formTheme.id}
            className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600 flex justify-between items-start"
          >
            <div>
              <h3 className="font-medium text-slate-800 dark:text-slate-200">{formTheme.theme}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {new Date(formTheme.week_start).toLocaleDateString("ja-JP")} 〜
                {formTheme.is_active ? (
                  <span className="ml-2 text-green-600">募集中</span>
                ) : (
                  <span className="ml-2 text-slate-400">終了</span>
                )}
              </p>
              {formTheme.google_form_url && (
                <a
                  href={formTheme.google_form_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mt-1 inline-block"
                >
                  フォームを開く →
                </a>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => startEdit(formTheme)}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
              >
                編集
              </button>
              <button
                onClick={() => handleDelete(formTheme.id)}
                className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                削除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
