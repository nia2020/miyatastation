import { createAdminClient } from "@/lib/supabase/admin";
import { sendWebPushToUserIds } from "@/lib/push/broadcast";

/**
 * コメント投稿後、投稿者本人以外からのコメントなら投稿者にのみ Web Push を送る。
 */
export async function notifyPostAuthorOfNewComment(params: {
  postId: string;
  commenterUserId: string;
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
    .select("nickname, full_name")
    .eq("id", params.commenterUserId)
    .maybeSingle();

  const commenterName =
    profile?.nickname?.trim() ||
    profile?.full_name?.trim() ||
    "\u30e1\u30f3\u30d0\u30fc";

  const titleText = (post.title ?? "").trim();
  const titleShort =
    titleText.length > 42 ? `${titleText.slice(0, 42)}…` : titleText;

  const channel = post.channel === "mk-room" ? "mk-room" : "feed";
  const placeLabel = channel === "mk-room" ? "MK ROOM" : "フィード";
  const pushTitle = `${placeLabel}：あなたの投稿にコメント`.slice(0, 64);
  const body =
    `${commenterName}さんが「${titleShort}」に書き込みました`.slice(0, 180);

  const basePath =
    channel === "mk-room" ? "/dashboard/mk-room" : "/dashboard/chat";
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const relativePath = `${basePath}?post=${encodeURIComponent(params.postId)}`;
  const openUrl = siteUrl ? `${siteUrl}${relativePath}` : relativePath;

  await sendWebPushToUserIds({
    userIds: [post.author_id],
    title: pushTitle,
    body,
    url: openUrl,
    tag: `miyata-comment-${params.postId}-${Date.now()}`,
  });
}
