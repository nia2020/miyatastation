"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import html2canvas from "html2canvas";
import { Download } from "lucide-react";

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
  const [isCapturing, setIsCapturing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

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

  // 入会年数（月で判定）
  // 例：2025年2月23日入会 → 2026年2月1日から2年目、2027年2月1日から3年目、2029年2月1日から5年目
  const membershipYear = (() => {
    const joined = new Date(joinedAt);
    const oneYearLater = new Date(
      joined.getFullYear() + 1,
      joined.getMonth(),
      1
    );
    const twoYearsLater = new Date(
      joined.getFullYear() + 2,
      joined.getMonth(),
      1
    );
    const threeYearsLater = new Date(
      joined.getFullYear() + 3,
      joined.getMonth(),
      1
    );
    const fiveYearsLater = new Date(
      joined.getFullYear() + 5,
      joined.getMonth(),
      1
    );
    if (now < oneYearLater) return 1; // 1年未満
    if (now < twoYearsLater) return 2; // 2年目
    if (now < threeYearsLater) return 3; // 3年目
    if (now < fiveYearsLater) return 4; // 4年目
    return 5; // 5年目以降
  })();

  // 1年未満: 緑、2年目: 濃紺、3-4年目: 赤、5年目以降: 元のデザイン
  const cardConfig =
    membershipYear === 1
      ? {
          bgImage: "url(/member-card-bg-green.png)",
          bgColor: "#2d543e",
          gradient:
            "linear-gradient(to top, rgba(45, 84, 62, 0.6) 0%, transparent 60%)",
        }
      : membershipYear === 2
        ? {
            bgImage: "url(/member-card-bg-blue.png)",
            bgColor: "#0a1628",
            gradient:
              "linear-gradient(to top, rgba(10, 22, 40, 0.6) 0%, transparent 60%)",
          }
        : membershipYear === 3 || membershipYear === 4
          ? {
              bgImage: "url(/member-card-bg-red.png)",
              bgColor: "#c41e3a",
              gradient:
                "linear-gradient(to top, rgba(196, 30, 58, 0.6) 0%, transparent 60%)",
            }
          : {
              bgImage: "url(/member-card-bg.png)",
              bgColor: "#0a1628",
              gradient:
                "linear-gradient(to top, rgba(10, 22, 40, 0.6) 0%, transparent 60%)",
            };

  const handleDownload = useCallback(async () => {
    const el = cardRef.current;
    if (!el) return;
    setIsCapturing(true);
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 100)));
    try {
      const canvas = await html2canvas(el, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: cardConfig.bgColor,
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `会員証-${memberNumber}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setIsCapturing(false);
    }
  }, [memberNumber, cardConfig.bgColor]);

  return (
    <div className="space-y-6">
      <div
        ref={cardRef}
        className="relative w-full max-w-sm mx-auto aspect-[1.6] rounded-2xl overflow-hidden transition-all duration-300"
        style={{
          backgroundImage: cardConfig.bgImage,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: cardConfig.bgColor,
          border: "1px solid rgba(255, 250, 240, 0.12)",
          boxShadow:
            "0 6px 12px -2px rgba(0, 0, 0, 0.4), 0 14px 28px -4px rgba(0, 0, 0, 0.5), 0 30px 60px -8px rgba(0, 0, 0, 0.55), 0 40px 80px -16px rgba(0, 0, 0, 0.6)",
          transform: "translateY(-2px)",
        }}
      >
        {/* 下部のグラデーションオーバーレイ（テキストの可読性向上） */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: cardConfig.gradient,
          }}
        />
        {/* キラキラシマーエフェクト（キャプチャ時は非表示） */}
        {!isCapturing && (
          <div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            style={{ zIndex: 1 }}
          >
            <div
              className="absolute top-0 left-0 w-1/2 h-full opacity-30"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%)",
                animation: "member-card-shimmer 3s ease-in-out infinite",
              }}
            />
          </div>
        )}
        {/* 左上: 現年月日・時刻 */}
        <div
          className="absolute top-6 left-6 text-left"
          style={{ zIndex: 1 }}
        >
          <p className="text-xs font-medium text-white/80 tabular-nums">
            {formatNow()}
          </p>
        </div>
        {/* 右上: 名前 */}
        <div
          className="absolute top-6 right-6 flex flex-col items-end text-right max-w-[55%]"
          style={{ zIndex: 1 }}
        >
          <h2 className="text-sm font-bold tracking-wider break-words text-white">
            {memberName}
          </h2>
        </div>

        <div className="absolute inset-0 flex flex-col justify-end p-6">
          {/* 下部: 左下に会員番号、右下に入会年月 */}
          <div className="flex justify-between items-end">
            <span
              className="font-mono text-sm font-bold tracking-[0.2em] text-white"
              style={{
                textShadow: "0 0 8px rgba(255, 250, 240, 0.3)",
              }}
            >
              No. {memberNumber}
            </span>
            <p className="text-xs font-medium text-white/80">
              入会年月: {formatJoinedAt(joinedAt)}
            </p>
          </div>
        </div>
      </div>
      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleDownload}
          disabled={isCapturing}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="h-4 w-4" />
          {isCapturing ? "作成中..." : "画像をダウンロード"}
        </button>
      </div>
    </div>
  );
}
