import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import "./globals.css";

const description =
  "AICodeRoom 是多用户、多项目、可邀请协作的 AI 软件开发工作台。";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:43120",
  ),
  title: {
    default: "AICodeRoom｜AI 软件开发协作空间",
    template: "%s｜AICodeRoom",
  },
  description,
  keywords: [
    "AI 软件开发",
    "多智能体协作",
    "Codex",
    "Claude Code",
    "Git 工作流",
    "代码备份",
  ],
  authors: [{ name: "AICodeRoom" }],
  creator: "AICodeRoom",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "AICodeRoom",
    title: "AICodeRoom｜让一支 AI 团队在同一个代码空间里工作",
    description,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "AICodeRoom AI 软件开发协作空间",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AICodeRoom｜AI 软件开发协作空间",
    description,
    images: ["/og.png"],
  },
  robots: { index: false, follow: false },
  icons: { icon: [{ url: "/aicoderoom-logo.svg", type: "image/svg+xml" }] },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className={`dark ${GeistSans.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
