import { createClient } from "@/lib/supabase/server";
import type { ArchiveVideo } from "@/types/database";
import { ArchiveVideoCard } from "@/components/archive/ArchiveVideoCard";

export const dynamic = "force-dynamic";

export default async function ArchiveVideosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const now = new Date().toISOString();

  const { data: videos } = await supabase
    .from("archive_videos")
    .select("*")
    .lte("published_at", now)
    .or(`expires_at.is.null,expires_at.gte.${now}`)
    .order("published_at", { ascending: false });

  const activeVideos = (videos ?? []) as ArchiveVideo[];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
        アーカイブ動画
      </h2>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        期間限定で公開中の動画です。公開期間が終了すると自動で非表示になります。
      </p>
      {activeVideos.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {activeVideos.map((video) => (
            <ArchiveVideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : (
        <div className="p-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 text-center text-slate-600 dark:text-slate-400">
          現在公開中の動画はありません
        </div>
      )}
    </div>
  );
}
