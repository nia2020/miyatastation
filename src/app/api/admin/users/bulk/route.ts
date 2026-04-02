import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

type ImportRow = {
  email: string;
  password?: string;
  full_name?: string;
  member_number?: string;
  created_at?: string;
};

type ImportResult = {
  email: string;
  rowIndex: number;
  success: boolean;
  error?: string;
  tempPassword?: string;
  user?: { id: string; email: string; full_name: string };
};

const DEFAULT_IMPORT_PASSWORD = "password1234";

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

function normalizeEmail(input: string): string {
  return input
    .replace(/\uFEFF/g, "") // BOM除去
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // ゼロ幅文字除去
    .replace(/＠/g, "@") // 全角@ → 半角
    .replace(/．/g, ".") // 全角ピリオド → 半角
    .trim()
    .toLowerCase();
}

/**
 * 管理者がCSVから一斉インポートする API
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { rows } = body as { rows: ImportRow[] };

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json(
      { error: "インポートするデータがありません" },
      { status: 400 }
    );
  }

  if (rows.length > 100) {
    return NextResponse.json(
      { error: "一度にインポートできるのは100件までです" },
      { status: 400 }
    );
  }

  const results: ImportResult[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowIndex = i + 2; // 1行目ヘッダー + 0始まり → 行番号表示用
    const rawEmail = typeof row.email === "string" ? row.email : "";
    const email = normalizeEmail(rawEmail);

    if (!email) {
      results.push({
        email: rawEmail || "(未入力)",
        rowIndex,
        success: false,
        error: "メールアドレスは必須です",
      });
      continue;
    }

    if (!EMAIL_REGEX.test(email)) {
      results.push({
        email,
        rowIndex,
        success: false,
        error: "メールアドレス形式が不正です（全角文字・余分な空白がないか確認してください）",
      });
      continue;
    }

    const password = DEFAULT_IMPORT_PASSWORD;

    const memberNumber =
      row.member_number && typeof row.member_number === "string"
        ? row.member_number.trim()
        : null;
    const fullName =
      row.full_name && typeof row.full_name === "string"
        ? row.full_name.trim() || "メンバー"
        : "メンバー";

    let createdAt: string | null = null;
    if (row.created_at) {
      const d = new Date(row.created_at);
      if (!isNaN(d.getTime())) createdAt = d.toISOString();
    }

    try {
      const admin = createAdminClient();
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
        },
      });

      if (error) {
        if (error.message.includes("already been registered")) {
          results.push({
            email,
            rowIndex,
            success: false,
            error: "このメールアドレスは既に登録されています",
          });
        } else {
          results.push({
            email,
            rowIndex,
            success: false,
            error: error.message.includes("invalid format")
              ? "メールアドレス形式が不正です（全角文字・余分な空白がないか確認してください）"
              : error.message,
          });
        }
        continue;
      }

      const profileUpdates: {
        member_number?: string;
        created_at?: string;
        must_change_password?: boolean;
        updated_at: string;
      } = { updated_at: new Date().toISOString(), must_change_password: true };
      if (memberNumber) profileUpdates.member_number = memberNumber;
      if (createdAt) profileUpdates.created_at = createdAt;

      const { error: updateError } = await admin
        .from("profiles")
        .update(profileUpdates)
        .eq("id", data.user.id);

      if (updateError) {
        if (updateError.code === "23505") {
          results.push({
            email,
            rowIndex,
            success: false,
            error: "この会員番号は既に使用されています",
          });
        } else {
          results.push({
            email,
            rowIndex,
            success: false,
            error: "プロフィール更新に失敗しました",
          });
        }
        continue;
      }

      results.push({
        email,
        rowIndex,
        success: true,
        tempPassword: password,
        user: {
          id: data.user.id,
          email: data.user.email ?? email,
          full_name: fullName,
        },
      });
    } catch (err) {
      console.error("Bulk import error for", email, err);
      results.push({
        email,
        rowIndex,
        success: false,
        error: "アカウント発行中にエラーが発生しました",
      });
    }
  }

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  return NextResponse.json({
    results,
    summary: { success: successCount, failed: failCount, total: rows.length },
  });
}
