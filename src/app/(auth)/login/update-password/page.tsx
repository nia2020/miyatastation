"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function UpdatePasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      // PKCE フロー: URL に code がある場合は auth/callback で交換してから戻る
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        if (code) {
          const callbackUrl = `/auth/callback?code=${encodeURIComponent(code)}&next=/login/update-password`;
          window.location.replace(callbackUrl);
          return;
        }
      }

      const supabase = createClient();

      // Implicit フロー: ハッシュからトークン処理を待つ
      await new Promise((resolve) => setTimeout(resolve, 300));

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login?error=recovery_expired");
        return;
      }

      setReady(true);
      setChecking(false);
    };

    init();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }
    if (newPassword.length < 6) {
      setError("パスワードは6文字以上で入力してください");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        throw error;
      }

      await supabase.auth.signOut();
      router.replace("/login?message=password_updated");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "パスワードの変更に失敗しました"
      );
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <p className="text-slate-500 dark:text-slate-400">確認中...</p>
      </div>
    );
  }

  if (!ready) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-8 border border-slate-200 dark:border-slate-700">
          <div className="flex justify-center mb-6">
            <Image
              src="/logo.png"
              alt="Miyata Station"
              width={200}
              height={67}
              className="h-16 w-auto"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-center mb-2 text-slate-800 dark:text-slate-200">
            新しいパスワードを設定
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-6">
            新しいパスワードを入力してください。
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                新しいパスワード（6文字以上）
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-800"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                新しいパスワード（確認）
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-800"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "設定中..." : "パスワードを設定"}
            </button>
          </form>

          <p className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              ログインページに戻る
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
