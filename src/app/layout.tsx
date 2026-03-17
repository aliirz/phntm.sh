import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { EasterEggs } from "@/components/EasterEggs";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PHNTM — Encrypted file sharing that self-destructs",
  description:
    "Drop. Share. Vanish. End-to-end encrypted file sharing with automatic self-destruction. Zero-knowledge. No sign-up required.",
  openGraph: {
    title: "PHNTM — Encrypted file sharing that self-destructs",
    description:
      "Drop. Share. Vanish. End-to-end encrypted file sharing with automatic self-destruction.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistMono.variable} antialiased`}>
        <EasterEggs />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
