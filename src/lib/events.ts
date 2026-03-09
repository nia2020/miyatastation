/**
 * イベント日時の翌日 0:00（日本時間）を過ぎたかどうかを判定
 * 例: 2026/3/25 21:00 のイベント → 2026/3/26 0:00 以降に削除可能
 */
export function isEventDeletable(eventDate: string): boolean {
  const d = new Date(eventDate);
  const jstDateStr = d.toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" });
  const [y, m, day] = jstDateStr.split("-").map(Number);
  const nextDay = new Date(Date.UTC(y, m - 1, day + 1));
  const y2 = nextDay.getUTCFullYear();
  const m2 = String(nextDay.getUTCMonth() + 1).padStart(2, "0");
  const d2 = String(nextDay.getUTCDate()).padStart(2, "0");
  const deletableAt = new Date(`${y2}-${m2}-${d2}T00:00:00+09:00`);
  return new Date() >= deletableAt;
}
