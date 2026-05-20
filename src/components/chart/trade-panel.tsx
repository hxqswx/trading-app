"use client";

/**
 * TradePanel — Buy / Sell widget, asset-type-aware.
 *
 * Correctness rules per asset type:
 *  - Stocks (US / HK / CN): integer share quantities, currency prefix on totals
 *  - Crypto:  fractional (0.0001 step), currency prefix on totals
 *  - Forex:   integer units of BASE currency (e.g. 100 USD for USD/CNY),
 *             rate shown without currency prefix, total shown in QUOTE currency
 *
 * Portfolio integration:
 *  - Fetches /api/portfolio on mount + after each successful order
 *  - Shows real available cash and current position qty
 *  - Client-side validation: insufficient funds (buy) and insufficient
 *    position (sell) — shows inline error BEFORE the server rejects
 */

import { useState, useEffect } from "react";
import { useTradingStore } from "@/lib/store";
import { useT } from "@/lib/hooks/use-t";
import { ASSET_META, currencySymbol } from "@/lib/mock";
import { getAsset } from "@/lib/asset-registry";
import { Card } from "@/components/ui/card";
import type { TradeOrder } from "@/lib/types";
import { Info, ChevronDown, ChevronUp, Zap, Wallet, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface TradePanelProps { symbol: string }
type OType = "market" | "limit" | "stop" | "stop_limit";

// ── Helpers ───────────────────────────────────────────────────────────────

/** Decimal places for rate / price display */
function priceDec(price: number, isForex: boolean, isCrypto: boolean): number {
  if (isForex)  return price < 0.01 ? 6 : 4;
  if (isCrypto) return price < 10   ? 6 : price < 1000 ? 4 : 2;
  return price < 10 ? 4 : 2;
}

/** Format a rate / price with appropriate decimal places */
function fmtPrice(price: number, sym: string, isForex: boolean, isCrypto: boolean): string {
  const dp = priceDec(price, isForex, isCrypto);
  return `${sym}${price.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp })}`;
}

/** Qty decimal places / step — forex & stocks use whole numbers */
function qtyStep(isForex: boolean, isCrypto: boolean): string {
  if (isCrypto) return "0.0001";
  return "1";
}
function qtyDp(isForex: boolean, isCrypto: boolean): number {
  if (isCrypto) return 4;
  return 2;
}

// ── Component ─────────────────────────────────────────────────────────────

export function TradePanel({ symbol }: TradePanelProps) {
  const { quotes, tradeMode, setTradeMode, addNotification, settings,
          portfolio, portfolioLoading, fetchPortfolio } = useTradingStore();
  const t = useT();

  // ── Asset metadata ─────────────────────────────────────────────────────
  const quote      = quotes[symbol];
  const metaFull   = ASSET_META[symbol];
  const regEntry   = !metaFull ? getAsset(symbol) : null;
  const assetType  = metaFull?.type ?? regEntry?.type ?? quote?.type ?? "stock";
  const currency   = metaFull?.currency ?? regEntry?.currency ?? quote?.currency ?? "USD";

  const isForex  = assetType === "forex";
  const isCrypto = assetType === "crypto";
  const isCN     = assetType === "cn";
  const isHK     = assetType === "hk";

  // Ticker label (what the user sees)
  const ticker = isForex
    ? symbol.slice(0, 3) + "/" + symbol.slice(3)          // "USD/CNY"
    : symbol.replace("USDT", "").replace(/^(HK|CN)/, ""); // "BTC", "AAPL", "0700"

  // For forex: what you're actually buying/selling
  const baseCurrency  = isForex ? symbol.slice(0, 3) : ticker;
  const quoteCurrency = isForex ? symbol.slice(3)    : currency;

  // Currency symbol for price/total display
  // Forex: the rate itself has no prefix (7.2456, not ¥7.2456)
  //        but the total cost is in quote currency
  const rateSym  = isForex ? "" : currencySymbol(currency);
  const totalSym = isForex ? currencySymbol(quoteCurrency) : currencySymbol(currency);

  const step = qtyStep(isForex, isCrypto);
  const dp   = qtyDp(isForex, isCrypto);

  // ── Portfolio state — shared from store, updated after every trade ────
  // Initial fetch on first mount (store is shared so only actually runs once)
  useEffect(() => { fetchPortfolio(); }, [fetchPortfolio]);

  const loadingPortfolio = portfolioLoading;
  const cash        = portfolio?.cash ?? 0;
  const positionQty = portfolio?.positions.find((p) => p.symbol === symbol)?.qty ?? 0;
  const avgEntry    = portfolio?.positions.find((p) => p.symbol === symbol)?.avgEntryPrice;

  // ── Order form state ───────────────────────────────────────────────────
  const [side,        setSide]        = useState<"buy" | "sell">("buy");
  const [orderType,   setOrderType]   = useState<OType>(settings.defaultOrderType as OType);
  const [qty,         setQty]         = useState("");
  const [limitPrice,  setLimitPrice]  = useState("");
  const [stopPrice,   setStopPrice]   = useState("");
  const [status,      setStatus]      = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message,     setMessage]     = useState("");
  const [showTypes,   setShowTypes]   = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isSimple   = tradeMode === "simple";
  const price      = quote?.price ?? 0;
  const execPrice  = (orderType === "limit" && limitPrice) ? parseFloat(limitPrice) : price;
  const qtyNum     = qty ? parseFloat(qty) : null;
  const estTotal   = qtyNum && execPrice ? qtyNum * execPrice : null;

  // Max buy: what the user can afford in units of the asset
  const maxAfford = price > 0 && cash > 0 ? cash / price : 0;

  // ── Client-side validation ─────────────────────────────────────────────
  let qtyError = "";
  if (qty && qtyNum !== null) {
    if (isNaN(qtyNum) || qtyNum <= 0) {
      qtyError = "qty must be > 0";
    } else if (side === "sell" && qtyNum > positionQty && positionQty >= 0) {
      qtyError = `${t.trade.insufficientPosition} (${positionQty.toFixed(dp)} ${baseCurrency})`;
    } else if (side === "buy" && estTotal !== null && cash > 0 && estTotal > cash * 1.001) {
      // 0.1% tolerance for floating point
      qtyError = `${t.trade.insufficientFunds} (${totalSym}${cash.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
    }
  }

  const ORDER_TYPES = [
    { value: "market"    , label: t.trade.market,    desc: t.trade.marketDesc    },
    { value: "limit"     , label: t.trade.limit,     desc: t.trade.limitDesc     },
    { value: "stop"      , label: t.trade.stop,      desc: t.trade.stopDesc      },
    { value: "stop_limit", label: t.trade.stopLimit, desc: t.trade.stopLimitDesc },
  ] as const;

  // ── Order submission ───────────────────────────────────────────────────
  async function placeOrder() {
    setStatus("loading");
    setMessage("");
    setShowConfirm(false);
    const effectiveType = isSimple ? "market" : orderType;
    const order: TradeOrder = {
      symbol, side,
      type:       effectiveType,
      qty:        parseFloat(qty),
      limitPrice: limitPrice ? parseFloat(limitPrice) : undefined,
      stopPrice:  stopPrice  ? parseFloat(stopPrice)  : undefined,
    };
    try {
      const res  = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Order failed");
      } else {
        setStatus("success");
        const fp = fmtPrice(execPrice, rateSym, isForex, isCrypto);
        setMessage(`✓ ${side === "buy" ? t.trade.bought : t.trade.sold} ${qty} ${baseCurrency} @ ${fp}`);
        addNotification({
          type:   "order",
          title:  `${side === "buy" ? t.trade.bought : t.trade.sold} ${qty} ${ticker}`,
          body:   `${effectiveType.charAt(0).toUpperCase() + effectiveType.slice(1)} order filled @ ${fp}`,
          symbol,
        });
        setQty("");
        // Refresh portfolio after trade
        fetchPortfolio();
        setTimeout(() => setStatus("idle"), 4000);
      }
    } catch (err) {
      setStatus("error");
      setMessage(String(err));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (qtyError) return; // block if client-side validation fails
    if (settings.confirmOrders && status !== "loading") {
      setShowConfirm(true);
      return;
    }
    await placeOrder();
  }

  // ── Set qty helpers ────────────────────────────────────────────────────
  function setBuyPct(pct: number) {
    if (price <= 0 || cash <= 0) return;
    setQty(((cash * pct / 100) / price).toFixed(isCrypto ? 4 : 0));
  }
  function setSellPct(pct: number) {
    if (positionQty <= 0) return;
    setQty((positionQty * pct / 100).toFixed(isCrypto ? 4 : 0));
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <Card className="p-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
          {t.trade.placeOrder}
        </span>
        <button
          onClick={() => setTradeMode(isSimple ? "pro" : "simple")}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <Zap size={11} className={!isSimple ? "text-[var(--accent)]" : ""} />
          {isSimple ? t.trade.simple : t.trade.pro}
        </button>
      </div>

      {/* Buy / Sell tabs */}
      <div className="grid grid-cols-2 border-y border-[var(--border)]">
        {(["buy", "sell"] as const).map((s) => (
          <button
            key={s}
            onClick={() => { setSide(s); setQty(""); setMessage(""); setStatus("idle"); }}
            className={cn(
              "py-2.5 text-sm font-semibold transition-colors relative",
              side === s
                ? s === "buy" ? "text-[var(--green)]" : "text-[var(--red)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            )}
          >
            {s === "buy" ? t.trade.buy : t.trade.sell}
            {side === s && (
              <span className={`absolute bottom-0 left-0 right-0 h-0.5 ${s === "buy" ? "bg-[var(--green)]" : "bg-[var(--red)]"}`} />
            )}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4">

        {/* ── Portfolio info strip ── */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          {/* Cash */}
          <div className="bg-[var(--surface-2)] rounded-lg px-3 py-2">
            <div className="text-[var(--muted)] flex items-center gap-1 mb-0.5">
              <Wallet size={9} /> {t.trade.available}
            </div>
            <div className="font-mono font-semibold">
              {loadingPortfolio
                ? <span className="animate-pulse text-[var(--muted)]">…</span>
                : `${currencySymbol("USD")}${cash.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              }
            </div>
          </div>
          {/* Position */}
          <div className="bg-[var(--surface-2)] rounded-lg px-3 py-2">
            <div className="text-[var(--muted)] flex items-center gap-1 mb-0.5">
              <TrendingUp size={9} /> {t.trade.position}
            </div>
            <div className="font-mono font-semibold">
              {loadingPortfolio
                ? <span className="animate-pulse text-[var(--muted)]">…</span>
                : positionQty > 0
                  ? <>{positionQty.toFixed(isCrypto ? 4 : 0)} <span className="text-[var(--muted)] font-normal">{baseCurrency}</span></>
                  : <span className="text-[var(--muted)] font-normal">{t.trade.noPosition}</span>
              }
            </div>
            {positionQty > 0 && avgEntry && (
              <div className="text-[var(--muted)] text-[9px] mt-0.5">
                avg {fmtPrice(avgEntry, rateSym, isForex, isCrypto)}
              </div>
            )}
          </div>
        </div>

        {/* Pro: order type selector */}
        {!isSimple && (
          <div>
            <label className="text-xs text-[var(--muted)] mb-1.5 block">{t.trade.orderType}</label>
            <button
              type="button"
              onClick={() => setShowTypes(!showTypes)}
              className="w-full flex items-center justify-between bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm hover:border-[var(--accent)] transition-colors"
            >
              <span>{ORDER_TYPES.find((o) => o.value === orderType)?.label}</span>
              {showTypes
                ? <ChevronUp size={14} className="text-[var(--muted)]" />
                : <ChevronDown size={14} className="text-[var(--muted)]" />
              }
            </button>
            {showTypes && (
              <div className="mt-1 rounded-lg border border-[var(--border)] overflow-hidden bg-[var(--surface-2)]">
                {ORDER_TYPES.map((ot) => (
                  <button
                    key={ot.value}
                    type="button"
                    onClick={() => { setOrderType(ot.value as OType); setShowTypes(false); }}
                    className={cn(
                      "w-full text-left px-3 py-2.5 text-sm hover:bg-[var(--surface)] transition-colors border-b border-[var(--border)] last:border-0",
                      orderType === ot.value && "text-[var(--accent)]"
                    )}
                  >
                    <div className="font-medium">{ot.label}</div>
                    <div className="text-xs text-[var(--muted)] mt-0.5">{ot.desc}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Quantity input ── */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-[var(--muted)]">
              {isSimple ? t.trade.amount : t.trade.qty}
              <span className="ml-1 text-[var(--foreground)]">({baseCurrency})</span>
            </label>
            {side === "buy" && price > 0 && cash > 0 && (
              <button
                type="button"
                onClick={() => setBuyPct(100)}
                className="text-[10px] text-[var(--accent)] hover:underline"
              >
                {t.trade.maxQty} ({maxAfford.toFixed(isCrypto ? 4 : 0)})
              </button>
            )}
          </div>
          <input
            type="number"
            step={step}
            min={step}
            value={qty}
            required
            onChange={(e) => setQty(e.target.value)}
            placeholder={`0 ${baseCurrency}`}
            className={cn(
              "w-full bg-[var(--surface-2)] border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none transition-colors",
              qtyError ? "border-[var(--red)] focus:border-[var(--red)]" : "border-[var(--border)] focus:border-[var(--accent)]"
            )}
          />
          {/* Qty error */}
          {qtyError && (
            <p className="text-[11px] text-[var(--red)] mt-1">{qtyError}</p>
          )}
          {/* Position description */}
          {isSimple && qty && !qtyError && (
            <div className="mt-1 text-[11px] text-[var(--muted)]">
              {side === "buy" ? t.trade.youllOwn : t.trade.youllSell}{" "}
              <strong className="text-[var(--foreground)]">{qty} {baseCurrency}</strong>
            </div>
          )}
        </div>

        {/* ── Quick % buttons ── */}
        {isSimple && price > 0 && (
          <div className="grid grid-cols-4 gap-1">
            {side === "buy"
              ? [25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setBuyPct(pct)}
                  disabled={cash <= 0}
                  className="py-1 rounded-md text-xs bg-[var(--surface-2)] text-[var(--muted)] hover:bg-[var(--green)]/10 hover:text-[var(--green)] transition-colors disabled:opacity-30"
                >
                  {pct}%
                </button>
              ))
              : [
                { label: "25%", fn: () => setSellPct(25) },
                { label: "50%", fn: () => setSellPct(50) },
                { label: "75%", fn: () => setSellPct(75) },
                { label: t.trade.sellAll, fn: () => setSellPct(100) },
              ].map(({ label, fn }) => (
                <button
                  key={label}
                  type="button"
                  onClick={fn}
                  disabled={positionQty <= 0}
                  className="py-1 rounded-md text-xs bg-[var(--surface-2)] text-[var(--muted)] hover:bg-[var(--red)]/10 hover:text-[var(--red)] transition-colors disabled:opacity-30"
                >
                  {label}
                </button>
              ))
            }
          </div>
        )}

        {/* Pro: limit price */}
        {!isSimple && (orderType === "limit" || orderType === "stop_limit") && (
          <div>
            <label className="text-xs text-[var(--muted)] mb-1.5 block">{t.trade.limitPrice}</label>
            <input
              type="number"
              step="any"
              value={limitPrice}
              required
              onChange={(e) => setLimitPrice(e.target.value)}
              placeholder={price.toFixed(priceDec(price, isForex, isCrypto))}
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>
        )}

        {/* Pro: stop price */}
        {!isSimple && (orderType === "stop" || orderType === "stop_limit") && (
          <div>
            <label className="text-xs text-[var(--muted)] mb-1.5 block">{t.trade.stopPrice}</label>
            <input
              type="number"
              step="any"
              value={stopPrice}
              required
              onChange={(e) => setStopPrice(e.target.value)}
              placeholder={price.toFixed(priceDec(price, isForex, isCrypto))}
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>
        )}

        {/* ── Cost breakdown ── */}
        {estTotal !== null && !qtyError && (
          <div className="rounded-lg bg-[var(--surface-2)] divide-y divide-[var(--border)] text-xs">
            <div className="flex justify-between px-3 py-2">
              <span className="text-[var(--muted)]">{t.trade.estPrice}</span>
              <span className="font-mono">
                {fmtPrice(execPrice, rateSym, isForex, isCrypto)}
                {isForex && <span className="text-[var(--muted)] ml-1">{quoteCurrency}/{baseCurrency}</span>}
              </span>
            </div>
            <div className="flex justify-between px-3 py-2">
              <span className="text-[var(--muted)]">{t.trade.qty}</span>
              <span className="font-mono">{qty} {baseCurrency}</span>
            </div>
            <div className="flex justify-between px-3 py-2 font-semibold">
              <span>{t.trade.estTotal}</span>
              <span className="font-mono">
                {totalSym}{estTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                {isForex && <span className="text-[var(--muted)] ml-1 font-normal">{quoteCurrency}</span>}
              </span>
            </div>
          </div>
        )}

        {/* ── Status message ── */}
        {message && (
          <div className={cn(
            "text-xs rounded-lg px-3 py-2.5 leading-relaxed",
            status === "success"
              ? "bg-[rgba(63,185,80,0.08)] text-[var(--green)] border border-[rgba(63,185,80,0.2)]"
              : "bg-[rgba(248,81,73,0.08)] text-[var(--red)] border border-[rgba(248,81,73,0.2)]"
          )}>{message}</div>
        )}

        {/* ── Confirm dialog ── */}
        {showConfirm && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-xs space-y-2">
            <p className="font-medium text-[var(--foreground)]">
              {side === "buy" ? t.trade.buy : t.trade.sell} {qty} {ticker}
              {" @ "}{fmtPrice(execPrice, rateSym, isForex, isCrypto)}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={placeOrder}
                className={`flex-1 py-2 rounded-lg text-white font-semibold ${side === "buy" ? "bg-[var(--green)]" : "bg-[var(--red)]"}`}
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Submit button ── */}
        <button
          type="submit"
          disabled={status === "loading" || !qty || !!qtyError || showConfirm}
          className={cn(
            "w-full py-3 rounded-xl text-sm font-bold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed",
            side === "buy"
              ? "bg-[var(--green)] hover:brightness-110 text-white"
              : "bg-[var(--red)] hover:brightness-110 text-white"
          )}
        >
          {status === "loading"
            ? t.trade.placing
            : `${side === "buy" ? t.trade.buy : t.trade.sell} ${ticker}`
          }
        </button>

        {isSimple && (
          <p className="text-[10px] text-[var(--muted)] text-center flex items-center justify-center gap-1">
            <Info size={10} /> {t.trade.paperTrading}
          </p>
        )}
      </form>
    </Card>
  );
}
