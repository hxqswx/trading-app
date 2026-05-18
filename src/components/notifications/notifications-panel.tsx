"use client";

/**
 * NotificationsPanel — slide-in drawer from the right.
 *
 * Controlled by `notificationsOpen` in the Zustand store.
 * Renders order fills, strategy signals, and system messages.
 * Opened by the bell icon in the sidebar.
 */
import { useTradingStore } from "@/lib/store";
import { useT } from "@/lib/hooks/use-t";
import type { AppNotification } from "@/lib/types";
import { X, Bell, CheckCheck, ShoppingCart, TrendingUp, Info, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Notification type icon ──────────────────────────────────────────────────
function TypeIcon({ type }: { type: AppNotification["type"] }) {
  const cls = "w-7 h-7 rounded-lg flex items-center justify-center shrink-0";
  if (type === "order")    return <div className={cn(cls, "bg-[rgba(63,185,80,0.12)]")}><ShoppingCart size={14} className="text-[var(--green)]" /></div>;
  if (type === "strategy") return <div className={cn(cls, "bg-[rgba(88,166,255,0.12)]")}><TrendingUp   size={14} className="text-[var(--accent)]" /></div>;
  return                          <div className={cn(cls, "bg-[var(--surface-2)]")}><Info          size={14} className="text-[var(--muted)]"  /></div>;
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000)   return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function relativeTimeZh(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000)    return "刚刚";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}小时前`;
  return `${Math.floor(diff / 86_400_000)}天前`;
}

// ── Single notification row ────────────────────────────────────────────────
function NotifRow({ n }: { n: AppNotification }) {
  const { lang, dismissNotification } = useTradingStore();
  const time = lang === "zh" ? relativeTimeZh(n.timestamp) : relativeTime(n.timestamp);

  return (
    <div className={cn(
      "flex gap-3 px-4 py-3 group hover:bg-[var(--surface-2)] transition-colors relative",
      !n.read && "before:absolute before:left-0 before:top-3 before:bottom-3 before:w-0.5 before:bg-[var(--accent)] before:rounded-r-full"
    )}>
      <TypeIcon type={n.type} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug">{n.title}</p>
        <p className="text-xs text-[var(--muted)] mt-0.5 leading-relaxed">{n.body}</p>
        <p className="text-[10px] text-[var(--muted)] mt-1 opacity-60">{time}</p>
      </div>
      <button
        onClick={() => dismissNotification(n.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)] shrink-0 self-start"
        title="Dismiss"
      >
        <X size={12} />
      </button>
    </div>
  );
}

// ── Panel ──────────────────────────────────────────────────────────────────
export function NotificationsPanel() {
  const {
    notificationsOpen, closeNotifications,
    notifications, markAllRead, lang,
  } = useTradingStore();
  const t = useT();

  const unread = notifications.filter((n) => !n.read).length;
  const title  = lang === "zh" ? t.notifications.title : t.notifications.title;

  return (
    <>
      {/* Backdrop */}
      {notificationsOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
          onClick={closeNotifications}
        />
      )}

      {/* Drawer */}
      <aside className={cn(
        "fixed top-0 right-0 h-full z-50 w-full sm:w-96 flex flex-col",
        "bg-[var(--surface)] border-l border-[var(--border)] shadow-2xl",
        "transition-transform duration-300 ease-out",
        notificationsOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border)] shrink-0">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-[var(--accent)]" />
            <span className="font-semibold">{title}</span>
            {unread > 0 && (
              <span className="bg-[var(--accent)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {notifications.length > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-[11px] text-[var(--muted)] hover:text-[var(--foreground)] px-2 py-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
                title={t.notifications.markAllRead}
              >
                <CheckCheck size={13} /> {t.notifications.markAllRead}
              </button>
            )}
            <button
              onClick={closeNotifications}
              className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[var(--border)]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center">
                <Bell size={20} className="text-[var(--muted)]" />
              </div>
              <p className="text-sm font-medium text-[var(--muted)]">{t.notifications.empty}</p>
              <p className="text-xs text-[var(--muted)] opacity-60">{t.notifications.emptySub}</p>
            </div>
          ) : (
            notifications.map((n) => <NotifRow key={n.id} n={n} />)
          )}
        </div>

        {/* Footer — clear all */}
        {notifications.length > 0 && (
          <div className="border-t border-[var(--border)] px-4 py-3 shrink-0">
            <button
              onClick={() => useTradingStore.setState({ notifications: [] })}
              className="w-full flex items-center justify-center gap-2 text-xs text-[var(--muted)] hover:text-[var(--red)] py-2 rounded-lg hover:bg-[rgba(248,81,73,0.08)] transition-colors"
            >
              <Trash2 size={13} /> {t.notifications.clearAll}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
