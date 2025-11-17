import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "LangJourney - 语言学习成果证明",
  description: "基于FHEVM的去中心化语言学习成果存证平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <Navigation />
        {children}
      </body>
    </html>
  );
}
