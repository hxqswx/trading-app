import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Providers } from "@/components/layout/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TradeAI — Multi-Asset Trading",
  description: "Real-time multi-asset trading with AI-powered analysis",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="h-full flex bg-[var(--background)]">
        <Providers>
          {/* Desktop sidebar — hidden on mobile */}
          <Sidebar />

          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Topbar />
            {/* Extra bottom padding on mobile for the sticky bottom nav */}
            <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
              {children}
            </main>
          </div>

          {/* Mobile bottom nav — hidden on md+ */}
          <MobileNav />
        </Providers>
      </body>
    </html>
  );
}
