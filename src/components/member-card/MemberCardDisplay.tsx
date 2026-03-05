"use client";

import { useState, useEffect } from "react";

interface MemberCardDisplayProps {
  memberName: string;
  memberNumber: string;
  joinedAt: string;
}

export function MemberCardDisplay({
  memberName,
  memberNumber,
  joinedAt,
}: MemberCardDisplayProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatJoinedAt = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
    });
  };

  const formatNow = () => {
    return now.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  return (
    <div className="space-y-6">
      <div
        className="relative w-full max-w-sm mx-auto aspect-[1.6] rounded-2xl overflow-hidden shadow-xl"
        style={{
          backgroundImage: "url(/member-card-bg.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: "#0a1628",
        }}
      >
        {/* 下部のグラデーションオーバーレイ（テキストの可読性向上） */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, rgba(10, 22, 40, 0.6) 0%, transparent 60%)",
          }}
        />
        {/* 左上: 現年月日・時刻 */}
        <div
          className="absolute top-6 left-6 text-left"
          style={{ zIndex: 1 }}
        >
          <p className="text-xs font-medium text-white/80 tabular-nums">
            {formatNow()}
          </p>
        </div>
        {/* 右上: 名前・会員番号 */}
        <div
          className="absolute top-6 right-6 flex flex-col items-end text-right max-w-[55%]"
          style={{ zIndex: 1 }}
        >
          <h2 className="text-xl font-bold tracking-wider break-words text-white">
            {memberName}
          </h2>
          <p className="text-sm font-medium tracking-widest mt-1 text-white/90">
            会員番号: {memberNumber}
          </p>
        </div>

        <div className="absolute inset-0 flex flex-col justify-end p-6">
          {/* 右下: 入会年月 */}
          <div className="flex justify-end">
            <p className="text-xs font-medium text-white/80">
              入会年月: {formatJoinedAt(joinedAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
