"use client";

import type { ArchiveVideo } from "@/types/database";

function extractYoutubeVideoId(url: string): string | null {
  // https://www.youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];
  // https://youtu.be/VIDEO_ID
  const shortMatch = url.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  // https://www.youtube.com/embed/VIDEO_ID
  const embedMatch = url.match(/(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];
  return null;
}

interface ArchiveVideoCardProps {
  video: ArchiveVideo;
}

export function ArchiveVideoCard({ video }: ArchiveVideoCardProps) {
  const videoId = extractYoutubeVideoId(video.youtube_url);

  if (!videoId) {
    return (
      <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600">
        <h3 className="font-semibold text-slate-800 dark:text-slate-200">{video.title}</h3>
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          無効なYouTube URLです
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800">
      <div className="aspect-video w-full">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-slate-800 dark:text-slate-200">{video.title}</h3>
        {video.expires_at && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            公開期限: {new Date(video.expires_at).toLocaleDateString("ja-JP")}
          </p>
        )}
      </div>
    </div>
  );
}
