"use client";

import { useState } from "react";
import type { ArchiveVideo } from "@/types/database";

interface ArchiveVideosAdminProps {
  videos: ArchiveVideo[];
}

export function ArchiveVideosAdmin({ videos }: ArchiveVideosAdminProps) {
  const [videoList, setVideoList] = useState(videos);
  const [editing, setEditing] = useState<ArchiveVideo | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);

  const getDefaultFormData = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const expires = new Date(d);
    expires.setDate(expires.getDate() + 7);
    return {
      title: "",
      youtube_url: "",
      published_at: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`,
      expires_at: `${expires.getFullYear()}-${pad(expires.getMonth() + 1)}-${pad(expires.getDate())}T23:59`,
    };
  };

  const defaultVideo = getDefaultFormData();

  const [formData, setFormData] = useState(defaultVideo);

  /** datetime-local の値はタイムゾーン省略のため、サーバー（UTC）で new Date すると誤解釈される。ブラウザのローカル時刻として ISO UTC に直してから送る */
  const datetimeLocalToUtcIso = (local: string): string => {
    const d = new Date(local);
    if (Number.isNaN(d.getTime())) {
      throw new Error("日時の形式が正しくありません");
    }
    return d.toISOString();
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/archive-videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editing ? { id: editing.id } : {}),
          title: formData.title,
          youtube_url: formData.youtube_url,
          published_at: datetimeLocalToUtcIso(formData.published_at),
          expires_at: formData.expires_at
            ? datetimeLocalToUtcIso(formData.expires_at)
            : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "保存に失敗しました");
      }

      const { video } = await res.json();
      if (editing) {
        setVideoList((prev) =>
          prev.map((v) => (v.id === video.id ? video : v))
        );
      } else {
        setVideoList((prev) => [video, ...prev]);
      }
      setEditing(null);
      setIsCreating(false);
      setFormData(getDefaultFormData());
    } catch (err) {
      alert(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この動画を削除しますか？")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/archive-videos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error("削除に失敗しました");

      setVideoList((prev) => prev.filter((v) => v.id !== id));
      setEditing(null);
      setIsCreating(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "削除に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const pad = (n: number) => String(n).padStart(2, "0");

  const formatLocalForInput = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

  const toLocalDatetimeLocal = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso.slice(0, 16);
    return formatLocalForInput(d);
  };

  const toLocalDateWith2359 = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso.slice(0, 16);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T23:59`;
  };

  const startEdit = (video: ArchiveVideo) => {
    setEditing(video);
    setIsCreating(false);
    setFormData({
      title: video.title,
      youtube_url: video.youtube_url,
      published_at: toLocalDatetimeLocal(video.published_at),
      expires_at: video.expires_at ? toLocalDateWith2359(video.expires_at) : "",
    });
  };

  const startCreate = () => {
    setEditing(null);
    setIsCreating(true);
    setFormData(getDefaultFormData());
  };

  const cancel = () => {
    setEditing(null);
    setIsCreating(false);
    setFormData(getDefaultFormData());
  };

  return (
    <div className="space-y-6">
      <button
        onClick={startCreate}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
      >
        新規動画追加
      </button>

      {(editing || isCreating) && (
        <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 space-y-4">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">
            {editing ? "動画編集" : "新規動画"}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                タイトル
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, title: e.target.value }))
                }
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                YouTube URL
              </label>
              <input
                type="url"
                value={formData.youtube_url}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, youtube_url: e.target.value }))
                }
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                公開開始日時
              </label>
              <input
                type="datetime-local"
                value={formData.published_at}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, published_at: e.target.value }))
                }
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                公開終了日時（空欄で無期限）
              </label>
              <input
                type="datetime-local"
                value={formData.expires_at}
                onChange={(e) => {
                  const v = e.target.value;
                  if (!v) {
                    setFormData((p) => ({ ...p, expires_at: "" }));
                    return;
                  }
                  const [datePart] = v.split("T");
                  setFormData((p) => ({
                    ...p,
                    expires_at: `${datePart}T23:59`,
                  }));
                }}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={
                loading ||
                !formData.title ||
                !formData.youtube_url ||
                !formData.published_at
              }
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
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
          登録済み動画
        </h3>
        {videoList.length === 0 ? (
          <p className="py-8 text-center text-slate-500 dark:text-slate-400">
            登録済みの動画はありません。「新規動画追加」で追加してください。
          </p>
        ) : (
          videoList.map((video) => {
          const now = new Date();
          const published = new Date(video.published_at);
          const expires = video.expires_at ? new Date(video.expires_at) : null;
          const isActive =
            published <= now && (!expires || expires >= now);

          return (
            <div
              key={video.id}
              className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600 flex justify-between items-start"
            >
              <div>
                <h3 className="font-medium text-slate-800 dark:text-slate-200">
                  {video.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  公開: {published.toLocaleString("ja-JP")}
                  {expires
                    ? ` ～ ${expires.toLocaleString("ja-JP")}`
                    : " ～ 無期限"}
                </p>
                {!isActive && (
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 rounded">
                    {published > now ? "公開前" : "公開終了"}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(video)}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                >
                  編集
                </button>
                <button
                  onClick={() => handleDelete(video.id)}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                >
                  削除
                </button>
              </div>
            </div>
          );
        })
        )}
      </div>
    </div>
  );
}
