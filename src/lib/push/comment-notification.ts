import { createAdminClient } from "@/lib/supabase/admin";
import { sendWebPushToUserIds } from "@/lib/push/broadcast";

function oneLinePreview(text: string, max: number): string {
  const s = text.trim().replace(/\s+/g, " ");
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

/**
 * コメント投稿後、投稿者本人以外からのコメントなら投稿者に Web Push とアプリ内お知らせを送る。
 */
export async function notifyPostAuthorOfNewComment(params: {
  postId: string;
  commenterUserId: string;
  commentText: string;
}): Promise<void> {
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return;
  }

  const { data: post, error: postError } = await admin
    .from("admin_posts")
    .select("author_id, title, channel")
    .eq("id", params.postId)
    .maybeSingle();

  if (postError || !post) {
    return;
  }

  if (post.author_id === params.commenterUserId) {
    return;
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("nickname, full_name, avatar_url")
    .eq("id", params.commenterUserId)
    .maybeSingle();

  const commenterName =
    profile?.nickname?.trim() ||
    profile?.full_name?.trim() ||
    "\u30e1\u30f3\u30d0\u30fc";

  const rawAvatar = profile?.avatar_url?.trim() ?? "";
  const actorAvatarUrl =
    rawAvatar.startsWith("https://") || rawAvatar.startsWith("http://")
      ? rawAvatar
      : null;

  const titleText = (post.title ?? "").trim();
  const titleShort =
    titleText.length > 80 ? `${titleText.slice(0, 80)}…` : titleText;

  const preview = oneLinePreview(params.commentText, 100);

  const channel = post.channel === "mk-room" ? "mk-room" : "feed";
  const placeLabel = channel === "mk-room" ? "MK ROOM" : "フィード";
  const basePath =
    channel === "mk-room" ? "/dashboard/mk-room" : "/dashboard/chat";
  const linkPath = `${basePath}?post=${encodeURIComponent(params.postId)}`;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const openUrl = siteUrl ? `${siteUrl}${linkPath}` : linkPath;

  // Push: who + channel + preview in body
  const pushTitle = `${commenterName}さんが${placeLabel}でコメント`.slice(
    0,
    64
  );
  const pushBody =
    `あなたの投稿「${titleShort}」\n「${preview}」`.slice(0, 220);

  await sendWebPushToUserIds({
    userIds: [post.author_id],
    title: pushTitle,
    body: pushBody,
    url: openUrl,
    tag: `miyata-comment-${params.postId}-${Date.now()}`,
    ...(actorAvatarUrl ? { image: actorAvatarUrl } : {}),
  });

  const { error: insertError } = await admin.from("user_notifications").insert({
    user_id: post.author_id,
    kind: "comment_on_post",
    actor_id: params.commenterUserId,
    actor_display_name: commenterName,
    actor_avatar_url: actorAvatarUrl,
    post_id: params.postId,
    post_title: titleText.slice(0, 500),
    comment_preview: preview.slice(0, 500),
    link_path: linkPath,
  });

  if (insertError) {
    console.error("user_notifications insert:", insertError);
  }
}
