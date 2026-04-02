"use client";

import { useState } from "react";
import type { Event } from "@/types/database";
import {
  eventDateIsoToDatetimeLocalValue,
  getDefaultEventDatetimeLocalJst,
} from "@/lib/event-datetime";
import { isEventDeletable } from "@/lib/events";

interface EventsAdminProps {
  events: Event[];
}

export function EventsAdmin({ events }: EventsAdminProps) {
  const [eventList, setEventList] = useState(events);
  const [editing, setEditing] = useState<Event | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);

  const createEmptyForm = () => ({
    title: "",
    event_date: getDefaultEventDatetimeLocalJst(),
    zoom_url: "",
    zoom_meeting_id: "",
    zoom_passcode: "",
  });

  const [formData, setFormData] = useState(createEmptyForm);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editing
            ? { ...formData, id: editing.id }
            : formData
        ),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "保存に失敗しました");
      }

      const { event } = await res.json();
      if (editing) {
        setEventList((prev) =>
          prev.map((e) => (e.id === event.id ? event : e))
        );
      } else {
        setEventList((prev) => [event, ...prev]);
      }
      setEditing(null);
      setIsCreating(false);
      setFormData(createEmptyForm());
    } catch (err) {
      alert(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("このイベントを削除しますか？")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/events", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "削除に失敗しました");
      }

      setEventList((prev) => prev.filter((e) => e.id !== id));
      setEditing(null);
      setIsCreating(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "削除に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (event: Event) => {
    setEditing(event);
    setIsCreating(false);
    setFormData({
      title: event.title,
      event_date: eventDateIsoToDatetimeLocalValue(event.event_date),
      zoom_url: event.zoom_url,
      zoom_meeting_id: event.zoom_meeting_id ?? "",
      zoom_passcode: event.zoom_passcode ?? "",
    });
  };

  const startCreate = () => {
    setEditing(null);
    setIsCreating(true);
    setFormData(createEmptyForm());
  };

  const cancel = () => {
    setEditing(null);
    setIsCreating(false);
    setFormData(createEmptyForm());
  };

  return (
    <div className="space-y-6">
      <button
        onClick={startCreate}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
      >
        新規イベント追加
      </button>

      {(editing || isCreating) && (
        <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 space-y-4">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">
            {editing ? "イベント編集" : "新規イベント"}
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
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                日時
              </label>
              <input
                type="datetime-local"
                value={formData.event_date}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, event_date: e.target.value }))
                }
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Zoom URL
              </label>
              <input
                type="url"
                value={formData.zoom_url}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, zoom_url: e.target.value }))
                }
                required
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                ミーティングID
              </label>
              <input
                type="text"
                value={formData.zoom_meeting_id}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    zoom_meeting_id: e.target.value,
                  }))
                }
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                パスコード
              </label>
              <input
                type="text"
                value={formData.zoom_passcode}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, zoom_passcode: e.target.value }))
                }
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={loading || !formData.title || !formData.zoom_url}
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
        {eventList.map((event) => (
          <div
            key={event.id}
            className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600 flex justify-between items-start"
          >
            <div>
              <h3 className="font-medium text-slate-800 dark:text-slate-200">{event.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {new Date(event.event_date).toLocaleString("ja-JP", {
                  timeZone: "Asia/Tokyo",
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => startEdit(event)}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
              >
                編集
              </button>
              {isEventDeletable(event.event_date) ? (
                <button
                  onClick={() => handleDelete(event.id)}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                >
                  削除
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="text-sm text-slate-400 dark:text-slate-500 cursor-not-allowed"
                  title="イベント日時の翌日 0:00 以降に削除可能です"
                >
                  削除
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
