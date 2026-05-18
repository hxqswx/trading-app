"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BarChart2, Wallet, TrendingUp, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTradingStore } from "@/lib/store";
import { useT } from "@/lib/hooks/use-t";

export function MobileNav() {
  const pathname = usePathname();
  const { lang, setLang, notifications, openNotifications } = useTradingStore();
  const t = useT();
  const unread = notifications.filter((n) => !n.read).length;

  const nav = [
    { href: "/",           icon: LayoutDashboard, label: t.nav.dashboard  },
    { href: "/markets",    icon: BarChart2,        label: t.nav.markets    },
    { href: "/portfolio",  icon: Wallet,           label: t.nav.portfolio  },
    { href: "/strategies", icon: TrendingUp,       label: t.nav.strategies },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[var(--surface)] border-t border-[var(--border)] flex items-center safe-bottom">
      {nav.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || (href !== "/" && pathname.startsWith(href));
        return (
          <Link key={href} href={href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors",
              active ? "text-[var(--accent)]" : "text-[var(--muted)]"
            )}
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}

      {/* Notifications */}
      <button
        onClick={openNotifications}
        className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[var(--muted)] relative"
      >
        <span className="relative">
          <Bell size={20} />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-0.5 bg-[var(--accent)] text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </span>
        <span className="text-[10px] font-medium">{t.nav.notifications}</span>
      </button>

      {/* Language toggle */}
      <button
        onClick={() => setLang(lang === "en" ? "zh" : "en")}
        className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[var(--muted)]"
      >
        <span className="text-base font-bold leading-none">{lang === "en" ? "中" : "EN"}</span>
        <span className="text-[10px] font-medium">{lang === "en" ? "中文" : "English"}</span>
      </button>
    </nav>
  );
}
