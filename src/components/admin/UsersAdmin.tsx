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
  must_change_password?: boolean;
};

type EditRole = "member" | "management_member" | "admin" | "poster";

function roleLabel(role: string): string {
  if (role === "admin") return "管理者";
  if (role === "poster") return "投稿者";
  if (role === "management_member") return "管理メンバー";
  return "メンバー";
}

function roleToEditRole(role: string): EditRole {
  if (role === "admin" || role === "poster" || role === "management_member") {
    return role;
  }
  return "member";
}

/** 管理画面・投稿・管理メンバーなど、会員一覧とは別枠で扱うアカウント */
function isManagementAccount(role: string): boolean {
  return (
    role === "admin" ||
    role === "poster" ||
    role === "management_member"
  );
}

function sortUsersByKey(
  list: User[],
  sortKey: "member_number" | "created_at" | "full_name" | null,
  sortAsc: boolean
): User[] {
  const next = [...list];
  if (!sortKey) return next;
  next.sort((a, b) => {
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
  return next;
}

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
  const [editRole, setEditRole] = useState<EditRole>("member");
  const [editCreatedAt, setEditCreatedAt] = useState("");
  const [editBirthday, setEditBirthday] = useState("");
  const [editNickname, setEditNickname] = useState("");
  const [editBirthdayWishName, setEditBirthdayWishName] = useState("");
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
        roleLabel(u.role),
      ].some((v) => v.toLowerCase().includes(q))
    );
  }, [users, searchQuery]);

  const filteredManagementUsers = useMemo(
    () => filteredUsers.filter((u) => isManagementAccount(u.role)),
    [filteredUsers]
  );

  const filteredMemberUsers = useMemo(
    () => filteredUsers.filter((u) => !isManagementAccount(u.role)),
    [filteredUsers]
  );

  const sortedManagementUsers = useMemo(
    () => sortUsersByKey(filteredManagementUsers, sortKey, sortAsc),
    [filteredManagementUsers, sortKey, sortAsc]
  );

  const sortedMemberUsers = useMemo(
    () => sortUsersByKey(filteredMemberUsers, sortKey, sortAsc),
    [filteredMemberUsers, sortKey, sortAsc]
  );

  const userStats = useMemo(() => {
    let admin = 0;
    let poster = 0;
    let managementMember = 0;
    let member = 0;
    let pendingFirstLogin = 0;
    for (const u of users) {
      if (u.must_change_password === true) pendingFirstLogin += 1;
      if (u.role === "admin") admin += 1;
      else if (u.role === "poster") poster += 1;
      else if (u.role === "management_member") managementMember += 1;
      else member += 1;
    }
    return {
      total: users.length,
      admin,
      poster,
      managementStaff: admin + poster,
      managementMember,
      member,
      pendingFirstLogin,
    };
  }, [users]);

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
    setEditRole(roleToEditRole(u.role));
    setEditCreatedAt(formatDateForInput(u.created_at));
    setEditBirthday(birthdayToInputValue(u.birthday));
    setEditNickname(u.nickname ?? "");
    setEditBirthdayWishName(u.birthday_wish_name ?? "");
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
          nickname: editNickname.trim() || null,
          birthday_wish_name: editBirthdayWishName.trim() || null,
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

  const handleSelectAllInList = (list: User[]) => {
    const allSelected =
      list.length > 0 && list.every((u) => selectedIds.has(u.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        list.forEach((u) => next.delete(u.id));
      } else {
        list.forEach((u) => next.add(u.id));
      }
      return next;
    });
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

  const roleBadgeClass = (role: string) =>
    role === "admin"
      ? "text-amber-600 dark:text-amber-400 font-medium"
      : role === "poster"
        ? "text-indigo-600 dark:text-indigo-400 font-medium"
        : role === "management_member"
          ? "text-teal-700 dark:text-teal-400 font-medium"
          : "text-slate-800 dark:text-slate-200";

  const renderAccountRow = (u: User) => (
    <tr key={u.id} className="border-b border-slate-100 dark:border-slate-700">
      <td className="py-2 pl-2 pr-1 align-top w-9">
        <input
          type="checkbox"
          checked={selectedIds.has(u.id)}
          onChange={() => handleToggleSelect(u.id)}
          className="rounded border-slate-300 dark:border-slate-600 mt-1"
        />
      </td>
      <td className="py-2 px-1 font-mono text-slate-800 dark:text-slate-200 align-top whitespace-nowrap text-xs w-[4.5rem]">
        {editingUser?.id === u.id ? (
          <input
            type="text"
            value={editMemberNumber}
            onChange={(e) => setEditMemberNumber(e.target.value)}
            className="w-full min-w-0 px-1.5 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm dark:bg-slate-800"
          />
        ) : (
          u.member_number
        )}
      </td>
      <td className="py-2 px-1 text-slate-800 dark:text-slate-200 align-top min-w-0 break-words">
        {u.full_name}
      </td>
      <td className="py-2 px-1 text-slate-800 dark:text-slate-200 align-top min-w-0 break-words text-xs xl:text-sm">
        {editingUser?.id === u.id ? (
          <input
            type="text"
            value={editNickname}
            onChange={(e) => setEditNickname(e.target.value)}
            placeholder="未設定"
            className="w-full min-w-0 px-1.5 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm dark:bg-slate-800"
          />
        ) : (
          u.nickname || "—"
        )}
      </td>
      <td className="py-2 px-1 text-slate-700 dark:text-slate-300 align-top whitespace-nowrap text-xs">
        {editingUser?.id === u.id ? (
          <input
            type="date"
            value={editBirthday}
            onChange={(e) => setEditBirthday(e.target.value)}
            className="max-w-full px-1 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm dark:bg-slate-800"
          />
        ) : u.birthday ? (
          new Date(u.birthday + "T00:00:00").toLocaleDateString("ja-JP", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        ) : (
          "—"
        )}
      </td>
      <td className="py-2 px-1 text-slate-800 dark:text-slate-200 align-top min-w-0 break-words text-xs xl:text-sm">
        {editingUser?.id === u.id ? (
          <input
            type="text"
            value={editBirthdayWishName}
            onChange={(e) => setEditBirthdayWishName(e.target.value)}
            placeholder="未設定"
            className="w-full min-w-0 px-1.5 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm dark:bg-slate-800"
          />
        ) : (
          u.birthday_wish_name || "—"
        )}
      </td>
      <td className="py-2 px-1 text-slate-800 dark:text-slate-200 align-top min-w-0 break-all text-xs">
        {u.email}
      </td>
      <td className="py-2 px-1 align-top min-w-0">
        {editingUser?.id === u.id ? (
          <select
            value={editRole}
            onChange={(e) => setEditRole(e.target.value as EditRole)}
            className="max-w-full min-w-0 px-1 py-1 border border-slate-300 dark:border-slate-600 rounded text-xs dark:bg-slate-800"
          >
            <option value="member">メンバー</option>
            <option value="management_member">管理メンバー</option>
            <option value="admin">管理者</option>
            <option value="poster">投稿者</option>
          </select>
        ) : (
          <span className={`text-xs xl:text-sm ${roleBadgeClass(u.role)}`}>
            {roleLabel(u.role)}
          </span>
        )}
      </td>
      <td className="py-2 px-1 text-slate-700 dark:text-slate-300 align-top whitespace-nowrap text-xs">
        {u.must_change_password === true ? (
          <span className="text-amber-700 dark:text-amber-400 font-medium">未完了</span>
        ) : (
          <span className="text-slate-500 dark:text-slate-400">完了</span>
        )}
      </td>
      <td className="py-2 px-1 text-slate-700 dark:text-slate-300 align-top whitespace-nowrap text-xs">
        {editingUser?.id === u.id ? (
          <input
            type="date"
            value={editCreatedAt}
            onChange={(e) => setEditCreatedAt(e.target.value)}
            className="max-w-full px-1 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm dark:bg-slate-800"
          />
        ) : (
          formatDate(u.created_at)
        )}
      </td>
      <td className="py-2 px-1 text-slate-600 dark:text-slate-400 align-top text-xs">
        {resetPasswordResult?.email === u.email ? (
          <span className="flex flex-col gap-1 min-w-0">
            <span className="text-green-600 dark:text-green-400 font-mono break-all">
              {resetPasswordResult.newPassword}
            </span>
            <button
              type="button"
              onClick={() =>
                navigator.clipboard.writeText(resetPasswordResult.newPassword)
              }
              className="text-indigo-600 dark:text-indigo-400 hover:underline text-left w-fit"
            >
              コピー
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => handleResetPassword(u.id, u.email)}
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            リセット
          </button>
        )}
      </td>
      <td className="py-2 pr-2 pl-1 align-top whitespace-nowrap">
        {editingUser?.id === u.id ? (
          <div className="flex flex-col gap-1 items-start">
            <button
              type="button"
              onClick={handleSaveEdit}
              className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
            >
              保存
            </button>
            <button
              type="button"
              onClick={() => setEditingUser(null)}
              className="text-sm text-slate-500 dark:text-slate-400 hover:underline"
            >
              キャンセル
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-1 items-start">
            <button
              type="button"
              onClick={() => handleStartEdit(u)}
              className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
            >
              編集
            </button>
            <button
              type="button"
              onClick={() => handleDelete(u)}
              disabled={deletingUserId === u.id}
              className="text-sm text-red-600 dark:text-red-400 font-medium hover:underline disabled:opacity-50"
            >
              {deletingUserId === u.id ? "削除中..." : "削除"}
            </button>
          </div>
        )}
      </td>
    </tr>
  );

  const renderAccountCard = (u: User) => (
    <div
      key={u.id}
      className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/60 p-4 space-y-3 shadow-sm"
    >
      <div className="flex justify-between gap-3 items-start">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-800 dark:text-slate-200">{u.full_name}</p>
          <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
            {u.member_number}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300 break-all mt-2">{u.email}</p>
        </div>
        <input
          type="checkbox"
          checked={selectedIds.has(u.id)}
          onChange={() => handleToggleSelect(u.id)}
          className="rounded border-slate-300 dark:border-slate-600 shrink-0 mt-1"
        />
      </div>

      {editingUser?.id !== u.id && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
          <span>
            <span className="text-slate-500">ニックネーム:</span> {u.nickname || "—"}
          </span>
          <span>
            <span className="text-slate-500">誕生日:</span>{" "}
            {u.birthday
              ? new Date(u.birthday + "T00:00:00").toLocaleDateString("ja-JP")
              : "—"}
          </span>
          <span>
            <span className="text-slate-500">呼ばれたい名前:</span> {u.birthday_wish_name || "—"}
          </span>
          <span>
            <span className="text-slate-500">役割: </span>
            <span className={roleBadgeClass(u.role)}>{roleLabel(u.role)}</span>
          </span>
          <span>
            <span className="text-slate-500">初回ログイン:</span>{" "}
            {u.must_change_password === true ? (
              <span className="text-amber-700 dark:text-amber-400 font-medium">未完了</span>
            ) : (
              "完了"
            )}
          </span>
          <span>
            <span className="text-slate-500">登録:</span> {formatDate(u.created_at)}
          </span>
        </div>
      )}

      {editingUser?.id === u.id && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
          <label className="block text-xs">
            <span className="text-slate-500 block mb-1">会員番号</span>
            <input
              type="text"
              value={editMemberNumber}
              onChange={(e) => setEditMemberNumber(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-800"
            />
          </label>
          <label className="block text-xs">
            <span className="text-slate-500 block mb-1">ニックネーム</span>
            <input
              type="text"
              value={editNickname}
              onChange={(e) => setEditNickname(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-800"
            />
          </label>
          <label className="block text-xs">
            <span className="text-slate-500 block mb-1">誕生日</span>
            <input
              type="date"
              value={editBirthday}
              onChange={(e) => setEditBirthday(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-800"
            />
          </label>
          <label className="block text-xs sm:col-span-2">
            <span className="text-slate-500 block mb-1">呼ばれたい名前</span>
            <input
              type="text"
              value={editBirthdayWishName}
              onChange={(e) => setEditBirthdayWishName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-800"
            />
          </label>
          <label className="block text-xs sm:col-span-2">
            <span className="text-slate-500 block mb-1">役割</span>
            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value as EditRole)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-800"
            >
              <option value="member">メンバー</option>
              <option value="management_member">管理メンバー</option>
              <option value="admin">管理者</option>
              <option value="poster">投稿者</option>
            </select>
          </label>
          <label className="block text-xs sm:col-span-2">
            <span className="text-slate-500 block mb-1">登録日</span>
            <input
              type="date"
              value={editCreatedAt}
              onChange={(e) => setEditCreatedAt(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-800"
            />
          </label>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
        {resetPasswordResult?.email === u.email ? (
          <span className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-mono text-green-600 dark:text-green-400 break-all">
              {resetPasswordResult.newPassword}
            </span>
            <button
              type="button"
              onClick={() =>
                navigator.clipboard.writeText(resetPasswordResult.newPassword)
              }
              className="text-indigo-600 dark:text-indigo-400 text-sm font-medium"
            >
              コピー
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => handleResetPassword(u.id, u.email)}
            className="text-sm text-indigo-600 dark:text-indigo-400 font-medium"
          >
            パスワードリセット
          </button>
        )}
        {editingUser?.id === u.id ? (
          <>
            <button
              type="button"
              onClick={handleSaveEdit}
              className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold"
            >
              保存
            </button>
            <button
              type="button"
              onClick={() => setEditingUser(null)}
              className="text-sm text-slate-500 dark:text-slate-400"
            >
              キャンセル
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => handleStartEdit(u)}
              className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold"
            >
              編集
            </button>
            <button
              type="button"
              onClick={() => handleDelete(u)}
              disabled={deletingUserId === u.id}
              className="text-sm text-red-600 dark:text-red-400 font-medium disabled:opacity-50"
            >
              {deletingUserId === u.id ? "削除中..." : "削除"}
            </button>
          </>
        )}
      </div>
    </div>
  );

  const AccountsTable = ({
    rows,
    selectAllScope,
  }: {
    rows: User[];
    selectAllScope: User[];
  }) => (
    <>
      <p className="mb-3 text-xs text-slate-500 dark:text-slate-400 lg:hidden">
        狭い画面ではカード表示します。一覧表は大きな画面（1024px以上）で表示されます。
      </p>
      <div className="lg:hidden space-y-3">
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50/80 dark:bg-slate-900/40 px-3 py-2">
          <input
            type="checkbox"
            checked={
              selectAllScope.length > 0 &&
              selectAllScope.every((u) => selectedIds.has(u.id))
            }
            onChange={() => handleSelectAllInList(selectAllScope)}
            className="rounded border-slate-300 dark:border-slate-600"
          />
          <button
            type="button"
            onClick={() => handleSelectAllInList(selectAllScope)}
            className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
          >
            この一覧の全てにチェック
          </button>
          <div className="flex gap-2 text-xs text-slate-500 dark:text-slate-400 w-full sm:w-auto sm:ml-auto">
            <button
              type="button"
              onClick={() => handleSort("member_number")}
              className="hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              会員番号{sortKey === "member_number" && (sortAsc ? "↑" : "↓")}
            </button>
            <button
              type="button"
              onClick={() => handleSort("full_name")}
              className="hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              氏名{sortKey === "full_name" && (sortAsc ? "↑" : "↓")}
            </button>
            <button
              type="button"
              onClick={() => handleSort("created_at")}
              className="hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              登録日{sortKey === "created_at" && (sortAsc ? "↑" : "↓")}
            </button>
          </div>
        </div>
        {rows.map((u) => renderAccountCard(u))}
      </div>

      <div className="hidden lg:block rounded-xl border border-slate-200 dark:border-slate-600 overflow-hidden">
        <div className="overflow-x-auto max-w-full min-w-0">
          <table className="w-full max-w-full text-sm table-fixed">
            <colgroup>
              <col className="w-[2rem]" />
              <col className="w-[4.5rem]" />
              <col className="w-[9%]" />
              <col className="w-[8%]" />
              <col className="w-[5.5rem]" />
              <col className="w-[10%]" />
              <col className="w-[18%]" />
              <col className="w-[7rem]" />
              <col className="w-[4rem]" />
              <col className="w-[6.5rem]" />
              <col className="w-[5.5rem]" />
              <col className="w-[4.5rem]" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-600 bg-slate-50/90 dark:bg-slate-900/50">
                <th className="text-left py-2 pl-2 pr-1 font-medium text-slate-800 dark:text-slate-200 align-top">
                  <div className="flex flex-col items-start gap-1">
                    <input
                      type="checkbox"
                      checked={
                        selectAllScope.length > 0 &&
                        selectAllScope.every((u) => selectedIds.has(u.id))
                      }
                      onChange={() => handleSelectAllInList(selectAllScope)}
                      className="rounded border-slate-300 dark:border-slate-600"
                      title="一覧を選択"
                    />
                    <button
                      type="button"
                      onClick={() => handleSelectAllInList(selectAllScope)}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline leading-none"
                    >
                      全て
                    </button>
                  </div>
                </th>
                <th className="text-left py-2 px-1 font-medium text-slate-800 dark:text-slate-200 align-bottom">
                  <button
                    type="button"
                    onClick={() => handleSort("member_number")}
                    className="text-left leading-tight hover:text-indigo-600 dark:hover:text-indigo-400 text-xs"
                  >
                    会員番号
                    {sortKey === "member_number" && (sortAsc ? " ↑" : " ↓")}
                  </button>
                </th>
                <th className="text-left py-2 px-1 font-medium text-slate-800 dark:text-slate-200 align-bottom">
                  <button
                    type="button"
                    onClick={() => handleSort("full_name")}
                    className="text-left leading-tight hover:text-indigo-600 dark:hover:text-indigo-400 text-xs"
                  >
                    氏名
                    {sortKey === "full_name" && (sortAsc ? " ↑" : " ↓")}
                  </button>
                </th>
                <th className="text-left py-2 px-1 font-medium text-slate-800 dark:text-slate-200 text-xs align-bottom">
                  ニックネーム
                </th>
                <th className="text-left py-2 px-1 font-medium text-slate-800 dark:text-slate-200 text-xs align-bottom whitespace-nowrap">
                  誕生日
                </th>
                <th className="text-left py-2 px-1 font-medium text-slate-800 dark:text-slate-200 text-xs align-bottom leading-tight">
                  呼ばれたい名前
                </th>
                <th className="text-left py-2 px-1 font-medium text-slate-800 dark:text-slate-200 text-xs align-bottom">
                  メール
                </th>
                <th className="text-left py-2 px-1 font-medium text-slate-800 dark:text-slate-200 text-xs align-bottom whitespace-nowrap">
                  役割
                </th>
                <th className="text-left py-2 px-1 font-medium text-slate-800 dark:text-slate-200 text-xs align-bottom leading-tight">
                  初回
                  <br />
                  ログイン
                </th>
                <th className="text-left py-2 px-1 font-medium text-slate-800 dark:text-slate-200 align-bottom">
                  <button
                    type="button"
                    onClick={() => handleSort("created_at")}
                    className="text-left leading-tight hover:text-indigo-600 dark:hover:text-indigo-400 text-xs"
                  >
                    登録日
                    {sortKey === "created_at" && (sortAsc ? " ↑" : " ↓")}
                  </button>
                </th>
                <th className="text-left py-2 px-1 font-medium text-slate-800 dark:text-slate-200 text-xs align-bottom leading-tight">
                  パスワード
                </th>
                <th className="text-left py-2 pr-2 pl-1 font-medium text-slate-800 dark:text-slate-200 text-xs align-bottom whitespace-nowrap">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>{rows.map((u) => renderAccountRow(u))}</tbody>
          </table>
        </div>
      </div>
    </>
  );

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
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600 p-6 min-w-0 max-w-full">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
          アカウント一覧
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          上から「管理系」（管理者・投稿者・管理メンバー）、下が「会員」（一般メンバー）です。パスワードは「リセット」で新しいパスワードを発行し表示します。会員番号・ニックネーム・誕生日・呼ばれたい名前・役割・登録日は「編集」で変更できます。不要なアカウントは「削除」で削除できます（取り消し不可）。一括削除する場合はチェックボックスで選択し「選択したアカウントを削除」をクリックしてください。
        </p>
        {!loadingList && !listError && users.length > 0 && (
          <>
            <div className="mb-4 flex flex-wrap gap-x-6 gap-y-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
              <span>
                <span className="font-medium text-slate-800 dark:text-slate-200">合計</span>
                <span className="ml-1.5 tabular-nums">{userStats.total}件</span>
              </span>
              <span>
                <span className="font-medium text-slate-800 dark:text-slate-200">管理ユーザー</span>
                <span className="ml-1.5 tabular-nums">
                  {userStats.managementStaff}件（管理者 {userStats.admin}・投稿者 {userStats.poster}）
                </span>
              </span>
              <span>
                <span className="font-medium text-slate-800 dark:text-slate-200">管理メンバー</span>
                <span className="ml-1.5 tabular-nums">{userStats.managementMember}件</span>
                <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">（メンバーと同じ権限）</span>
              </span>
              <span>
                <span className="font-medium text-slate-800 dark:text-slate-200">メンバー</span>
                <span className="ml-1.5 tabular-nums">{userStats.member}件</span>
              </span>
              <span>
                <span className="font-medium text-slate-800 dark:text-slate-200">初回ログイン未完了</span>
                <span className="ml-1.5 tabular-nums">{userStats.pendingFirstLogin}件</span>
                <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">
                  （パスワード未変更）
                </span>
              </span>
            </div>
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
                  管理系 {filteredManagementUsers.length}件 / 会員 {filteredMemberUsers.length}件（合計{" "}
                  {filteredUsers.length}件）
                </p>
              )}
            </div>
          </>
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
        ) : (
          <div className="space-y-10">
            <div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">
                管理系アカウント一覧
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                管理者・投稿者・管理メンバー
                {searchQuery.trim() ? (
                  <>
                    {" "}
                    <span className="tabular-nums">（検索結果 {filteredManagementUsers.length}件）</span>
                  </>
                ) : (
                  <>
                    {" "}
                    <span className="tabular-nums">
                      （全 {userStats.managementStaff + userStats.managementMember}件）
                    </span>
                  </>
                )}
              </p>
              {sortedManagementUsers.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 py-3 border border-dashed border-slate-200 dark:border-slate-600 rounded-lg px-4">
                  {searchQuery.trim()
                    ? "検索条件に一致する管理系アカウントはありません。"
                    : "管理系アカウントはまだ登録されていません。"}
                </p>
              ) : (
                <AccountsTable
                  rows={sortedManagementUsers}
                  selectAllScope={sortedManagementUsers}
                />
              )}
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">
                会員アカウント一覧
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                一般メンバー
                {searchQuery.trim() ? (
                  <>
                    {" "}
                    <span className="tabular-nums">（検索結果 {filteredMemberUsers.length}件）</span>
                  </>
                ) : (
                  <>
                    {" "}
                    <span className="tabular-nums">（全 {userStats.member}件）</span>
                  </>
                )}
              </p>
              {sortedMemberUsers.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 py-3 border border-dashed border-slate-200 dark:border-slate-600 rounded-lg px-4">
                  {searchQuery.trim()
                    ? "検索条件に一致する会員はありません。"
                    : "一般会員はまだ登録されていません。"}
                </p>
              ) : (
                <AccountsTable
                  rows={sortedMemberUsers}
                  selectAllScope={sortedMemberUsers}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
