import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = formData.get("email") as string | null;
  const password = formData.get("password") as string | null;
  const redirectTo = (formData.get("redirect") as string) || "/dashboard";

  if (!email || !password) {
    return NextResponse.redirect(
      new URL(`/login?error=メールアドレスとパスワードを入力してください`, request.url),
      302
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const params = new URLSearchParams({
      error: error.message,
      email: email,
    });
    return NextResponse.redirect(
      new URL(`/login?${params.toString()}`, request.url),
      302
    );
  }

  return NextResponse.redirect(new URL(redirectTo, request.url), 302);
}
