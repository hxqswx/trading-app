"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart2, LayoutDashboard, Wallet, Bell, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/",         icon: LayoutDashboard, label: "Dashboard" },
  { href: "/markets",  icon: BarChart2,        label: "Markets"   },
  { href: "/portfolio",icon: Wallet,           label: "Portfolio" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-16 border-r border-[var(--border)] bg-[var(--surface)] h-screen sticky top-0 z-20">
      {/* Logo */}
      <div className="flex items-center justify-center h-14 border-b border-[var(--border)]">
        <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
          <span className="text-white font-bold text-sm">T</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col items-center gap-1 py-4">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              title={label}
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

      {/* Bottom */}
      <div className="flex flex-col items-center gap-1 py-4 border-t border-[var(--border)]">
        <button title="Notifications" className="w-10 h-10 flex items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]">
          <Bell size={18} />
        </button>
        <button title="Settings" className="w-10 h-10 flex items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]">
          <Settings size={18} />
        </button>
      </div>
    </aside>
  );
}
