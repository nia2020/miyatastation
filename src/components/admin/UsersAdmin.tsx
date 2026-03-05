"use client";

import { useState, useEffect } from "react";

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
  const [resetPasswordResult, setResetPasswordResult] = useState<{
    email: string;
    newPassword: string;
  } | null>(null);

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

  const handleStartEdit = (u: User) => {
    setEditingUser(u);
    setEditMemberNumber(u.member_number);
    setEditRole(
      u.role === "admin" ? "admin" : u.role === "poster" ? "poster" : "member"
    );
    setEditCreatedAt(formatDateForInput(u.created_at));
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

  return (
    <div className="space-y-8">
      {/* アカウント発行 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600 p-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
          アカウント発行
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          発行したメールアドレスとパスワードを会員に伝えてください。
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

      {/* アカウント一覧 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600 p-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
          アカウント一覧
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          パスワードは「リセット」で新しいパスワードを発行し表示します。会員番号・役割・登録日は「編集」で変更できます。
        </p>
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-600">
                  <th className="text-left py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                    会員番号
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-slate-800">
                    お名前
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-slate-800">
                    ニックネーム
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-slate-800">
                    誕生日
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-slate-800">
                    お祝い用名前
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-slate-800">
                    メールアドレス
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-slate-800">
                    役割
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-slate-800">
                    登録日
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-slate-800">
                    パスワード
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-slate-800 dark:text-slate-200 w-24">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100 dark:border-slate-700">
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
                      {u.birthday
                        ? new Date(u.birthday).toLocaleDateString("ja-JP")
                        : "—"}
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
                          <option value="member">会員</option>
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
                              : "会員"}
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
                        <button
                          type="button"
                          onClick={() => handleStartEdit(u)}
                          className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                        >
                          編集
                        </button>
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
