import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "wordmarks.net — AI Typography Logo Maker",
  description: "Generate premium, typography-first wordmark logos with AI. Guided wizard → quality review → iteration. Powered by GPT-4o & DALL-E 3.",
  keywords: ["logo maker", "wordmark", "typography logo", "AI logo", "brand identity", "logo generator"],
  openGraph: {
    title: "wordmarks.net — AI Typography Logo Maker",
    description: "Generate premium wordmark logos with AI. Guided wizard, quality review, infinite iteration.",
    url: "https://wordmarks.net",
    siteName: "wordmarks.net",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#0a0a0f] text-white">{children}</body>
    </html>
  );
}
