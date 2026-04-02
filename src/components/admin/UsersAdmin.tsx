"use client";

import { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";

type User = {
  id: string;
  email: string;
  full_name: string;
  member_number: string;
  role: string;
  nickname: string | null;
  birthday: string | null;
  birthday_wish_name: string | null;
  created_at: string;
};

export function UsersAdmin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [memberNumber, setMemberNumber] = useState("");
  const [createdAt, setCreatedAt] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editMemberNumber, setEditMemberNumber] = useState("");
  const [editRole, setEditRole] = useState<"member" | "admin" | "poster">(
    "member"
  );
  const [editCreatedAt, setEditCreatedAt] = useState("");
  const [editBirthday, setEditBirthday] = useState("");
  const [resetPasswordResult, setResetPasswordResult] = useState<{
    email: string;
    newPassword: string;
  } | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResults, setImportResults] = useState<{
    results: { email: string; rowIndex?: number; success: boolean; error?: string; tempPassword?: string }[];
    summary: { success: number; failed: number; total: number };
  } | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<"member_number" | "created_at" | "full_name" | null>("created_at");
  const [sortAsc, setSortAsc] = useState(false);

  const fetchUsers = async () => {
    setListError(null);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users ?? []);
      } else {
        setListError(data.error ?? "アカウント一覧の取得に失敗しました");
        setUsers([]);
      }
    } catch {
      setListError("アカウント一覧の取得に失敗しました。接続を確認してください。");
      setUsers([]);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase().trim();
    return users.filter((u) =>
      [
        u.member_number,
        u.full_name,
        u.nickname ?? "",
        u.birthday_wish_name ?? "",
        u.email,
        u.role === "admin" ? "管理者" : u.role === "poster" ? "投稿者" : "メンバー",
      ].some((v) => v.toLowerCase().includes(q))
    );
  }, [users, searchQuery]);

  const sortedUsers = useMemo(() => {
    const list = [...filteredUsers];
    if (!sortKey) return list;
    list.sort((a, b) => {
      if (sortKey === "member_number") {
        const na = parseInt(a.member_number, 10);
        const nb = parseInt(b.member_number, 10);
        if (!isNaN(na) && !isNaN(nb)) {
          const cmp = na - nb;
          return sortAsc ? cmp : -cmp;
        }
        const cmp = a.member_number.localeCompare(b.member_number, "ja", { numeric: true });
        return sortAsc ? cmp : -cmp;
      }
      if (sortKey === "created_at") {
        const cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        return sortAsc ? cmp : -cmp;
      }
      if (sortKey === "full_name") {
        const cmp = a.full_name.localeCompare(b.full_name, "ja");
        return sortAsc ? cmp : -cmp;
      }
      return 0;
    });
    return list;
  }, [filteredUsers, sortKey, sortAsc]);

  const handleSort = (key: "member_number" | "created_at" | "full_name") => {
    if (sortKey === key) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName || undefined,
          member_number: memberNumber.trim() || undefined,
          created_at: createdAt || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "アカウント発行に失敗しました");
      }

      setSuccess(
        `アカウントを発行しました。${data.user.email} でログインできます。`
      );
      setEmail("");
      setPassword("");
      setFullName("");
      setMemberNumber("");
      setCreatedAt(new Date().toISOString().slice(0, 10));
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "アカウント発行に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateForInput = (dateStr: string) => {
    return new Date(dateStr).toISOString().slice(0, 10);
  };

  const handleResetPassword = async (userId: string, userEmail: string) => {
    if (!confirm("パスワードをリセットしますか？新しいパスワードが表示されます。")) return;
    setResetPasswordResult(null);
    try {
      const res = await fetch("/api/admin/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "リセットに失敗しました");
      setResetPasswordResult({ email: userEmail, newPassword: data.newPassword });
    } catch (err) {
      alert(err instanceof Error ? err.message : "リセットに失敗しました");
    }
  };

  const birthdayToInputValue = (b: string | null) =>
    b ? b.slice(0, 10) : "";

  const handleStartEdit = (u: User) => {
    setEditingUser(u);
    setEditMemberNumber(u.member_number);
    setEditRole(
      u.role === "admin" ? "admin" : u.role === "poster" ? "poster" : "member"
    );
    setEditCreatedAt(formatDateForInput(u.created_at));
    setEditBirthday(birthdayToInputValue(u.birthday));
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editingUser.id,
          member_number: editMemberNumber.trim(),
          role: editRole,
          created_at: editCreatedAt,
          birthday: editBirthday.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "更新に失敗しました");
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "更新に失敗しました");
    }
  };

  const handleDelete = async (u: User) => {
    if (
      !confirm(
        `「${u.full_name}」（${u.email}）のアカウントを削除しますか？この操作は取り消せません。`
      )
    )
      return;
    setDeletingUserId(u.id);
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: u.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "削除に失敗しました");
      setSuccess(`「${u.full_name}」のアカウントを削除しました`);
      setEditingUser((prev) => (prev?.id === u.id ? null : prev));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(u.id);
        return next;
      });
      fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "削除に失敗しました");
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === sortedUsers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedUsers.map((u) => u.id)));
    }
  };

  const handleToggleSelect = (userId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (
      !confirm(
        `選択した ${selectedIds.size} 件のアカウントを削除しますか？この操作は取り消せません。`
      )
    )
      return;
    setBulkDeleting(true);
    let successCount = 0;
    let failCount = 0;
    for (const id of Array.from(selectedIds)) {
      try {
        const res = await fetch("/api/admin/users", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: id }),
        });
        await res.json();
        if (res.ok) successCount++;
        else failCount++;
      } catch {
        failCount++;
      }
    }
    setBulkDeleting(false);
    setSelectedIds(new Set());
    setEditingUser(null);
    setSuccess(
      `一括削除完了: 成功 ${successCount}件${failCount > 0 ? `、失敗 ${failCount}件` : ""}`
    );
    fetchUsers();
  };

  const reiwaToIso = (s: string): string | undefined => {
    const m = s.trim().match(/令和\s*(\d+)\s*年\s*(\d+)\s*月/);
    if (!m) return undefined;
    const year = 2018 + parseInt(m[1], 10);
    const month = parseInt(m[2], 10);
    if (month < 1 || month > 12) return undefined;
    return `${year}-${String(month).padStart(2, "0")}-01`;
  };

  const parseExcel = async (
    file: File
  ): Promise<{ email: string; full_name?: string; member_number?: string; created_at?: string }[]> => {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 }) as string[][];
    if (data.length < 2) return [];
    const header = (data[0] ?? []).map((h) => String(h ?? "").replace(/\uFEFF/g, "").trim());
    const colMap: Record<string, number> = {};
    [
      "メールアドレス",
      "email",
      "Eメール",
      "メール",
      "メールアドレス（ログインID）",
      "お名前",
      "full_name",
      "氏名",
      "会員番号",
      "member_number",
      "入会年月",
      "created_at",
    ].forEach((name) => {
      const idx = header.findIndex(
        (h) => h.toLowerCase() === name.toLowerCase() || h.replace(/（.*?）/g, "").includes(name.replace(/（.*?）/g, ""))
      );
      if (idx >= 0) colMap[name] = idx;
    });
    const emailCol =
      colMap["メールアドレス"] ??
      colMap["メールアドレス（ログインID）"] ??
      colMap["email"] ??
      colMap["Eメール"] ??
      colMap["メール"] ??
      -1;
    // 氏名（姓）・氏名（名）を正確に区別（「氏名」の「名」に引っかからないよう括弧内で特定）
    const lastNameCol = header.findIndex((h) => /[（(]\s*姓\s*[）)]/.test(String(h)));
    const firstNameCol = header.findIndex((h) => /[（(]\s*名\s*[）)]/.test(String(h)));
    const fullNameCol = colMap["お名前"] ?? colMap["full_name"] ?? colMap["氏名"];
    const memberNumberCol = colMap["会員番号"] ?? colMap["member_number"];
    const createdAtCol = colMap["入会年月"] ?? colMap["created_at"] ?? header.findIndex((h) => /入会|年月/.test(String(h)));

    const rows: { email: string; full_name?: string; member_number?: string; created_at?: string }[] = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i] ?? [];
      const get = (col: number) => (col >= 0 && row[col] != null ? String(row[col]).replace(/\uFEFF/g, "").trim() : "");
      const email = get(emailCol);
      if (!email || !email.includes("@")) continue;
      let fullName: string | undefined;
      if (lastNameCol >= 0 && firstNameCol >= 0) {
        fullName = [get(lastNameCol), get(firstNameCol)].filter(Boolean).join(" ") || undefined;
      }
      if (!fullName && fullNameCol != null) fullName = get(fullNameCol) || undefined;
      const memberNumber = memberNumberCol >= 0 ? get(memberNumberCol) || undefined : undefined;
      let created_at: string | undefined;
      const rawCreated = createdAtCol >= 0 ? get(createdAtCol) : "";
      if (rawCreated) {
        created_at = reiwaToIso(rawCreated);
        if (!created_at) {
          const ym = rawCreated.match(/(\d{4})[-/]?(\d{1,2})/);
          if (ym) created_at = `${ym[1]}-${ym[2].padStart(2, "0")}-01`;
        }
        if (!created_at) {
          const d = new Date(rawCreated);
          if (!isNaN(d.getTime())) created_at = d.toISOString().slice(0, 10);
        }
      }
      rows.push({ email, full_name: fullName, member_number: memberNumber, created_at });
    }
    return rows;
  };

  const parseCsv = (text: string): { email: string; full_name?: string; member_number?: string; created_at?: string }[] => {
    const normalized = text.replace(/\uFEFF/g, ""); // BOM除去（Excel等で発生）
    const lines = normalized.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];
    const header = lines[0].split(/[,\t]/).map((h) => h.trim().replace(/^"|"$/g, "").replace(/\uFEFF/g, ""));
    const rows: { email: string; full_name?: string; member_number?: string; created_at?: string }[] = [];
    const colMap: Record<string, number> = {};
    ["メールアドレス", "email", "Eメール", "メール", "お名前", "full_name", "会員番号", "member_number", "入会年月", "created_at"].forEach((name) => {
      const idx = header.findIndex((h) =>
        h.replace(/\uFEFF/g, "").toLowerCase() === name.toLowerCase() || h.replace(/\uFEFF/g, "") === name
      );
      if (idx >= 0) colMap[name] = idx;
    });
    const emailCol =
      colMap["メールアドレス"] ?? colMap["email"] ?? colMap["Eメール"] ?? colMap["メール"] ?? 0;
    const fullNameCol = colMap["お名前"] ?? colMap["full_name"];
    const memberNumberCol = colMap["会員番号"] ?? colMap["member_number"];
    const createdAtCol = colMap["入会年月"] ?? colMap["created_at"];

    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split(/[,\t]/).map((c) =>
        c.trim().replace(/^"|"$/g, "").replace(/\uFEFF/g, "")
      );
      const email = cells[emailCol]?.trim().replace(/\uFEFF/g, "") ?? "";
      if (!email) continue;
      rows.push({
        email,
        full_name: fullNameCol != null && cells[fullNameCol] ? cells[fullNameCol].trim() : undefined,
        member_number: memberNumberCol != null && cells[memberNumberCol] ? cells[memberNumberCol].trim() : undefined,
        created_at: createdAtCol != null && cells[createdAtCol] ? cells[createdAtCol].trim() : undefined,
      });
    }
    return rows;
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImportLoading(true);
    setImportResults(null);
    setError(null);
    setSuccess(null);
    try {
      let rows: { email: string; full_name?: string; member_number?: string; created_at?: string }[];
      const isExcel = /\.xlsx?$/i.test(importFile.name);
      if (isExcel) {
        rows = await parseExcel(importFile);
      } else {
        const text = await importFile.text();
        rows = parseCsv(text);
      }
      if (rows.length === 0) {
        setError(
          isExcel
            ? "Excelファイルに有効なデータがありません。1行目はヘッダー、2行目以降にメールアドレスを含むデータを入力してください。"
            : "CSVファイルに有効なデータがありません。1行目はヘッダー、2行目以降にデータを入力してください。"
        );
        setImportLoading(false);
        return;
      }
      const res = await fetch("/api/admin/users/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "インポートに失敗しました");
      }
      setImportResults(data);
      setImportFile(null);
      setSuccess(`インポート完了: 成功 ${data.summary.success}件、失敗 ${data.summary.failed}件`);
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "インポートに失敗しました");
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* アカウント発行 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600 p-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
          アカウント発行
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          発行したメールアドレスとパスワードをメンバーに伝えてください。
          会員番号・入会年月の入力は任意です（未入力時は自動採番・本日登録）。発行されたアカウントでのみログインできます。
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm">
              {success}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                お名前（任意）
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-800"
                placeholder="山田 太郎"
              />
            </div>
            <div>
              <label
                htmlFor="memberNumber"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                会員番号（任意）
              </label>
              <input
                id="memberNumber"
                type="text"
                value={memberNumber}
                onChange={(e) => setMemberNumber(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-800"
                placeholder="M00001"
              />
            </div>
            <div>
              <label
                htmlFor="createdAt"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                入会年月
              </label>
              <input
                id="createdAt"
                type="date"
                value={createdAt}
                onChange={(e) => setCreatedAt(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-800"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                メールアドレス <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-800"
                placeholder="example@email.com"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                パスワード（6文字以上） <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-800"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "発行中..." : "アカウントを発行"}
          </button>
        </form>
      </div>

      {/* 一斉インポート */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600 p-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
          一斉インポート
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          CSVまたはExcel（.xlsx）ファイルからアカウントを一括登録できます。パスワードは password1234 で設定され、初回ログイン時に変更が必要です。1行目はヘッダー、2行目以降にデータを入力してください。Excelの場合は「会員番号」「氏名（姓）」「氏名（名）」「入会年月」「メールアドレス（ログインID）」などの列に対応。最大100件まで。
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <label className="cursor-pointer">
            <span className="inline-block px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
              ファイルを選択
            </span>
            <input
              type="file"
              accept=".csv,.txt,.xlsx,.xls"
              className="hidden"
              onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
            />
          </label>
          {importFile && (
            <>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {importFile.name}
              </span>
              <button
                type="button"
                onClick={handleImport}
                disabled={importLoading}
                className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {importLoading ? "インポート中..." : "インポート実行"}
              </button>
              <button
                type="button"
                onClick={() => setImportFile(null)}
                disabled={importLoading}
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                キャンセル
              </button>
            </>
          )}
        </div>
        {importResults && (
          <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
              結果: 成功 {importResults.summary.success}件 / 失敗 {importResults.summary.failed}件 / 合計 {importResults.summary.total}件
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              成功したアカウントは初回ログイン時に password1234 でログインし、パスワード変更が必要です。
            </p>
            {importResults.results.some((r) => !r.success) && (
              <ul className="text-sm text-red-600 dark:text-red-400 space-y-1 max-h-40 overflow-y-auto">
                {importResults.results
                  .filter((r) => !r.success)
                  .map((r, i) => (
                    <li key={i}>
                      {r.rowIndex != null ? `行${r.rowIndex}: ` : ""}
                      {r.email}: {r.error}
                    </li>
                  ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* アカウント一覧 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600 p-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
          アカウント一覧
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          パスワードは「リセット」で新しいパスワードを発行し表示します。会員番号・役割・登録日は「編集」で変更できます。不要なアカウントは「削除」で削除できます（取り消し不可）。一括削除する場合はチェックボックスで選択し「選択したアカウントを削除」をクリックしてください。
        </p>
        {!loadingList && !listError && users.length > 0 && (
          <div className="mb-4">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="会員番号・氏名・ニックネーム・メールアドレスで検索..."
              className="w-full max-w-md px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {searchQuery && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {filteredUsers.length}件表示
              </p>
            )}
          </div>
        )}
        {selectedIds.size > 0 && (
          <div className="mb-4 flex items-center gap-3">
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {bulkDeleting ? "削除中..." : `選択したアカウントを削除（${selectedIds.size}件）`}
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              disabled={bulkDeleting}
              className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              選択を解除
            </button>
          </div>
        )}
        {loadingList ? (
          <p className="text-slate-500 dark:text-slate-400">読み込み中...</p>
        ) : listError ? (
          <div className="space-y-2">
            <p className="text-red-600 dark:text-red-400">{listError}</p>
            <button
              type="button"
              onClick={() => {
                setLoadingList(true);
                fetchUsers();
              }}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              再試行
            </button>
          </div>
        ) : users.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">アカウントはまだありません</p>
        ) : filteredUsers.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">検索結果がありません。別のキーワードでお試しください。</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-600">
                  <th className="text-left py-3 px-4 font-medium text-slate-800 dark:text-slate-200 w-12">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={sortedUsers.length > 0 && selectedIds.size === sortedUsers.length}
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 dark:border-slate-600"
                      />
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        全てにチェック
                      </button>
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                    <button
                      type="button"
                      onClick={() => handleSort("member_number")}
                      className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      会員番号
                      {sortKey === "member_number" && (sortAsc ? " ↑" : " ↓")}
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                    <button
                      type="button"
                      onClick={() => handleSort("full_name")}
                      className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      氏名
                      {sortKey === "full_name" && (sortAsc ? " ↑" : " ↓")}
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                    ニックネーム
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                    誕生日
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                    お祝い用名前
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                    メールアドレス（ログインID）
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                    役割
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                    <button
                      type="button"
                      onClick={() => handleSort("created_at")}
                      className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      登録日
                      {sortKey === "created_at" && (sortAsc ? " ↑" : " ↓")}
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                    パスワード（リセット）
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100 dark:border-slate-700">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(u.id)}
                        onChange={() => handleToggleSelect(u.id)}
                        className="rounded border-slate-300 dark:border-slate-600"
                      />
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-800 dark:text-slate-200">
                      {editingUser?.id === u.id ? (
                        <input
                          type="text"
                          value={editMemberNumber}
                          onChange={(e) => setEditMemberNumber(e.target.value)}
                          className="w-24 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm dark:bg-slate-800"
                        />
                      ) : (
                        u.member_number
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-800 dark:text-slate-200">{u.full_name}</td>
                    <td className="py-3 px-4 text-slate-800 dark:text-slate-200">
                      {u.nickname || "—"}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      {editingUser?.id === u.id ? (
                        <input
                          type="date"
                          value={editBirthday}
                          onChange={(e) => setEditBirthday(e.target.value)}
                          className="w-[11rem] px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm dark:bg-slate-800"
                        />
                      ) : u.birthday ? (
                        new Date(u.birthday + "T00:00:00").toLocaleDateString(
                          "ja-JP"
                        )
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-800 dark:text-slate-200">
                      {u.birthday_wish_name || "—"}
                    </td>
                    <td className="py-3 px-4 text-slate-800 dark:text-slate-200">{u.email}</td>
                    <td className="py-3 px-4">
                      {editingUser?.id === u.id ? (
                        <select
                          value={editRole}
                          onChange={(e) =>
                            setEditRole(
                              e.target.value as "member" | "admin" | "poster"
                            )
                          }
                          className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm dark:bg-slate-800"
                        >
                          <option value="member">メンバー</option>
                          <option value="admin">管理者</option>
                          <option value="poster">投稿者</option>
                        </select>
                      ) : (
                        <span
                          className={
                            u.role === "admin"
                              ? "text-amber-600 dark:text-amber-400 font-medium"
                              : u.role === "poster"
                                ? "text-indigo-600 dark:text-indigo-400 font-medium"
                                : "text-slate-800 dark:text-slate-200"
                          }
                        >
                          {u.role === "admin"
                            ? "管理者"
                            : u.role === "poster"
                              ? "投稿者"
                              : "メンバー"}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      {editingUser?.id === u.id ? (
                        <input
                          type="date"
                          value={editCreatedAt}
                          onChange={(e) => setEditCreatedAt(e.target.value)}
                          className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm dark:bg-slate-800"
                        />
                      ) : (
                        formatDate(u.created_at)
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-xs">
                      {resetPasswordResult?.email === u.email ? (
                        <span className="flex items-center gap-2">
                          <span className="text-green-600 dark:text-green-400 font-mono">
                            {resetPasswordResult.newPassword}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              navigator.clipboard.writeText(
                                resetPasswordResult.newPassword
                              )
                            }
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-xs"
                          >
                            コピー
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleResetPassword(u.id, u.email)}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                        >
                          リセット
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {editingUser?.id === u.id ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleSaveEdit}
                            className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                          >
                            保存
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingUser(null)}
                            className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                          >
                            キャンセル
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 items-center">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(u)}
                            className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                          >
                            編集
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(u)}
                            disabled={deletingUserId === u.id}
                            className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium disabled:opacity-50"
                          >
                            {deletingUserId === u.id ? "削除中..." : "削除"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
