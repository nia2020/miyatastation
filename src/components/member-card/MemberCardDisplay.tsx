"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Download } from "lucide-react";

const OUTPUT_WIDTH = 1920;
const OUTPUT_HEIGHT = 1200;
const CARD_WIDTH = 384;

const LOGO_PATH = "/member-card-logo.png";

/** 入会からの経過に応じた「年次」1〜5（現在日時ベース） */
function computeMembershipYear(now: Date, joinedAt: string): 1 | 2 | 3 | 4 | 5 {
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
  if (now < oneYearLater) return 1;
  if (now < twoYearsLater) return 2;
  if (now < threeYearsLater) return 3;
  if (now < fiveYearsLater) return 4;
  return 5;
}

const TIER_LABELS: Record<number, string> = {
  1: "1年未満",
  2: "2年目",
  3: "3年目",
  4: "4年目",
  5: "5年目以降",
};

function bgColorForMemberTier(tier: 1 | 2 | 3 | 4 | 5): string {
  if (tier === 1) return "#2d543e";
  if (tier === 2) return "#1a365d";
  if (tier === 3 || tier === 4) return "#c41e3a";
  return "#000000";
}

interface MemberCardDisplayProps {
  memberName: string;
  memberNumber: string;
  joinedAt: string;
  role?: "member" | "management_member" | "admin" | "poster";
}

export function MemberCardDisplay({
  memberName,
  memberNumber,
  joinedAt,
  role = "member",
}: MemberCardDisplayProps) {
  const [now, setNow] = useState(() => new Date());
  const [isCapturing, setIsCapturing] = useState(false);
  const [downloadDesign, setDownloadDesign] = useState<
    "gold" | 1 | 2 | 3 | 4 | 5 | undefined
  >(undefined);
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

  const membershipYear = computeMembershipYear(now, joinedAt);

  const isPrivileged =
    role === "admin" || role === "poster" || role === "management_member";

  /** プレビュー・ダウンロードに使うデザイン（未指定時は現在の年次・または特権ロールならゴールド） */
  const effectiveDesign: "gold" | 1 | 2 | 3 | 4 | 5 =
    downloadDesign ?? (isPrivileged ? "gold" : membershipYear);

  // ゴールド: 管理者・管理メンバー・投稿者用。それ以外は年次ごとの会員カラー。
  const cardConfig =
    effectiveDesign === "gold"
      ? { bgColor: "#d4af37" }
      : { bgColor: bgColorForMemberTier(effectiveDesign) };

  const drawCardToCanvas = useCallback(
    async (ctx: CanvasRenderingContext2D) => {
      const w = OUTPUT_WIDTH;
      const h = OUTPUT_HEIGHT;
      const scale = w / CARD_WIDTH;

      ctx.fillStyle = cardConfig.bgColor;
      ctx.fillRect(0, 0, w, h);

      const logoImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = LOGO_PATH;
      });

      const imgAspect = logoImg.width / logoImg.height;
      const cardAspect = w / h;
      let imgW: number, imgH: number, imgX: number, imgY: number;
      if (imgAspect > cardAspect) {
        imgW = w;
        imgH = w / imgAspect;
        imgX = 0;
        imgY = (h - imgH) / 2;
      } else {
        imgH = h;
        imgW = h * imgAspect;
        imgX = (w - imgW) / 2;
        imgY = 0;
      }
      ctx.drawImage(logoImg, imgX, imgY, imgW, imgH);

      const gradient = ctx.createLinearGradient(0, h, 0, 0);
      gradient.addColorStop(0, "rgba(0,0,0,0.5)");
      gradient.addColorStop(0.5, "transparent");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(255, 255, 255, 1)";
      ctx.font = `700 ${Math.round(14 * scale)}px sans-serif`;
      const nameX = w - 24 * scale;
      ctx.fillText(memberName, nameX, 24 * scale);

      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.font = `700 ${Math.round(14 * scale)}px monospace`;
      ctx.fillText(`No. ${memberNumber}`, 24 * scale, h - 24 * scale);
    },
    [cardConfig.bgColor, memberName, memberNumber]
  );

  const downloadFileStem =
    effectiveDesign === "gold"
      ? `会員証-${memberNumber}-ゴールド`
      : `会員証-${memberNumber}-${TIER_LABELS[effectiveDesign]}`;

  const handleDownload = useCallback(async () => {
    setIsCapturing(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_WIDTH;
      canvas.height = OUTPUT_HEIGHT;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setIsCapturing(false);
        return;
      }
      await drawCardToCanvas(ctx);
      const link = document.createElement("a");
      link.download = `${downloadFileStem}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("会員証の生成に失敗しました:", err);
    } finally {
      setIsCapturing(false);
    }
  }, [memberNumber, drawCardToCanvas, downloadFileStem]);

  const renderCardContent = (showShimmer: boolean) => (
    <>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)",
        }}
      />
      {showShimmer && (
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
      <div className="absolute top-6 left-6 text-left" style={{ zIndex: 1 }}>
        <p className="text-xs font-medium text-white/80 tabular-nums">
          {formatNow()}
        </p>
      </div>
      <div
        className="absolute top-6 right-6 flex flex-col items-end text-right max-w-[55%]"
        style={{ zIndex: 1 }}
      >
        <h2 className="text-sm font-bold tracking-wider break-words text-white">
          {memberName}
        </h2>
      </div>
      <div className="absolute inset-0 flex flex-col justify-end p-6">
        <div className="flex justify-between items-end">
          <span
            className="font-mono text-sm font-bold tracking-[0.2em] text-white"
            style={{ textShadow: "0 0 8px rgba(255, 250, 240, 0.3)" }}
          >
            No. {memberNumber}
          </span>
          <p className="text-xs font-medium text-white/80">
            入会年月: {formatJoinedAt(joinedAt)}
          </p>
        </div>
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      <div
        ref={cardRef}
        className="relative w-full max-w-sm mx-auto aspect-[1.6] rounded-2xl overflow-hidden transition-all duration-300"
        style={{
          backgroundColor: cardConfig.bgColor,
          backgroundImage: `url(${LOGO_PATH})`,
          backgroundSize: "contain",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          border: "1px solid rgba(255, 250, 240, 0.12)",
          boxShadow:
            "0 6px 12px -2px rgba(0, 0, 0, 0.4), 0 14px 28px -4px rgba(0, 0, 0, 0.5), 0 30px 60px -8px rgba(0, 0, 0, 0.55), 0 40px 80px -16px rgba(0, 0, 0, 0.6)",
          transform: "translateY(-2px)",
        }}
      >
        {renderCardContent(!isCapturing)}
      </div>
      <div className="flex flex-col items-center gap-4 max-w-sm mx-auto w-full">
        <div className="w-full space-y-2">
          <label
            htmlFor="member-card-design"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            ダウンロード・表示するデザイン
          </label>
          <select
            id="member-card-design"
            value={effectiveDesign}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "gold") setDownloadDesign("gold");
              else
                setDownloadDesign(
                  Number(v) as 1 | 2 | 3 | 4 | 5
                );
            }}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-200"
          >
            {isPrivileged && (
              <option value="gold">ゴールド（管理者・投稿者・管理メンバー）</option>
            )}
            {Array.from({ length: membershipYear }, (_, i) => i + 1).map(
              (tier) => (
                <option key={tier} value={tier}>
                  {TIER_LABELS[tier]}
                  {tier === membershipYear ? "（現在）" : ""}
                </option>
              )
            )}
          </select>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            現在は{TIER_LABELS[membershipYear]}です。過去の年次の見た目でも画像を保存できます。
          </p>
        </div>
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
