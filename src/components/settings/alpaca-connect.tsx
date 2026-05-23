"use client";

/**
 * AlpacaConnect — inline section inside the Account settings tab.
 *
 * States:
 *  idle      → show "Connect Alpaca Account" card with step guide
 *  form      → show key input form
 *  testing   → spinner while validating keys
 *  connected → show masked key + account info + disconnect button
 *  error     → show error + retry
 */
import { useEffect, useState } from "react";
import { ExternalLink, Link2, Link2Off, CheckCircle2, AlertCircle, Loader2, ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";
import { cn, fmtCurrency } from "@/lib/utils";

type Status =
  | { state: "loading" }
  | { state: "idle" }
  | { state: "form"; error?: string }
  | { state: "testing" }
  | { state: "connected"; maskedKeyId: string; equity: string; cash: string }
  | { state: "disconnecting" };

const GUIDE_STEPS = [
  {
    label: "Create a free Alpaca account",
    hint:  "Sign up for a paper-trading account at alpaca.markets",
    href:  "https://app.alpaca.markets/signup",
  },
  {
    label: "Open your paper trading dashboard",
    hint:  "Switch to the Paper account after signing in",
    href:  "https://app.alpaca.markets/paper/dashboard/overview",
  },
  {
    label: 'Go to API Keys → "Generate New Key"',
    hint:  "Copy both the Key ID and Secret Key before closing",
    href:  "https://app.alpaca.markets/paper/dashboard/overview",
  },
  {
    label: "Paste your keys below and connect",
    hint:  "Keys are stored securely and only used for your paper account",
    href:  null,
  },
];

export function AlpacaConnect() {
  const [status, setStatus] = useState<Status>({ state: "loading" });
  const [showGuide, setShowGuide] = useState(false);
  const [keyId, setKeyId]         = useState("");
  const [secret, setSecret]       = useState("");
  const [showSecret, setShowSecret] = useState(false);

  // ── Load current connection status ──────────────────────────────────────
  useEffect(() => {
    fetch("/api/alpaca/connect")
      .then((r) => r.json())
      .then((data) => {
        if (data.connected) {
          setStatus({
            state:        "connected",
            maskedKeyId:  data.maskedKeyId,
            equity:       data.equity,
            cash:         data.cash,
          });
        } else {
          setStatus({ state: "idle" });
        }
      })
      .catch(() => setStatus({ state: "idle" }));
  }, []);

  // ── Connect ──────────────────────────────────────────────────────────────
  async function handleConnect() {
    if (!keyId.trim() || !secret.trim()) {
      setStatus({ state: "form", error: "Both Key ID and Secret Key are required." });
      return;
    }
    setStatus({ state: "testing" });

    let res: Response;
    try {
      res = await fetch("/api/alpaca/connect", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ keyId: keyId.trim(), secretKey: secret.trim() }),
      });
    } catch (err) {
      setStatus({ state: "form", error: `Could not reach server: ${err instanceof Error ? err.message : String(err)}` });
      return;
    }

    // Parse JSON — server always returns JSON now; guard against HTML 500 fallback
    let data: Record<string, unknown>;
    try {
      data = await res.json();
    } catch {
      setStatus({ state: "form", error: `Server error (HTTP ${res.status}) — check Vercel logs for details.` });
      return;
    }

    if (!res.ok || !data.connected) {
      setStatus({ state: "form", error: (data.error as string | undefined) ?? `HTTP ${res.status} — failed to connect.` });
      return;
    }

    setStatus({
      state:       "connected",
      maskedKeyId: data.maskedKeyId as string,
      equity:      data.equity as string,
      cash:        data.cash as string,
    });
    setKeyId(""); setSecret("");
  }

  // ── Disconnect ────────────────────────────────────────────────────────────
  async function handleDisconnect() {
    setStatus({ state: "disconnecting" });
    try {
      await fetch("/api/alpaca/connect", { method: "DELETE" });
    } finally {
      setStatus({ state: "idle" });
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (status.state === "loading") {
    return (
      <div className="flex items-center gap-2 py-2 text-xs text-[var(--muted)]">
        <Loader2 size={13} className="animate-spin" />
        Checking Alpaca connection…
      </div>
    );
  }

  if (status.state === "connected" || status.state === "disconnecting") {
    const acct = status.state === "connected" ? status : null;
    return (
      <div className="space-y-3">
        {/* Connected badge */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--green)]/10 border border-[var(--green)]/30">
          <CheckCircle2 size={14} className="text-[var(--green)] shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[var(--green)]">Alpaca Paper Account Connected</p>
            {acct && (
              <p className="text-xs text-[var(--muted)] truncate">Key: {acct.maskedKeyId}</p>
            )}
          </div>
        </div>

        {/* Live account stats */}
        {acct && (
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2">
              <p className="text-xs text-[var(--muted)]">Equity</p>
              <p className="text-sm font-mono font-semibold">{fmtCurrency(parseFloat(acct.equity))}</p>
            </div>
            <div className="rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2">
              <p className="text-xs text-[var(--muted)]">Cash</p>
              <p className="text-sm font-mono font-semibold">{fmtCurrency(parseFloat(acct.cash))}</p>
            </div>
          </div>
        )}

        {/* Links */}
        <div className="flex gap-2">
          <a
            href="https://app.alpaca.markets/paper/dashboard/overview"
            target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-[var(--border)] text-xs text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)] transition-colors"
          >
            <ExternalLink size={11} />
            Open Alpaca
          </a>
          <button
            onClick={handleDisconnect}
            disabled={status.state === "disconnecting"}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border)] text-xs text-[var(--muted)] hover:text-red-400 hover:border-red-400/50 transition-colors disabled:opacity-50"
          >
            {status.state === "disconnecting"
              ? <Loader2 size={11} className="animate-spin" />
              : <Link2Off size={11} />
            }
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  // idle / form / testing
  const isForm    = status.state === "form" || status.state === "testing";
  const isTesting = status.state === "testing";

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 size={14} className="text-[var(--muted)]" />
          <span className="text-sm font-medium">Connect Alpaca Account</span>
        </div>
        <button
          onClick={() => setShowGuide((v) => !v)}
          className="flex items-center gap-1 text-xs text-[var(--accent)] hover:opacity-80"
        >
          How to get keys
          {showGuide ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* Step guide (collapsible) */}
      {showGuide && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] divide-y divide-[var(--border)] overflow-hidden">
          {GUIDE_STEPS.map((step, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3">
              <span className="w-5 h-5 rounded-full bg-[var(--accent)] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{step.label}</p>
                <p className="text-xs text-[var(--muted)] mt-0.5">{step.hint}</p>
              </div>
              {step.href && (
                <a
                  href={step.href}
                  target="_blank" rel="noopener noreferrer"
                  className="shrink-0 text-[var(--accent)] hover:opacity-80"
                >
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Key input form */}
      {isForm && (
        <div className="space-y-2">
          {/* Error */}
          {status.state === "form" && status.error && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
              <AlertCircle size={13} className="shrink-0 mt-0.5" />
              {status.error}
            </div>
          )}

          <div className="space-y-2">
            <input
              type="text"
              placeholder="API Key ID (e.g. PKXXXXXXXX…)"
              value={keyId}
              onChange={(e) => setKeyId(e.target.value)}
              disabled={isTesting}
              className={cn(
                "w-full px-3 py-2 rounded-lg border text-sm font-mono bg-[var(--surface-2)]",
                "border-[var(--border)] focus:outline-none focus:border-[var(--accent)]",
                "placeholder:text-[var(--muted)] disabled:opacity-50"
              )}
            />
            <div className="relative">
              <input
                type={showSecret ? "text" : "password"}
                placeholder="Secret Key"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                disabled={isTesting}
                className={cn(
                  "w-full px-3 py-2 pr-9 rounded-lg border text-sm font-mono bg-[var(--surface-2)]",
                  "border-[var(--border)] focus:outline-none focus:border-[var(--accent)]",
                  "placeholder:text-[var(--muted)] disabled:opacity-50"
                )}
              />
              <button
                type="button"
                onClick={() => setShowSecret((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)]"
                tabIndex={-1}
              >
                {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleConnect}
              disabled={isTesting}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {isTesting ? (
                <><Loader2 size={13} className="animate-spin" /> Verifying…</>
              ) : (
                <><Link2 size={13} /> Connect</>
              )}
            </button>
            <button
              onClick={() => { setStatus({ state: "idle" }); setKeyId(""); setSecret(""); }}
              disabled={isTesting}
              className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* CTA when in idle */}
      {status.state === "idle" && (
        <button
          onClick={() => { setShowGuide(true); setStatus({ state: "form" }); }}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-[var(--border)] text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)] transition-colors"
        >
          <Link2 size={13} />
          Link your Alpaca paper account
        </button>
      )}
    </div>
  );
}
