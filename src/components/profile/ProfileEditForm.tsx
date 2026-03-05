"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

interface ProfileEditFormProps {
  initialNickname: string;
  initialBirthday: string;
  initialBirthdayWishName: string;
}

/** 誕生日の2週間前以内かどうか（読んで欲しい名前の編集不可期間） */
function isWithinTwoWeeksBeforeBirthday(birthdayStr: string): boolean {
  if (!birthdayStr) return false;
  const [, month, day] = birthdayStr.split("-").map(Number);
  const today = new Date();
  const thisYearBirthday = new Date(today.getFullYear(), month - 1, day);
  let nextBirthday = thisYearBirthday;
  if (thisYearBirthday < today) {
    nextBirthday = new Date(today.getFullYear() + 1, month - 1, day);
  }
  const twoWeeksBefore = new Date(nextBirthday);
  twoWeeksBefore.setDate(twoWeeksBefore.getDate() - 14);
  return today >= twoWeeksBefore && today < nextBirthday;
}

export function ProfileEditForm({
  initialNickname,
  initialBirthday,
  initialBirthdayWishName,
}: ProfileEditFormProps) {
  const router = useRouter();
  const [nickname, setNickname] = useState(initialNickname);
  const [birthdayWishName, setBirthdayWishName] = useState(
    initialBirthdayWishName
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const wishNameLocked = useMemo(
    () => isWithinTwoWeeksBeforeBirthday(initialBirthday),
    [initialBirthday]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: nickname.trim(),
          birthday: initialBirthday || null,
          birthday_wish_name: (wishNameLocked
            ? initialBirthdayWishName
            : birthdayWishName
          ).trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "保存に失敗しました");
      }

      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-6 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg bg-green-50 dark:bg-green-900/30 p-3 text-sm text-green-700 dark:text-green-400">
            保存しました
          </div>
        )}

        <div>
          <label
            htmlFor="nickname"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            ニックネーム <span className="text-red-500">*</span>
          </label>
          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800"
            placeholder="例: たろう"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            誕生日（生年月日）
          </label>
          <div className="mt-1 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 px-4 py-2.5 text-slate-700 dark:text-slate-300">
            {initialBirthday
              ? new Date(initialBirthday + "T00:00:00").toLocaleDateString(
                  "ja-JP",
                  { year: "numeric", month: "long", day: "numeric" }
                )
              : "—"}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            誕生日は変更できません
          </p>
        </div>

        <div>
          <label
            htmlFor="birthdayWishName"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            誕生日のお祝いで読んでほしい名前 <span className="text-red-500">*</span>
          </label>
          {wishNameLocked ? (
            <div className="mt-1 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 px-4 py-2.5 text-slate-700 dark:text-slate-300">
              {birthdayWishName || "—"}
            </div>
          ) : (
            <input
              id="birthdayWishName"
              type="text"
              value={birthdayWishName}
              onChange={(e) => setBirthdayWishName(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800"
              placeholder="例: たろうくん"
            />
          )}
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {wishNameLocked
              ? "誕生日の2週間前からは変更できません"
              : "誕生日のお祝いメッセージで呼んでほしい名前"}
          </p>
        </div>

        <button
          type="submit"
          disabled={
            loading ||
            !nickname.trim() ||
            !initialBirthday ||
            (!wishNameLocked && !birthdayWishName.trim())
          }
          className="w-full rounded-lg bg-indigo-600 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "保存中..." : "保存する"}
        </button>
      </form>
    </div>
  );
}
