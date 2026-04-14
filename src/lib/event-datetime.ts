/**
 * イベント日時: 管理画面の datetime-local（タイムゾーンなし）は日本時間の壁時計として解釈する。
 * UTC サーバーで new Date("YYYY-MM-DDTHH:mm") すると UTC として解釈され、表示が9時間ずれる不具合の対策。
 */

const DATETIME_LOCAL_RE =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

/** POST /api/admin/events の event_date を DB 用 ISO UTC に正規化 */
export function normalizeEventDateInputToIso(input: string): string {
  const trimmed = input.trim();
  const m = trimmed.match(DATETIME_LOCAL_RE);
  if (m && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(trimmed)) {
    const sec = m[6] ?? "00";
    const withOffset = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${sec}+09:00`;
    return new Date(withOffset).toISOString();
  }
  return new Date(trimmed).toISOString();
}

/** DB の timestamptz を datetime-local の value 用（日本時間の YYYY-MM-DDTHH:mm）に変換 */
export function eventDateIsoToDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  return d
    .toLocaleString("sv-SE", { timeZone: "Asia/Tokyo" })
    .replace(" ", "T")
    .slice(0, 16);
}

/**
 * いまのカレンダー日付（Asia/Tokyo）の 0:00 を表す瞬間を ISO UTC で返す。
 * イベント一覧は「その日付が終わるまで」予定側に残す（日付が変わったら過去へ）。
 */
export function getStartOfTodayJstIso(): string {
  const jstDateStr = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Tokyo",
  });
  return new Date(`${jstDateStr}T00:00:00+09:00`).toISOString();
}

/** 新規イベントの既定日時: 今日（JST）の 21:00 */
export function getDefaultEventDatetimeLocalJst(): string {
  const d = new Date();
  const datePart = d
    .toLocaleString("sv-SE", { timeZone: "Asia/Tokyo" })
    .slice(0, 10);
  return `${datePart}T21:00`;
}
