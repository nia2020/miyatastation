"use client";

import { useState, useEffect } from "react";

export function useQRCode(text: string): string | null {
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!text) return;

    const size = 128;
    const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
    setQrUrl(apiUrl);
  }, [text]);

  return qrUrl;
}
