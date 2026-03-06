"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function OnboardingForm() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [birthday, setBirthday] = useState("");
  const [birthdayWishName, setBirthdayWishName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSkip = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/profile/onboarding/skip", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "スキップに失敗しました");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "スキップに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/profile/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: nickname.trim(),
          birthday: birthday || null,
          birthday_wish_name: birthdayWishName.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "保存に失敗しました");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 p-8 shadow-xl border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
          プロフィールを入力してください
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          初回ログイン時にご入力いただく項目です。後から変更できます。
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-600 dark:text-red-400">
              {error}
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
            <label
              htmlFor="birthday"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              誕生日（生年月日） <span className="text-red-500">*</span>
            </label>
            <input
              id="birthday"
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800"
            />
          </div>

          <div>
            <label
              htmlFor="birthdayWishName"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              誕生日のお祝いで読んでほしい名前 <span className="text-red-500">*</span>
            </label>
            <input
              id="birthdayWishName"
              type="text"
              value={birthdayWishName}
              onChange={(e) => setBirthdayWishName(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800"
              placeholder="例: たろうくん"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              誕生日のお祝いメッセージで呼んでほしい名前を入力してください
            </p>
          </div>

          <button
            type="submit"
            disabled={
              loading ||
              !nickname.trim() ||
              !birthday ||
              !birthdayWishName.trim()
            }
            className="w-full rounded-lg bg-indigo-600 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "保存中..." : "登録する"}
          </button>
          <button
            type="button"
            onClick={handleSkip}
            disabled={loading}
            className="w-full mt-2 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-50"
          >
            後で入力する
          </button>
        </form>
      </div>
    </div>
  );
}
