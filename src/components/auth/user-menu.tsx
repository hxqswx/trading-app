"use client";

/**
 * UserMenu — avatar + dropdown (name, email, sign-out) in the topbar.
 * Uses next-auth/react client hooks.
 */
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { LogOut, User, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

function initials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }
  return (email?.[0] ?? "U").toUpperCase();
}

export function UserMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (status === "loading") {
    return <div className="w-7 h-7 rounded-full bg-[var(--surface-2)] animate-pulse" />;
  }
  if (status === "unauthenticated") return null;

  const user   = session?.user;
  const avatar = user?.image;
  const ini    = initials(user?.name, user?.email);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg px-1.5 py-1 hover:bg-[var(--surface-2)] transition-colors"
      >
        {/* Avatar */}
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt={user?.name ?? ""} className="w-7 h-7 rounded-full object-cover" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
            {ini}
          </div>
        )}
        <ChevronDown size={12} className={cn("text-[var(--muted)] transition-transform", open && "rotate-180")} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl z-50 overflow-hidden">
          {/* User info */}
          <div className="px-3 py-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-2.5">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {ini}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{user?.name ?? "Trader"}</p>
                <p className="text-[11px] text-[var(--muted)] truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="p-1">
            <button
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors"
              onClick={() => setOpen(false)}
            >
              <User size={14} /> Profile
            </button>
            <button
              onClick={() => { setOpen(false); signOut({ callbackUrl: "/sign-in" }); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[var(--red)] hover:bg-[rgba(248,81,73,0.08)] transition-colors"
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
