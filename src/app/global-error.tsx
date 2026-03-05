"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, padding: "2rem", fontFamily: "sans-serif", background: "#0f172a", color: "#e2e8f0" }}>
        <div style={{ maxWidth: "32rem", margin: "0 auto" }}>
          <h1 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>
            エラーが発生しました
          </h1>
          <pre style={{
            padding: "1rem",
            background: "#1e293b",
            borderRadius: "0.5rem",
            overflow: "auto",
            fontSize: "0.875rem",
            marginBottom: "1rem",
          }}>
            {error.message}
          </pre>
          <p style={{ fontSize: "0.875rem", color: "#94a3b8", marginBottom: "1rem" }}>
            ターミナル（npm run dev）にも詳細が表示されます。
          </p>
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
        </div>
      </body>
    </html>
  );
}
