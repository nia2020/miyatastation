/** user_notifications テーブル未作成・スキーマ未反映のときの PostgREST / Postgres エラー */
export function isUserNotificationsTableMissing(error: {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}): boolean {
  const code = String(error.code ?? "");
  const msg = `${error.message ?? ""} ${error.details ?? ""} ${error.hint ?? ""}`.toLowerCase();
  if (code === "PGRST205") return true;
  if (code === "42P01") return true;
  if (!msg.includes("user_notifications")) return false;
  return (
    msg.includes("schema cache") ||
    msg.includes("does not exist") ||
    msg.includes("could not find") ||
    msg.includes("undefined table")
  );
}
