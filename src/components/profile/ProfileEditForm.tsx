"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface ProfileEditFormProps {
  initialNickname: string;
  initialBirthday: string;
  initialBirthdayWishName: string;
  initialAvatarUrl?: string;
  canSetAvatar?: boolean;
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
  initialAvatarUrl = "",
  canSetAvatar = false,
}: ProfileEditFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [nickname, setNickname] = useState(initialNickname);
  const [birthdayWishName, setBirthdayWishName] = useState(
    initialBirthdayWishName
  );
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const wishNameLocked = useMemo(
    () => isWithinTwoWeeksBeforeBirthday(initialBirthday),
    [initialBirthday]
  );

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "アップロードに失敗しました");
      }
      const { url } = await res.json();
      setAvatarUrl(url);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "アップロードに失敗しました");
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  };

  const handleAvatarRemove = async () => {
    if (!confirm("アイコン画像を削除しますか？")) return;
    setAvatarUploading(true);
    try {
      const res = await fetch("/api/profile/avatar", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "削除に失敗しました");
      }
      setAvatarUrl("");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "削除に失敗しました");
    } finally {
      setAvatarUploading(false);
    }
  };

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

        {canSetAvatar && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              アイコン画像
            </label>
            <div className="flex items-center gap-4">
              <div className="shrink-0 w-20 h-20 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="アイコン"
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl text-slate-400">?</span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 disabled:opacity-50"
                >
                  {avatarUploading ? "アップロード中..." : "画像を選択"}
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleAvatarRemove}
                    disabled={avatarUploading}
                    className="text-sm text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50"
                  >
                    削除
                  </button>
                )}
              </div>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              会員TOPの挨拶部分に表示されます
            </p>
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
