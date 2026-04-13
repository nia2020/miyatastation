"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

/** URL の `?post=UUID` に対応する投稿カードへスクロールする */
export function ScrollToFeedPost() {
  const searchParams = useSearchParams();
  const postId = searchParams.get("post");

  useEffect(() => {
    if (!postId) return;
    const id = requestAnimationFrame(() => {
      const el = document.getElementById(`feed-post-${postId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => cancelAnimationFrame(id);
  }, [postId]);

  return null;
}
