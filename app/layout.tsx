import type { Metadata } from 'next';
import './globals.css';
import BottomNav from '@/components/layout/BottomNav';
import Header from '@/components/layout/Header';

export const metadata: Metadata = {
  title: 'F1 #247 — Formula 1 Companion',
  description:
    'Live timing, championship standings, race results, and prediction game for Formula 1.',
  keywords: ['F1', 'Formula 1', 'live timing', 'race results', 'championship standings'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#1a0a0a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="font-display min-h-screen flex flex-col overflow-x-hidden selection:bg-f1-red selection:text-white">
        <Header />
        <main className="flex-grow flex flex-col pt-20 pb-nav px-4 md:px-8 lg:px-12 max-w-7xl mx-auto w-full">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
