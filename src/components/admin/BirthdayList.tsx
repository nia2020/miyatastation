"use client";

import { useState, useEffect, useMemo } from "react";

type BirthdayEntry = {
  id: string;
  nickname: string | null;
  full_name: string;
  birthday: string;
  birthday_wish_name: string | null;
  celebrated: boolean;
};

const MONTHS = [
  { id: 1, label: "1月" },
  { id: 2, label: "2月" },
  { id: 3, label: "3月" },
  { id: 4, label: "4月" },
  { id: 5, label: "5月" },
  { id: 6, label: "6月" },
  { id: 7, label: "7月" },
  { id: 8, label: "8月" },
  { id: 9, label: "9月" },
  { id: 10, label: "10月" },
  { id: 11, label: "11月" },
  { id: 12, label: "12月" },
];

export function BirthdayList() {
  const [birthdays, setBirthdays] = useState<BirthdayEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<number>(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [bulkUnchecking, setBulkUnchecking] = useState(false);

  const fetchBirthdays = async () => {
    try {
      const res = await fetch("/api/admin/birthdays");
      if (res.ok) {
        const data = await res.json();
        setBirthdays(data.birthdays ?? []);
      }
    } catch {
      setBirthdays([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBirthdays();
  }, []);

  const handleCelebratedChange = async (entry: BirthdayEntry) => {
    if (updatingId) return;
    const newValue = !entry.celebrated;

    if (newValue) {
      // チェック入れる際は二重確認
      if (!confirm("お祝い済みにしますか？")) return;
      if (!confirm("もう一度確認してください。本当にお祝い済みにしますか？"))
        return;
    } else {
      if (!confirm("お祝い済みを解除しますか？")) return;
    }

    setUpdatingId(entry.id);
    try {
      const res = await fetch("/api/admin/birthdays/celebrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: entry.id,
          celebrated: newValue,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "更新に失敗しました");
      }
      setBirthdays((prev) =>
        prev.map((b) =>
          b.id === entry.id ? { ...b, celebrated: newValue } : b
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "更新に失敗しました");
    } finally {
      setUpdatingId(null);
    }
  };

  const byMonth = useMemo(() => {
    const map = new Map<number, BirthdayEntry[]>();
    for (let m = 1; m <= 12; m++) {
      map.set(m, []);
    }
    for (const b of birthdays) {
      const month = parseInt(b.birthday.split("-")[1], 10);
      map.get(month)?.push(b);
    }
    // 各月内で遅い日を上にソート（28日→15日→10日の順）
    for (const [, entries] of Array.from(map)) {
      entries.sort((a, b) => {
        const aDay = parseInt(a.birthday.split("-")[2], 10);
        const bDay = parseInt(b.birthday.split("-")[2], 10);
        return bDay - aDay;
      });
    }
    return map;
  }, [birthdays]);

  const formatBirthday = (dateStr: string) => {
    const [, m, d] = dateStr.split("-").map(Number);
    return `${m}月${d}日`;
  };

  if (loading) {
    return <p className="text-slate-500 dark:text-slate-400">読み込み中...</p>;
  }

  if (birthdays.length === 0) {
    return (
      <p className="text-slate-500 dark:text-slate-400">
        誕生日が登録されている会員はいません
      </p>
    );
  }

  const currentMonthBirthdays = byMonth.get(selectedMonth) ?? [];
  const celebratedCount = currentMonthBirthdays.filter((b) => b.celebrated)
    .length;

  const handleBulkUncheck = async () => {
    const celebratedInMonth = currentMonthBirthdays.filter((b) => b.celebrated);
    if (celebratedInMonth.length === 0) return;

    if (
      !confirm(
        `${selectedMonth}月のお祝い済み（${celebratedInMonth.length}件）を一斉に解除しますか？`
      )
    )
      return;

    setBulkUnchecking(true);
    try {
      const res = await fetch(
        "/api/admin/birthdays/celebrate/bulk-uncheck",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profileIds: celebratedInMonth.map((b) => b.id),
          }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "一斉解除に失敗しました");
      }
      setBirthdays((prev) =>
        prev.map((b) =>
          celebratedInMonth.some((c) => c.id === b.id)
            ? { ...b, celebrated: false }
            : b
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "一斉解除に失敗しました");
    } finally {
      setBulkUnchecking(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 月タブ */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-600 pb-2">
        {MONTHS.map(({ id, label }) => {
          const count = byMonth.get(id)?.length ?? 0;
          const isActive = selectedMonth === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setSelectedMonth(id)}
              className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                isActive
                  ? "bg-indigo-600 text-white dark:bg-indigo-500"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
              }`}
            >
              {label}
              {count > 0 && (
                <span
                  className={`ml-1.5 ${
                    isActive ? "text-indigo-200 dark:text-indigo-300" : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  ({count})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 一斉解除ボタン */}
      {celebratedCount > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleBulkUncheck}
            disabled={bulkUnchecking}
            className="px-4 py-2 text-sm font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/50 disabled:opacity-50 transition-colors"
          >
            {bulkUnchecking
              ? "解除中..."
              : `${selectedMonth}月のお祝い済みを一斉に解除（${celebratedCount}件）`}
          </button>
        </div>
      )}

      {/* 選択月の一覧 */}
      <div className="overflow-x-auto">
        {currentMonthBirthdays.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 py-8 text-center">
            {selectedMonth}月の誕生日の会員はいません
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-600">
                <th className="text-left py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                  誕生日
                </th>
                <th className="text-left py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                  お名前
                </th>
                <th className="text-left py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                  ニックネーム
                </th>
                <th className="text-left py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                  お祝い用名前
                </th>
                <th className="text-left py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                  お祝い済み
                </th>
              </tr>
            </thead>
            <tbody>
              {currentMonthBirthdays.map((b) => (
                <tr key={b.id} className="border-b border-slate-100 dark:border-slate-700">
                  <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                    {formatBirthday(b.birthday)}
                  </td>
                  <td className="py-3 px-4 text-slate-800 dark:text-slate-200">{b.full_name}</td>
                  <td className="py-3 px-4 text-slate-800 dark:text-slate-200">
                    {b.nickname || "—"}
                  </td>
                  <td className="py-3 px-4 text-slate-800 dark:text-slate-200">
                    {b.birthday_wish_name || "—"}
                  </td>
                  <td className="py-3 px-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={b.celebrated}
                        onChange={() => handleCelebratedChange(b)}
                        disabled={updatingId === b.id}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      {updatingId === b.id && (
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          更新中...
                        </span>
                      )}
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
