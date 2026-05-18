"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart2, LayoutDashboard, Wallet, Bell, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTradingStore } from "@/lib/store";
import { useT } from "@/lib/hooks/use-t";

export function Sidebar() {
  const pathname = usePathname();
  const { lang, setLang } = useTradingStore();
  const t = useT();

  const nav = [
    { href: "/",          icon: LayoutDashboard, label: t.nav.dashboard },
    { href: "/markets",   icon: BarChart2,        label: t.nav.markets   },
    { href: "/portfolio", icon: Wallet,           label: t.nav.portfolio  },
  ];

  return (
    /* Hidden on mobile — the MobileNav handles that breakpoint */
    <aside className="hidden md:flex flex-col w-16 border-r border-[var(--border)] bg-[var(--surface)] h-screen sticky top-0 z-20 shrink-0">
      {/* Logo */}
      <div className="flex items-center justify-center h-14 border-b border-[var(--border)] shrink-0">
        <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
          <span className="text-white font-bold text-sm">T</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col items-center gap-1 py-4">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link key={href} href={href} title={label}
              className={cn(
                "w-10 h-10 flex items-center justify-center rounded-lg transition-colors",
                active
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]"
              )}
            >
              <Icon size={18} />
            </Link>
          );
        })}
      </nav>

      {/* Bottom: lang toggle + icons */}
      <div className="flex flex-col items-center gap-2 py-4 border-t border-[var(--border)]">
        <button
          onClick={() => setLang(lang === "en" ? "zh" : "en")}
          title={lang === "en" ? "切换中文" : "Switch to English"}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-xs font-bold transition-colors bg-[var(--surface-2)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white"
        >
          {lang === "en" ? "中" : "EN"}
        </button>
        <button title={t.nav.notifications} className="w-10 h-10 flex items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]">
          <Bell size={16} />
        </button>
        <button title={t.nav.settings} className="w-10 h-10 flex items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]">
          <Settings size={16} />
        </button>
      </div>
    </aside>
  );
}
