"use client";

import { useState } from "react";
import type { Event } from "@/types/database";

interface EventCardProps {
  event: Event;
  isPast?: boolean;
}

export function EventCard({ event, isPast }: EventCardProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo",
      dateStyle: "full",
      timeStyle: "short",
    });
  };

  return (
    <div
      id={event.id}
      className={`p-6 rounded-xl border ${
        isPast
          ? "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-600 opacity-75"
          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 shadow-sm"
      }`}
    >
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">{event.title}</h3>
      <p className="mt-1 text-slate-600 dark:text-slate-400">{formatDate(event.event_date)}</p>
      {event.description && (
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{event.description}</p>
      )}

      {!isPast && (
        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg space-y-3">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">入室情報</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-sm text-slate-600 dark:text-slate-400 break-all font-mono">
                {event.zoom_url}
              </span>
              <button
                onClick={() => copyToClipboard(event.zoom_url, "url")}
                className="shrink-0 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-medium hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
              >
                {copied === "url" ? "コピーしました" : "コピー"}
              </button>
            </div>
            {event.zoom_meeting_id && (
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm text-slate-600 dark:text-slate-400 font-mono">
                  ID: {event.zoom_meeting_id}
                </span>
                <button
                  onClick={() =>
                    copyToClipboard(event.zoom_meeting_id!, "meeting")
                  }
                  className="shrink-0 px-3 py-1.5 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                >
                  {copied === "meeting" ? "コピーしました" : "コピー"}
                </button>
              </div>
            )}
            {event.zoom_passcode && (
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm text-slate-600 dark:text-slate-400 font-mono">
                  パスコード: {event.zoom_passcode}
                </span>
                <button
                  onClick={() =>
                    copyToClipboard(event.zoom_passcode!, "passcode")
                  }
                  className="shrink-0 px-3 py-1.5 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                >
                  {copied === "passcode" ? "コピーしました" : "コピー"}
                </button>
              </div>
            )}
          </div>
          <a
            href={event.zoom_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors"
          >
            Zoomで参加する
            <span aria-hidden>→</span>
          </a>
        </div>
      )}
    </div>
  );
}
