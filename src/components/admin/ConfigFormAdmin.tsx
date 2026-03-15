"use client";

import { useState, useEffect } from "react";

type FormItem = { title: string; url: string; description: string };

export function ConfigFormAdmin() {
  const [forms, setForms] = useState<FormItem[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/config")
      .then((res) => res.json())
      .then((data) => {
        setForms(
          Array.isArray(data.forms) && data.forms.length > 0
            ? data.forms.map((f: FormItem) => ({
                title: f.title ?? "",
                url: f.url ?? "",
                description: f.description ?? "",
              }))
            : [{ title: "", url: "", description: "" }]
        );
        setAnnouncement(typeof data.announcement === "string" ? data.announcement : "");
      })
      .catch(() => setForms([{ title: "", url: "", description: "" }]))
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
      setForms(valid.length > 0 ? valid : [{ title: "", url: "", description: "" }]);
      alert("保存しました");
    } catch (err) {
      alert(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const addForm = () => {
    setForms((prev) => [...prev, { title: "", url: "", description: "" }]);
  };

  const removeForm = (i: number) => {
    setForms((prev) => prev.filter((_, idx) => idx !== i));
  };

  const updateForm = (i: number, field: "title" | "url" | "description", value: string) => {
    setForms((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
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
          メンバー向けの「各種フォーム」に表示するフォームを追加できます。
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
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                タイトル
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateForm(i, "title", e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800"
                placeholder="各種フォーム"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                詳細
              </label>
              <textarea
                value={form.description}
                onChange={(e) => updateForm(i, "description", e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg min-h-[80px]"
                placeholder="フォームの説明や補足を記載"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                URL
              </label>
              <input
                type="url"
                value={form.url}
                onChange={(e) => updateForm(i, "url", e.target.value)}
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
