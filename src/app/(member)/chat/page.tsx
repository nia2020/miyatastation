import { createClient } from "@/lib/supabase/server";
import { ChatPost } from "@/components/chat/ChatPost";
import { ChatPostForm } from "@/components/chat/ChatPostForm";

export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: posts } = await supabase
    .from("admin_posts")
    .select(
      `
      *,
      comments:post_comments(
        id,
        post_id,
        user_id,
        content,
        created_at,
        profiles(full_name)
      )
    `
    )
    .order("created_at", { ascending: false });

  const authorIds = [...new Set(posts?.map((p) => p.author_id) ?? [])];
  const { data: authorProfiles } =
    authorIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", authorIds)
      : { data: [] };
  const authorMap = Object.fromEntries(
    authorProfiles?.map((p) => [p.id, p.full_name]) ?? []
  );

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single()
    : { data: null };

  const commentsOrdered =
    posts?.map((p) => ({
      ...p,
      comments:
        (p.comments as Array<{
          id: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at: string;
          profiles: { full_name: string } | null;
        }>)?.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ) ?? [],
    })) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">お知らせ・チャット</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          {profile?.role === "admin" || profile?.role === "poster"
            ? "お知らせを投稿し、会員のコメントを確認できます"
            : "お知らせを確認し、コメントでやり取りできます"}
        </p>
      </div>

      {(profile?.role === "admin" || profile?.role === "poster") && (
        <ChatPostForm />
      )}

      {commentsOrdered.length > 0 ? (
        <div className="space-y-6">
          {commentsOrdered.map((post) => (
            <ChatPost
              key={post.id}
              post={post}
              authorName={authorMap[post.author_id]}
              currentUserFullName={profile?.full_name}
              currentUserId={user?.id}
              isAdmin={profile?.role === "admin"}
              isPoster={profile?.role === "poster"}
            />
          ))}
        </div>
      ) : (
        <div className="p-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 text-center text-slate-600 dark:text-slate-400">
          まだお知らせはありません
        </div>
      )}
    </div>
  );
}
