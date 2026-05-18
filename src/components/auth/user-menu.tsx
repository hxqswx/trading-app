"use client";

/**
 * UserMenu — avatar + dropdown in the topbar.
 *
 * - Avatar: photo from OAuth or colour-coded initials circle.
 * - Dropdown: user info, Settings, Sign out.
 * - Profile/Settings opens the Zustand settings panel (gear icon).
 * - Sign out calls NextAuth signOut with a redirect back to /sign-in.
 */
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { LogOut, Settings, ChevronDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTradingStore } from "@/lib/store";

// ── Helpers ────────────────────────────────────────────────────────────────
function initials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }
  return (email?.[0] ?? "U").toUpperCase();
}

/** Stable accent colour based on the user's email/id */
function avatarColor(seed?: string | null): string {
  const palette = [
    "#58a6ff", "#3fb950", "#f0883e", "#d2a8ff",
    "#ff7b72", "#ffa657", "#79c0ff", "#56d364",
  ];
  const hash = (seed ?? "").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

// ── Avatar component ──────────────────────────────────────────────────────
function Avatar({ src, name, email, size = 28 }: { src?: string | null; name?: string | null; email?: string | null; size?: number }) {
  const ini   = initials(name, email);
  const color = avatarColor(email);
  const px    = `${size}px`;

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={name ?? ""} width={size} height={size}
        className="rounded-full object-cover shrink-0"
        style={{ width: px, height: px }} />
    );
  }
  return (
    <div className="rounded-full flex items-center justify-center shrink-0 font-bold text-white"
      style={{ width: px, height: px, background: color, fontSize: size * 0.38 }}>
      {ini}
    </div>
  );
}

// ── UserMenu ──────────────────────────────────────────────────────────────
export function UserMenu() {
  const { data: session, status } = useSession();
  const { openSettings }          = useTradingStore();
  const [open,    setOpen]    = useState(false);
  const [signing, setSigning] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    function onMouse(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onMouse);
    document.addEventListener("keydown",   onKey);
    return () => {
      document.removeEventListener("mousedown", onMouse);
      document.removeEventListener("keydown",   onKey);
    };
  }, []);

  // ── Loading skeleton ──────────────────────────────────────────────────
  if (status === "loading") {
    return <div className="w-7 h-7 rounded-full bg-[var(--surface-2)] animate-pulse shrink-0" />;
  }
  if (status === "unauthenticated") return null;

  const user       = session?.user;
  const isDemo     = user?.id?.startsWith("demo-") ?? false;
  const displayName = user?.name ?? user?.email?.split("@")[0] ?? "Trader";

  async function handleSignOut() {
    setSigning(true);
    setOpen(false);
    try {
      // NextAuth v5: signOut clears the session cookie then navigates
      await signOut({ redirect: false });
    } catch {
      // Ignore errors from the navigation itself
    } finally {
      // Hard navigate so the proxy re-evaluates auth and shows sign-in
      window.location.href = "/sign-in";
    }
  }

  return (
    <div ref={ref} className="relative shrink-0">
      {/* ── Trigger button ─────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg px-1.5 py-1 hover:bg-[var(--surface-2)] transition-colors"
        aria-label="User menu"
        aria-expanded={open}
      >
        <Avatar src={user?.image} name={user?.name} email={user?.email} size={28} />
        <span className="hidden sm:block text-xs font-medium max-w-[100px] truncate">
          {displayName}
        </span>
        <ChevronDown size={12} className={cn(
          "text-[var(--muted)] transition-transform duration-150 shrink-0",
          open && "rotate-180"
        )} />
      </button>

      {/* ── Dropdown ───────────────────────────────────────────────────── */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-60 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl z-50 overflow-hidden">

          {/* User info */}
          <div className="px-4 py-3.5 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <Avatar src={user?.image} name={user?.name} email={user?.email} size={36} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{displayName}</p>
                <p className="text-[11px] text-[var(--muted)] truncate">{user?.email}</p>
              </div>
            </div>
            {isDemo && (
              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-[var(--accent)] bg-[rgba(88,166,255,0.08)] border border-[rgba(88,166,255,0.2)] rounded-lg px-2.5 py-1.5">
                <Sparkles size={11} className="shrink-0" />
                Demo account · data resets on refresh
              </div>
            )}
          </div>

          {/* Menu items */}
          <div className="p-1.5 space-y-0.5">
            <button
              onClick={() => { setOpen(false); openSettings(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors"
            >
              <Settings size={14} className="shrink-0" />
              Settings
            </button>

            <div className="h-px bg-[var(--border)] mx-1 my-1" />

            <button
              onClick={handleSignOut}
              disabled={signing}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[var(--red)] hover:bg-[rgba(248,81,73,0.08)] transition-colors disabled:opacity-50"
            >
              <LogOut size={14} className="shrink-0" />
              {signing ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
