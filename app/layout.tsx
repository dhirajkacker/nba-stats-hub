import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NBA Stats Hub - Real-time Scores, Standings & Statistics",
  description: "Track live NBA games, team standings, player stats, and comprehensive basketball analytics. Get real-time scores, advanced statistics, and detailed team/player comparisons.",
  keywords: ["NBA", "basketball", "stats", "scores", "standings", "live games", "player statistics", "team stats"],
  authors: [{ name: "Dhiraj Kacker" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://nba-stats-hub.vercel.app",
    siteName: "NBA Stats Hub",
    title: "NBA Stats Hub - Real-time Scores & Statistics",
    description: "Track live NBA games, standings, and player stats with real-time updates. Your go-to source for comprehensive basketball analytics.",
  },
  twitter: {
    card: "summary_large_image",
    title: "NBA Stats Hub - Real-time Scores & Statistics",
    description: "Track live NBA games, standings, and player stats with real-time updates.",
  },
  icons: {
    icon: "/favicon.ico",
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
        {children}
        <Footer />
      </body>
    </html>
  );
}
