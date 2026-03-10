"use client";

import { useState, useEffect } from "react";

export function UsageGuideAdmin() {
  const [items, setItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/usage-guide")
      .then((res) => res.json())
      .then((data) => {
        setItems(Array.isArray(data.items) ? data.items : []);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valid = items.filter((s) => s.trim());
    setSaving(true);
    try {
      const res = await fetch("/api/admin/usage-guide", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: valid }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "保存に失敗しました");
      }
      setItems(valid);
      alert("保存しました");
    } catch (err) {
      alert(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const addItem = () => {
    setItems((prev) => [...prev, ""]);
  };

  const removeItem = (i: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  };

  const updateItem = (i: number, value: string) => {
    setItems((prev) => {
      const next = [...prev];
      next[i] = value;
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 space-y-4">
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">
            ご利用案内の項目
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            会員向けのご利用案内ページに表示されます。項目の追加・編集・削除ができます。
          </p>
        </div>

        <div className="space-y-4">
          {items.map((item, i) => (
            <div
              key={i}
              className="p-4 border border-slate-200 dark:border-slate-600 rounded-lg space-y-2 bg-slate-50/50 dark:bg-slate-700/30"
            >
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  項目 {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                >
                  削除
                </button>
              </div>
              <textarea
                value={item}
                onChange={(e) => updateItem(i, e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 min-h-[80px]"
                placeholder="案内の内容を入力"
                rows={3}
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={addItem}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 font-medium"
          >
            + 項目を追加
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
