"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, BellOff } from "lucide-react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationSettings() {
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refreshSubscriptionState = useCallback(async () => {
    if (!vapidPublic || typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      setSubscribed(!!sub);
    } catch {
      setSubscribed(false);
    }
  }, [vapidPublic]);

  useEffect(() => {
    const ok =
      !!vapidPublic.trim() &&
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setSupported(ok);
    void refreshSubscriptionState();
  }, [vapidPublic, refreshSubscriptionState]);

  const enable = async () => {
    setMessage(null);
    if (!supported || !vapidPublic) return;
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setMessage(
          "通知が許可されませんでした。ブラウザまたは OS の設定で通知をオンにしてください。"
        );
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublic),
      });
      const json = sub.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "登録に失敗しました");
      }
      setSubscribed(true);
      setMessage(
        "登録しました。新しい投稿は全員に、コメントは投稿者に通知されます（フィード・MK ROOM）。"
      );
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "登録に失敗しました"
      );
    } finally {
      setLoading(false);
    }
  };

  const disable = async () => {
    setMessage(null);
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        const res = await fetch(
          `/api/push/subscribe?endpoint=${encodeURIComponent(endpoint)}`,
          { method: "DELETE" }
        );
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "解除に失敗しました");
        }
      } else {
        const res = await fetch("/api/push/subscribe", { method: "DELETE" });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "解除に失敗しました");
        }
      }
      setSubscribed(false);
      setMessage("プッシュ通知をオフにしました。");
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "解除に失敗しました"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!vapidPublic.trim()) {
    return (
      <div className="max-w-md rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Bell className="h-4 w-4 shrink-0" />
          プッシュ通知
        </h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          本番環境で VAPID キー（環境変数）が設定されると、ここから通知の登録ができます。
        </p>
      </div>
    );
  }

  if (!supported) {
    return (
      <div className="max-w-md rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Bell className="h-4 w-4 shrink-0" />
          プッシュ通知
        </h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          お使いのブラウザはプッシュ通知に対応していないか、この接続では利用できません（HTTPS
          の本番 URL でお試しください）。
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
        <Bell className="h-4 w-4 shrink-0" />
        プッシュ通知
      </h3>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        新しい投稿は全員に、あなたの投稿へのコメントはあなたにだけプッシュします（フィード・MK
        ROOM）。コメントは「お知らせ」ページにも一覧表示されます。Android の Chromeや PC
        の Chrome などで利用しやすいです。iPhone
        はホーム画面に追加した Web アプリなど、環境によっては通知できないことがあります。
      </p>
      {message && (
        <div className="mt-3 rounded-lg bg-slate-100 dark:bg-slate-700/80 p-3 text-sm text-slate-700 dark:text-slate-300">
          {message}
        </div>
      )}
      <div className="mt-4">
        {subscribed ? (
          <button
            type="button"
            onClick={() => void disable()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 disabled:opacity-50"
          >
            <BellOff className="h-4 w-4" />
            {loading ? "処理中..." : "通知をオフにする"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void enable()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <Bell className="h-4 w-4" />
            {loading ? "登録中..." : "通知を許可して登録する"}
          </button>
        )}
      </div>
    </div>
  );
}
