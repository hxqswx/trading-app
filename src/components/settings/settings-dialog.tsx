"use client";

/**
 * SettingsDialog — full-featured settings modal.
 *
 * Sections: Appearance · Trading · Account · About
 * Controlled by `settingsOpen` in the Zustand store.
 * Opened by the gear icon in the sidebar.
 */
import { useTradingStore } from "@/lib/store";
import { useT } from "@/lib/hooks/use-t";
import { X, Palette, TrendingUp, User, Info, RotateCcw, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

type Section = "appearance" | "trading" | "account" | "about";

// ── Toggle switch ──────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch" aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0",
        checked ? "bg-[var(--accent)]" : "bg-[var(--surface-2)] border border-[var(--border)]"
      )}
    >
      <span className={cn(
        "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200",
        checked ? "translate-x-5" : "translate-x-0.5"
      )} />
    </button>
  );
}

// ── Option group buttons ───────────────────────────────────────────────────
function OptionGroup<T extends string>({
  options, value, onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
      {options.map((opt, i) => (
        <button key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex-1 px-3 py-1.5 text-xs font-medium transition-colors",
            i > 0 && "border-l border-[var(--border)]",
            value === opt.value
              ? "bg-[var(--accent)] text-white"
              : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)]"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Row layout ─────────────────────────────────────────────────────────────
function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-[var(--border)] last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-[var(--muted)] mt-0.5">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// ── Sections ───────────────────────────────────────────────────────────────
function AppearanceSection() {
  const { lang, setLang } = useTradingStore();
  const t = useT();
  return (
    <div className="space-y-1">
      <Row label={t.settings.language}>
        <OptionGroup
          options={[{ value: "en", label: "EN" }, { value: "zh", label: "中文" }]}
          value={lang}
          onChange={setLang}
        />
      </Row>
      <Row label={t.settings.theme} hint={t.settings.themeHint}>
        <OptionGroup
          options={[{ value: "dark", label: t.settings.dark }]}
          value="dark"
          onChange={() => {}}
        />
      </Row>
    </div>
  );
}

function TradingSection() {
  const { settings, updateSetting } = useTradingStore();
  const t = useT();
  return (
    <div className="space-y-1">
      <Row label={t.settings.defaultOrderType} hint={t.settings.defaultOrderTypeHint}>
        <OptionGroup
          options={[
            { value: "market", label: t.trade.market },
            { value: "limit",  label: t.trade.limit  },
          ]}
          value={settings.defaultOrderType as "market" | "limit"}
          onChange={(v) => updateSetting("defaultOrderType", v)}
        />
      </Row>
      <Row label={t.settings.confirmOrders} hint={t.settings.confirmOrdersHint}>
        <Toggle
          checked={settings.confirmOrders}
          onChange={(v) => updateSetting("confirmOrders", v)}
        />
      </Row>
      <Row label={t.settings.pnlDisplay}>
        <OptionGroup
          options={[
            { value: "absolute", label: "$" },
            { value: "percent",  label: "%" },
          ]}
          value={settings.pnlDisplay}
          onChange={(v) => updateSetting("pnlDisplay", v)}
        />
      </Row>
    </div>
  );
}

function AccountSection() {
  const { addNotification, closeSettings } = useTradingStore();
  const t = useT();
  const [resetting, setResetting] = useState(false);
  const [done,      setDone]      = useState(false);

  async function handleReset() {
    setResetting(true);
    try {
      // Try DB reset first
      const res = await fetch("/api/init", { method: "POST" });
      if (!res.ok) throw new Error("DB not configured");
    } catch {
      // Mock mode — just show success (state resets on page refresh)
    }
    setDone(true);
    setResetting(false);
    addNotification({
      type:  "system",
      title: t.settings.resetSuccess,
      body:  t.settings.resetSuccessBody,
    });
    setTimeout(() => { setDone(false); closeSettings(); }, 1500);
  }

  return (
    <div className="space-y-4">
      {/* Balance display */}
      <div className="rounded-xl bg-[var(--surface-2)] border border-[var(--border)] p-4">
        <p className="text-xs text-[var(--muted)]">{t.settings.paperBalance}</p>
        <p className="text-2xl font-bold font-mono mt-1">$24,200.00</p>
        <p className="text-xs text-[var(--muted)] mt-1">{t.settings.paperNote}</p>
      </div>

      {/* Reset button */}
      <button
        onClick={handleReset}
        disabled={resetting || done}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all",
          done
            ? "bg-[rgba(63,185,80,0.1)] text-[var(--green)] border border-[rgba(63,185,80,0.3)]"
            : "bg-[rgba(248,81,73,0.08)] text-[var(--red)] border border-[rgba(248,81,73,0.2)] hover:bg-[rgba(248,81,73,0.15)]",
          "disabled:opacity-60"
        )}
      >
        {done
          ? <><Check size={15} /> {t.settings.resetSuccess}</>
          : resetting
            ? <><RotateCcw size={15} className="animate-spin" /> {t.settings.resetting}</>
            : <><RotateCcw size={15} /> {t.settings.resetBalance}</>
        }
      </button>

      <p className="text-xs text-[var(--muted)] text-center">{t.settings.resetWarning}</p>
    </div>
  );
}

function AboutSection() {
  const t = useT();
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--accent)] flex items-center justify-center shrink-0">
          <span className="text-white font-bold">T</span>
        </div>
        <div>
          <p className="font-semibold">TradeAI</p>
          <p className="text-xs text-[var(--muted)]">v0.1.0 · Multi-Asset Paper Trading</p>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] divide-y divide-[var(--border)] overflow-hidden text-sm">
        {[
          { label: t.settings.aboutMarket,   value: "Yahoo Finance (free)" },
          { label: t.settings.aboutDB,       value: "Neon Postgres / Mock" },
          { label: t.settings.aboutCache,    value: "Upstash Redis / Memory" },
          { label: t.settings.aboutAuth,     value: "NextAuth.js v5" },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between px-4 py-2.5">
            <span className="text-[var(--muted)]">{label}</span>
            <span className="font-medium text-xs font-mono">{value}</span>
          </div>
        ))}
      </div>

      <a
        href="https://github.com"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)] transition-colors"
      >
        {t.settings.viewOnGithub} ↗
      </a>
    </div>
  );
}

// ── Dialog ─────────────────────────────────────────────────────────────────
const NAV: { id: Section; icon: React.ReactNode; labelKey: keyof ReturnType<typeof useT>["settings"] }[] = [
  { id: "appearance", icon: <Palette   size={15} />, labelKey: "sectionAppearance" },
  { id: "trading",    icon: <TrendingUp size={15} />, labelKey: "sectionTrading"    },
  { id: "account",    icon: <User       size={15} />, labelKey: "sectionAccount"    },
  { id: "about",      icon: <Info       size={15} />, labelKey: "sectionAbout"      },
];

export function SettingsDialog() {
  const { settingsOpen, closeSettings } = useTradingStore();
  const t = useT();
  const [section, setSection] = useState<Section>("appearance");

  if (!settingsOpen) return null;

  const sectionContent: Record<Section, React.ReactNode> = {
    appearance: <AppearanceSection />,
    trading:    <TradingSection />,
    account:    <AccountSection />,
    about:      <AboutSection />,
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
        onClick={closeSettings}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
            <h2 className="font-bold text-base">{t.settings.title}</h2>
            <button onClick={closeSettings}
              className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="flex flex-1 min-h-0">
            {/* Side nav */}
            <nav className="w-40 border-r border-[var(--border)] flex flex-col gap-1 p-2 shrink-0">
              {NAV.map(({ id, icon, labelKey }) => (
                <button key={id} onClick={() => setSection(id)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                    section === id
                      ? "bg-[var(--accent)] text-white"
                      : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]"
                  )}
                >
                  {icon}
                  {t.settings[labelKey] as string}
                </button>
              ))}
            </nav>

            {/* Content */}
            <div className="flex-1 p-5 overflow-y-auto">
              {sectionContent[section]}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
