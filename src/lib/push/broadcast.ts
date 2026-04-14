import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

function configureWebPush(): boolean {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject =
    process.env.VAPID_SUBJECT?.trim() || "mailto:noreply@example.com";
  if (!publicKey?.trim() || !privateKey?.trim()) {
    return false;
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

/**
 * 新規管理者投稿の Web Push をすべての購読端末へ送信（失効した購読は削除）。
 * VAPID が未設定のときは何もしない。
 */
export async function broadcastNewAdminPostPush(params: {
  title: string;
  channel: "feed" | "mk-room";
}): Promise<void> {
  if (!configureWebPush()) {
    return;
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return;
  }

  const { data: rows, error } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth");

  if (error || !rows?.length) {
    return;
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const path =
    params.channel === "mk-room" ? "/dashboard/mk-room" : "/dashboard/chat";
  const openUrl = siteUrl ? `${siteUrl}${path}` : path;
  const prefix = params.channel === "mk-room" ? "MK ROOM" : "フィード";
  const body = `${prefix}: ${params.title}`.slice(0, 180);
  const payload = JSON.stringify({
    title: "ミヤタステーション",
    body,
    url: openUrl,
  });

  const staleIds: string[] = [];

  for (const row of rows) {
    try {
      await webpush.sendNotification(
        {
          endpoint: row.endpoint,
          keys: { p256dh: row.p256dh, auth: row.auth },
        },
        payload,
        { TTL: 60 * 60 }
      );
    } catch (err: unknown) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        staleIds.push(row.id);
      } else {
        console.error("Web Push send error:", err);
      }
    }
  }

  if (staleIds.length > 0) {
    await admin.from("push_subscriptions").delete().in("id", staleIds);
  }
}
