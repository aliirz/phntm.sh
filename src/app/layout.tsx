import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { EasterEggs } from "@/components/EasterEggs";
import "./globals.css";
import { SafeAnalytics } from "@/components/SafeAnalytics";
import { ThemeProvider } from "@/components/ThemeProvider";

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('phntm-theme');
                  if (!theme) {
                    theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
                  }
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <EasterEggs />
          {children}
          <SafeAnalytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
