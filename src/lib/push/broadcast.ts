import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type AdminSupabase = SupabaseClient<Database>;

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

type SubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

type WebPushPayload = {
  title: string;
  body: string;
  url: string;
  /** Notification tag for OS grouping */
  tag?: string;
};

async function sendPushPayloadToRows(
  admin: AdminSupabase,
  rows: SubscriptionRow[],
  payload: WebPushPayload
): Promise<void> {
  const payloadJson = JSON.stringify(payload);
  const staleIds: string[] = [];

  for (const row of rows) {
    try {
      await webpush.sendNotification(
        {
          endpoint: row.endpoint,
          keys: { p256dh: row.p256dh, auth: row.auth },
        },
        payloadJson,
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

/** Web Push to subscribers matching user_ids; stale subscriptions removed. */
export async function sendWebPushToUserIds(params: {
  userIds: string[];
  title: string;
  body: string;
  url: string;
  tag?: string;
}): Promise<void> {
  if (!configureWebPush() || params.userIds.length === 0) {
    return;
  }

  let admin: AdminSupabase;
  try {
    admin = createAdminClient();
  } catch {
    return;
  }

  const { data: rows, error } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .in("user_id", params.userIds);

  if (error || !rows?.length) {
    return;
  }

  await sendPushPayloadToRows(admin, rows, {
    title: params.title,
    body: params.body,
    url: params.url,
    ...(params.tag ? { tag: params.tag } : {}),
  });
}

/**
 * Broadcast new admin post to all subscribers; stale subscriptions removed.
 * No-op when VAPID keys are unset.
 */
export async function broadcastNewAdminPostPush(params: {
  title: string;
  channel: "feed" | "mk-room";
  postId?: string;
}): Promise<void> {
  if (!configureWebPush()) {
    return;
  }

  let admin: AdminSupabase;
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
  const basePath =
    params.channel === "mk-room" ? "/dashboard/mk-room" : "/dashboard/chat";
  const qs = params.postId
    ? `?post=${encodeURIComponent(params.postId)}`
    : "";
  const path = `${basePath}${qs}`;
  const openUrl = siteUrl ? `${siteUrl}${path}` : path;
  const placeLabel = params.channel === "mk-room" ? "MK ROOM" : "フィード";
  const postTitle = String(params.title).trim();
  const title = `${placeLabel}：新しい投稿`;
  const body =
    postTitle.length > 0
      ? `「${postTitle}」が公開されました`.slice(0, 180)
      : "新しい投稿が公開されました";

  await sendPushPayloadToRows(admin, rows, {
    title,
    body,
    url: openUrl,
    tag: params.postId
      ? `miyata-new-post-${params.postId}`
      : `miyata-new-post-${params.channel}`,
  });
}
