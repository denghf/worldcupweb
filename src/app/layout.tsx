import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "嗨起来 · 赛事竞猜",
  description: "和朋友一起猜球，欢乐豆赢不停",
  openGraph: {
    title: "嗨起来 · 赛事竞猜",
    description: "和朋友一起猜球，欢乐豆赢不停",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-bg-deep text-text-primary">
        {children}
      </body>
    </html>
  );
}
