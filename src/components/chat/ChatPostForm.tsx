"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface ChatPostFormProps {
  onPostCreated?: () => void;
}

export function ChatPostForm({ onPostCreated }: ChatPostFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) continue;

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/admin/chat/upload-image", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "アップロードに失敗しました");
        }

        const { url } = await res.json();
        setImages((prev) => [...prev, url]);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "画像のアップロードに失敗しました");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          images,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "投稿に失敗しました");
      }

      setTitle("");
      setContent("");
      setImages([]);
      setIsExpanded(false);
      onPostCreated?.();
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "投稿に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm">
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full py-3 px-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-400 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
        >
          + 新規投稿
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">新規投稿</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              タイトル
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="投稿のタイトル"
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              本文
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="会員へのお知らせ内容"
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              画像
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 text-sm disabled:opacity-50"
            >
              {uploading ? "アップロード中..." : "+ 画像を追加"}
            </button>
            {images.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {images.map((url, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={url}
                      alt=""
                      className="w-20 h-20 object-cover rounded-lg border border-slate-200 dark:border-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || !title.trim() || !content.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
            >
              {loading ? "投稿中..." : "投稿"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsExpanded(false);
                setTitle("");
                setContent("");
                setImages([]);
              }}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500"
            >
              キャンセル
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
