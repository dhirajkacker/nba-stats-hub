import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import LeagueSwitch from "@/components/LeagueSwitch";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://dkbball.com"),
  title: "NBA & WNBA Stats Hub - Real-time Scores, Standings & Statistics",
  description: "Live NBA and WNBA scores, standings, playoff brackets, player and team stats, and every season since 2010.",
  keywords: ["NBA", "WNBA", "basketball", "stats", "scores", "standings", "playoffs", "live games", "player statistics", "team stats"],
  authors: [{ name: "Dhiraj Kacker" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://dkbball.com",
    siteName: "NBA & WNBA Stats Hub",
    title: "NBA & WNBA Stats Hub - Real-time Scores & Statistics",
    description: "Live NBA and WNBA scores, standings, playoff brackets, and player and team stats.",
  },
  twitter: {
    card: "summary_large_image",
    title: "NBA & WNBA Stats Hub - Real-time Scores & Statistics",
    description: "Live NBA and WNBA scores, standings, playoff brackets, and player and team stats.",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LeagueSwitch />
        {children}
        <Footer />
      </body>
    </html>
  );
}
