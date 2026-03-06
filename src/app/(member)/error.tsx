"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function MemberError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Member area error:", error);
  }, [error]);

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0f172a",
    padding: "1rem",
  };
  const cardStyle: React.CSSProperties = {
    maxWidth: "32rem",
    width: "100%",
    background: "#1e293b",
    borderRadius: "0.75rem",
    border: "1px solid #334155",
    padding: "2rem",
    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#e2e8f0", marginBottom: "1rem" }}>
          エラーが発生しました
        </h1>
        <p style={{ fontSize: "0.875rem", color: "#94a3b8", marginBottom: "1rem", fontFamily: "monospace", wordBreak: "break-all" }}>
          {error.message}
        </p>
        <p style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "1.5rem" }}>
          ブラウザの開発者ツール（F12）のコンソールにも詳細が表示されます。
        </p>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={reset}
            style={{
              padding: "0.5rem 1rem",
              background: "#6366f1",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            再試行
          </button>
          <Link
            href="/dashboard"
            style={{
              padding: "0.5rem 1rem",
              background: "#475569",
              color: "#e2e8f0",
              borderRadius: "0.5rem",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            ダッシュボードへ
          </Link>
        </div>
      </div>
    </div>
  );
}
