import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

// OGP画像: Route Handler /og-image で Content-Type: image/png を明示して配信
// 本番は必ず miyata-station.com の絶対URLを使用（キャッシュ・リダイレクト対策）
const ogImageUrl = "https://miyata-station.com/og-image";

const fbAppId = process.env.NEXT_PUBLIC_FB_APP_ID;

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "Miyata Station | 会員専用サイト",
  description: "Kazuya Miyata Online Community - 会員専用サイト",
  openGraph: {
    url: "https://miyata-station.com",
    type: "website",
    title: "Miyata Station | 会員専用サイト",
    description: "Kazuya Miyata Online Community - 会員専用サイト",
    images: [ogImageUrl],
    siteName: "Miyata Station",
  },
  twitter: {
    card: "summary_large_image",
    title: "Miyata Station | 会員専用サイト",
    description: "Kazuya Miyata Online Community - 会員専用サイト",
    images: [ogImageUrl],
  },
  ...(fbAppId && {
    facebook: { appId: fbAppId },
  }),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
