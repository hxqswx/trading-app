"use client";

/**
 * BalancePanel — Alpaca account balance detail modal.
 *
 * Shows Buying Power, Margin, Cash, Positions, and Misc sections
 * with Last Close (from last_equity / previous day) and Current columns.
 */

import { useState, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Scale, X, RefreshCw, ExternalLink } from "lucide-react";
import { useTradingStore } from "@/lib/store";
import { cn } from "@/lib/utils";

// ── Types matching Alpaca's /v2/account response ──────────────────────────────

interface AlpacaAccount {
  id:                          string;
  account_number:              string;
  status:                      string;
  cash:                        string;
  buying_power:                string;
  regt_buying_power:           string;
  daytrading_buying_power:     string;
  effective_buying_power:      string;
  non_marginable_buying_power: string;
  initial_margin:              string;
  maintenance_margin:          string;
  equity:                      string;
  last_equity:                 string;
  long_market_value:           string;
  short_market_value:          string;
  position_market_value:       string;
  accrued_fees:                string;
  daytrade_count:              number;
  cash_withdrawable?:          string;
  pending_transfer_out?:       string;
  sma?:                        string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt$(raw: string | undefined | null): string {
  if (raw == null || raw === "0") return "$0.00";
  const n = parseFloat(raw);
  if (isNaN(n)) return "—";
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── Row & Section ─────────────────────────────────────────────────────────────

function Row({
  label, lastClose, current, highlight = false,
}: {
  label:      string;
  lastClose:  string;
  current:    string;
  highlight?: boolean;
}) {
  return (
    <tr className={cn(
      "border-b border-[var(--border)] last:border-0",
      highlight && "bg-[var(--surface-2)]/40"
    )}>
      <td className="py-2.5 pr-4 text-sm text-[var(--foreground)]">{label}</td>
      <td className="py-2.5 px-4 text-sm font-mono text-right text-[var(--muted)]">{lastClose}</td>
      <td className="py-2.5 pl-4 text-sm font-mono text-right font-medium">{current}</td>
    </tr>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <tr>
      <td colSpan={3} className="pt-5 pb-1.5 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
        {label}
      </td>
    </tr>
  );
}

// ── Balance table ─────────────────────────────────────────────────────────────

function BalanceTable({ acct, lang }: { acct: AlpacaAccount; lang: string }) {
  // "Last Close" date label
  const lastDate = new Date();
  lastDate.setDate(lastDate.getDate() - 1);
  const lastLabel = lang === "zh"
    ? `${lastDate.getMonth() + 1}月${lastDate.getDate()}日收盘`
    : `Last Close ${lastDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  // For most fields Alpaca doesn't expose last-close per-field —
  // we use last_equity for equity and show "—" for the rest.
  const lastEquity = fmt$(acct.last_equity);

  const zh = lang === "zh";

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b border-[var(--border)]">
          <th className="py-3 text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
            {zh ? "项目" : "Balance"}
          </th>
          <th className="py-3 px-4 text-right text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
            {lastLabel}
          </th>
          <th className="py-3 pl-4 text-right text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
            {zh ? "当前" : "Current"}
          </th>
        </tr>
      </thead>
      <tbody>
        {/* Buying Power */}
        <SectionHeader label={zh ? "购买力" : "Buying Power"} />
        <Row label={zh ? "RegT 购买力"    : "RegT Buying Power"}         lastClose="—" current={fmt$(acct.regt_buying_power)}           />
        <Row label={zh ? "日内交易购买力" : "Day Trading Buying Power"}  lastClose="—" current={fmt$(acct.daytrading_buying_power)}      />
        <Row label={zh ? "有效购买力"     : "Effective Buying Power"}    lastClose="—" current={fmt$(acct.effective_buying_power)}       />
        <Row label={zh ? "非保证金购买力" : "Non-Marginable Buying Power"} lastClose="—" current={fmt$(acct.non_marginable_buying_power)} />

        {/* Margin */}
        <SectionHeader label={zh ? "保证金" : "Margin"} />
        <Row label={zh ? "初始保证金"   : "Initial Margin"}     lastClose="—" current={fmt$(acct.initial_margin)}     />
        <Row label={zh ? "维持保证金"   : "Maintenance Margin"} lastClose="—" current={fmt$(acct.maintenance_margin)} />

        {/* Cash */}
        <SectionHeader label={zh ? "现金" : "Cash"} />
        <Row label={zh ? "现金余额"   : "Cash"}                lastClose="—" current={fmt$(acct.cash)}                highlight />
        <Row label={zh ? "可提取现金" : "Cash Withdrawable"}   lastClose="—" current={fmt$(acct.cash_withdrawable)}   />
        <Row label={zh ? "待转出"     : "Pending Transfer Out"} lastClose="—" current={fmt$(acct.pending_transfer_out ?? "0")} />

        {/* Positions */}
        <SectionHeader label={zh ? "持仓" : "Positions"} />
        <Row label={zh ? "账户净值"   : "Equity"}                lastClose={lastEquity} current={fmt$(acct.equity)}                highlight />
        <Row label={zh ? "多头市值"   : "Long Market Value"}     lastClose="—"          current={fmt$(acct.long_market_value)}    />
        <Row label={zh ? "空头市值"   : "Short Market Value"}    lastClose="—"          current={fmt$(acct.short_market_value)}   />
        <Row label={zh ? "持仓市值"   : "Position Market Value"} lastClose="—"          current={fmt$(acct.position_market_value)} />

        {/* Miscellaneous */}
        <SectionHeader label={zh ? "其他" : "Miscellaneous"} />
        <Row label={zh ? "应计费用"   : "Accrued Fees"}   lastClose="—" current={fmt$(acct.accrued_fees)}      />
        <Row label={zh ? "日内交易次数" : "Day Trade Count"} lastClose="—" current={String(acct.daytrade_count ?? 0)} />
      </tbody>
    </table>
  );
}

// ── Main button + dialog ──────────────────────────────────────────────────────

export function BalanceButton({ className }: { className?: string }) {
  const lang = useTradingStore((s) => s.lang);
  const [open,    setOpen]    = useState(false);
  const [acct,    setAcct]    = useState<AlpacaAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/alpaca/account", { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      setAcct(await res.json() as AlpacaAccount);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  function handleOpen(v: boolean) {
    setOpen(v);
    if (v && !acct) load();
  }

  const zh = lang === "zh";

  return (
    <Dialog.Root open={open} onOpenChange={handleOpen}>
      <Dialog.Trigger asChild>
        <button className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg",
          "bg-[var(--surface-2)] hover:bg-[var(--accent)] hover:text-white",
          "text-[var(--foreground)] border border-[var(--border)] transition-colors",
          className,
        )}>
          <Scale size={13} />
          {zh ? "账户余额" : "Balance"}
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Panel */}
        <Dialog.Content className={cn(
          "fixed z-50 right-0 top-0 h-full w-full max-w-lg",
          "bg-[var(--background)] border-l border-[var(--border)] shadow-2xl",
          "flex flex-col",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
          "duration-300",
        )}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] shrink-0">
            <div>
              <Dialog.Title className="text-base font-semibold flex items-center gap-2">
                <Scale size={16} className="text-[var(--accent)]" />
                {zh ? "账户余额" : "Account Balance"}
              </Dialog.Title>
              {acct && (
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  Alpaca Paper · {acct.account_number}
                  {" "}·{" "}
                  <span className={cn(
                    "font-medium",
                    acct.status === "ACTIVE" ? "text-emerald-400" : "text-[var(--red)]"
                  )}>
                    {acct.status}
                  </span>
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={load}
                disabled={loading}
                className="p-1.5 rounded-md text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              </button>
              <a
                href="https://app.alpaca.markets/paper/dashboard/overview"
                target="_blank"
                rel="noopener noreferrer"
                title="Open Alpaca Dashboard"
                className="p-1.5 rounded-md text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors"
              >
                <ExternalLink size={14} />
              </a>
              <Dialog.Close asChild>
                <button className="p-1.5 rounded-md text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors">
                  <X size={16} />
                </button>
              </Dialog.Close>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {loading && !acct && (
              <div className="space-y-2 pt-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="h-8 animate-pulse bg-[var(--surface-2)] rounded" />
                ))}
              </div>
            )}
            {error && (
              <div className="text-sm text-[var(--red)] pt-4">{error}</div>
            )}
            {acct && <BalanceTable acct={acct} lang={lang} />}
          </div>

          {/* Footer */}
          <div className="shrink-0 px-6 py-3 border-t border-[var(--border)] flex items-center justify-between">
            <span className="text-xs text-[var(--muted)]">
              {zh ? "Alpaca 纸交易 · 仅供模拟" : "Alpaca Paper Trading · Simulated only"}
            </span>
            <a
              href="https://alpaca.markets"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[var(--accent)] hover:underline"
            >
              alpaca.markets
            </a>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
