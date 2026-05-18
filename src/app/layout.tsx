import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Providers } from "@/components/layout/providers";
import { NotificationsPanel } from "@/components/notifications/notifications-panel";
import { SettingsDialog } from "@/components/settings/settings-dialog";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TradeAI — Multi-Asset Trading",
  description: "Real-time multi-asset trading with AI-powered analysis",
};

export const viewport: Viewport = {
  width: "device-width", initialScale: 1, maximumScale: 1,
  userScalable: false, viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Server-side auth check — determines whether to render the trading shell
  const session = await auth();
  const isAuthed = !!session;

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="h-full flex bg-[var(--background)]">
        {/*
          Providers seeds the NextAuth SessionProvider.
          The simulator only runs when authenticated (no data fetching on sign-in page).
        */}
        <Providers session={session}>
          {isAuthed ? (
            /* ── Authenticated shell ─────────────────────────────────────── */
            <>
              <Sidebar />
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Topbar />
                <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
                  {children}
                </main>
              </div>
              <MobileNav />
              {/* Global overlay panels — rendered here so they sit above all content */}
              <NotificationsPanel />
              <SettingsDialog />
            </>
          ) : (
            /* ── Unauthenticated: sign-in page fills the viewport ────────── */
            <div className="flex-1">{children}</div>
          )}
        </Providers>
      </body>
    </html>
  );
}
