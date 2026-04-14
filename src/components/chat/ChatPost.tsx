"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Heart } from "lucide-react";

/** テキスト内のURLをリンクに変換 */
function linkify(text: string) {
  const urlRegex = /https?:\/\/[^\s<>"')\]]+/g;
  const parts = text.split(urlRegex);
  const matches = text.match(urlRegex) ?? [];
  const result: React.ReactNode[] = [];
  parts.forEach((part, i) => {
    result.push(part);
    if (matches[i]) {
      result.push(
        <a
          key={i}
          href={matches[i]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 underline break-all"
        >
          {matches[i]}
        </a>
      );
    }
  });
  return result;
}

type PostWithComments = {
  id: string;
  title: string;
  content: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  published_at?: string | null;
  images?: string[];
  comments: Array<{
    id: string;
    post_id: string;
    user_id: string;
    content: string;
    created_at: string;
    profiles: { nickname: string | null; avatar_url: string | null } | null;
  }>;
  likes?: Array<{ id: string; user_id: string }>;
};

interface ChatPostProps {
  post: PostWithComments;
  authorName?: string | null;
  authorAvatarUrl?: string | null;
  currentUserNickname?: string;
  currentUserAvatarUrl?: string | null;
  currentUserId?: string;
  isAdmin?: boolean;
  isPoster?: boolean;
  isScheduled?: boolean;
  onPostUpdated?: () => void;
  onPostDeleted?: () => void;
}

export function ChatPost({
  post,
  authorName,
  authorAvatarUrl,
  currentUserNickname,
  currentUserAvatarUrl,
  currentUserId,
  isAdmin,
  isPoster,
  isScheduled = false,
  onPostUpdated,
  onPostDeleted,
}: ChatPostProps) {
  const canEditPost =
    isAdmin || (isPoster && currentUserId && post.author_id === currentUserId);
  const router = useRouter();
  const [comments, setComments] = useState(post.comments);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title);
  const [editContent, setEditContent] = useState(post.content);
  const [editImages, setEditImages] = useState<string[]>(
    Array.isArray(post.images) ? post.images : []
  );
  const [editPublishedAt, setEditPublishedAt] = useState<string>(
    post.published_at ? post.published_at.slice(0, 16) : ""
  );
  const [uploading, setUploading] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const likes = post.likes ?? [];
  const likeCount = likes.length;
  const isLiked = currentUserId
    ? likes.some((l) => l.user_id === currentUserId)
    : false;
  const [optimisticLiked, setOptimisticLiked] = useState(isLiked);
  const [optimisticCount, setOptimisticCount] = useState(likeCount);

  const publishedAtChanged =
    (editPublishedAt ? editPublishedAt : null) !==
    (post.published_at ? post.published_at.slice(0, 16) : null);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/chat/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: post.id, content: newComment.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "コメントの投稿に失敗しました");
      }

      const { comment } = await res.json();
      setComments((prev) => [
        ...prev,
        {
          ...comment,
          profiles:
            currentUserNickname || currentUserAvatarUrl
              ? {
                  nickname: currentUserNickname ?? null,
                  avatar_url: currentUserAvatarUrl ?? null,
                }
              : null,
        },
      ]);
      setNewComment("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "コメントの投稿に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleEditFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setEditImages((prev) => [...prev, url]);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "画像のアップロードに失敗しました");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeEditImage = (index: number) => {
    setEditImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveEdit = async () => {
    const imagesChanged =
      JSON.stringify(editImages) !==
      JSON.stringify(Array.isArray(post.images) ? post.images : []);
    if (
      (editTitle === post.title &&
        editContent === post.content &&
        !imagesChanged &&
        !publishedAtChanged) ||
      loading
    )
      return;
    if (editPublishedAt && new Date(editPublishedAt) <= new Date()) {
      alert("予約日時は現在より後の時刻を指定してください");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: post.id,
          title: editTitle.trim(),
          content: editContent.trim(),
          images: editImages,
          published_at: editPublishedAt.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "更新に失敗しました");
      }
      setEditing(false);
      onPostUpdated?.();
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "更新に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const postImages = Array.isArray(post.images) ? post.images : [];

  const handleDeletePost = async () => {
    if (!confirm("この投稿を削除しますか？関連するコメントも削除されます。"))
      return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/chat", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: post.id }),
      });
      if (!res.ok) throw new Error("削除に失敗しました");
      onPostDeleted?.();
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "削除に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLike = async () => {
    if (!currentUserId || loading) return;

    setLoading(true);
    const prevLiked = optimisticLiked;
    const prevCount = optimisticCount;
    setOptimisticLiked(!prevLiked);
    setOptimisticCount(prevLiked ? prevCount - 1 : prevCount + 1);

    try {
      const res = await fetch("/api/chat/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: post.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "いいねの処理に失敗しました");
      }
    } catch (err) {
      setOptimisticLiked(prevLiked);
      setOptimisticCount(prevCount);
      alert(err instanceof Error ? err.message : "いいねの処理に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("このコメントを削除しますか？")) return;

    setLoading(true);
    try {
      const res = await fetch("/api/chat/comments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: commentId }),
      });

      if (!res.ok) throw new Error("削除に失敗しました");

      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "削除に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg font-semibold dark:bg-slate-800"
              />
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800"
              />
              {(isScheduled || editPublishedAt) && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    予約公開日時
                  </label>
                  <input
                    type="datetime-local"
                    value={editPublishedAt}
                    onChange={(e) => setEditPublishedAt(e.target.value)}
                    min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800"
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    空にすると即時公開になります
                  </p>
                </div>
              )}
              <div>
                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  multiple
                  onChange={handleEditFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => editFileInputRef.current?.click()}
                  disabled={uploading}
                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  {uploading ? "アップロード中..." : "+ 画像を追加"}
                </button>
                {editImages.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {editImages.map((url, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={url}
                          alt=""
                          className="w-16 h-16 object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => removeEditImage(i)}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100"
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
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={
                    loading ||
                    !editTitle.trim() ||
                    !editContent.trim() ||
                    (editTitle === post.title &&
                      editContent === post.content &&
                      JSON.stringify(editImages) ===
                        JSON.stringify(postImages) &&
                      !publishedAtChanged)
                  }
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm disabled:opacity-50"
                >
                  {loading ? "保存中..." : "保存"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setEditTitle(post.title);
                    setEditContent(post.content);
                    setEditImages(postImages);
                    setEditPublishedAt(
                      post.published_at ? post.published_at.slice(0, 16) : ""
                    );
                  }}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 text-sm"
                >
                  キャンセル
                </button>
              </div>
            </div>
          ) : (
            <>
              {isScheduled && (
                <span className="inline-block px-2 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 rounded mb-2">
                  予約済み: {post.published_at ? new Date(post.published_at).toLocaleString("ja-JP") : ""}
                </span>
              )}
              <div className="flex items-center gap-3">
                <div className="shrink-0 w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-600 flex items-center justify-center">
                  {authorAvatarUrl ? (
                    <Image
                      src={authorAvatarUrl}
                      alt=""
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image
                      src="/mascot.png"
                      alt=""
                      width={40}
                      height={40}
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                    {post.title}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {new Date(post.created_at).toLocaleString("ja-JP")}
                    <span className="ml-2">{authorName || "管理者"}</span>
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
        {canEditPost && !editing && (
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setEditing(true)}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              編集
            </button>
            <button
              onClick={handleDeletePost}
              className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
            >
              削除
            </button>
          </div>
        )}
      </div>
      {!editing && (
        <>
          <div className="mt-4 text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
            {linkify(post.content)}
          </div>
          {postImages.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {postImages.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <img
                    src={url}
                    alt=""
                    className="max-w-full max-h-64 object-contain rounded-lg border border-slate-200 dark:border-slate-600 hover:opacity-90"
                  />
                </a>
              ))}
            </div>
          )}
        </>
      )}

      {!editing && currentUserId && !isScheduled && (
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleLike}
            disabled={loading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors disabled:opacity-50 ${
              optimisticLiked
                ? "text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/30"
                : "text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700/50"
            }`}
          >
            <Heart
              className="w-4 h-4"
              fill={optimisticLiked ? "currentColor" : "none"}
              strokeWidth={2}
            />
            <span>{optimisticCount}</span>
          </button>
        </div>
      )}

      {!isScheduled && (
      <section className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-600">
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
          コメント ({comments.length})
        </h3>

        <div className="space-y-3 mb-4">
          {comments.map((comment) => {
            const canDelete =
              isAdmin ||
              (currentUserId && comment.user_id === currentUserId);
            const commenterName =
              comment.profiles?.nickname?.trim() || "メンバー";
            return (
              <div
                key={comment.id}
                className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
              >
                <div className="shrink-0 w-8 h-8 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-600 flex items-center justify-center">
                  {comment.profiles?.avatar_url ? (
                    <Image
                      src={comment.profiles.avatar_url}
                      alt=""
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image
                      src="/mascot.png"
                      alt=""
                      width={32}
                      height={32}
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {commenterName}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                    {linkify(comment.content)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {new Date(comment.created_at).toLocaleString("ja-JP")}
                  </p>
                </div>
                {canDelete && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-xs text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 shrink-0"
                  >
                    削除
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSubmitComment} className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="コメントを入力..."
            className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-800"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !newComment.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50"
          >
            {loading ? "送信中..." : "送信"}
          </button>
        </form>
      </section>
      )}
    </article>
  );
}
