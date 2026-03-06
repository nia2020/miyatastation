import { createClient } from "@/lib/supabase/server";
import { ArchiveVideosAdmin } from "@/components/admin/ArchiveVideosAdmin";

export default async function AdminArchiveVideosPage() {
  const supabase = await createClient();
  const { data: videos } = await supabase
    .from("archive_videos")
    .select("*")
    .order("published_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
          アーカイブ動画管理
        </h2>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          YouTubeリンクと公開期間の設定。期間終了後は自動で非表示になります。
        </p>
      </div>

      <ArchiveVideosAdmin videos={videos ?? []} />
    </div>
  );
}
