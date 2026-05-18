"use client";

import { useState } from "react";
import { useTradingStore } from "@/lib/store";
import { useT } from "@/lib/hooks/use-t";
import { ASSET_META, currencySymbol } from "@/lib/mock";
import { Card } from "@/components/ui/card";
import type { TradeOrder } from "@/lib/types";
import { Info, ChevronDown, ChevronUp, Zap } from "lucide-react";

interface TradePanelProps { symbol: string }
type OType = "market" | "limit" | "stop" | "stop_limit";

export function TradePanel({ symbol }: TradePanelProps) {
  const { quotes, tradeMode, setTradeMode } = useTradingStore();
  const t     = useT();
  const quote = quotes[symbol];
  const meta  = ASSET_META[symbol];
  const sym   = currencySymbol(meta?.currency ?? "USD");

  const [side,       setSide]       = useState<"buy" | "sell">("buy");
  const [orderType,  setOrderType]  = useState<OType>("market");
  const [qty,        setQty]        = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [stopPrice,  setStopPrice]  = useState("");
  const [status,     setStatus]     = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message,    setMessage]    = useState("");
  const [showTypes,  setShowTypes]  = useState(false);

  const isSimple  = tradeMode === "simple";
  const price     = quote?.price ?? 0;
  const execPrice = (orderType === "limit" && limitPrice) ? parseFloat(limitPrice) : price;
  const estTotal  = qty && execPrice ? parseFloat(qty) * execPrice : null;
  const maxAfford = price > 0 ? 24_200 / price : 0;
  const ticker    = symbol.replace("USDT","").replace(/^(HK|CN)/,"");

  const ORDER_TYPES = [
    { value: "market"    , label: t.trade.market,    desc: t.trade.marketDesc    },
    { value: "limit"     , label: t.trade.limit,     desc: t.trade.limitDesc     },
    { value: "stop"      , label: t.trade.stop,      desc: t.trade.stopDesc      },
    { value: "stop_limit", label: t.trade.stopLimit, desc: t.trade.stopLimitDesc },
  ] as const;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    const order: TradeOrder = {
      symbol, side,
      type:       isSimple ? "market" : orderType,
      qty:        parseFloat(qty),
      limitPrice: limitPrice ? parseFloat(limitPrice) : undefined,
      stopPrice:  stopPrice  ? parseFloat(stopPrice)  : undefined,
    };
    try {
      const res  = await fetch("/api/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(order) });
      const data = await res.json();
      if (!res.ok) { setStatus("error"); setMessage(data.error ?? "Order failed"); }
      else {
        setStatus("success");
        setMessage(`✓ ${side === "buy" ? t.trade.bought : t.trade.sold} ${qty} ${ticker} ${t.trade.at} ${t.trade.market.toLowerCase()}`);
        setQty("");
      }
    } catch (err) { setStatus("error"); setMessage(String(err)); }
  }

  return (
    <Card className="p-0 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">{t.trade.placeOrder}</span>
        <button onClick={() => setTradeMode(isSimple ? "pro" : "simple")}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <Zap size={11} className={!isSimple ? "text-[var(--accent)]" : ""} />
          {isSimple ? t.trade.simple : t.trade.pro}
        </button>
      </div>

      {/* Buy / Sell tabs */}
      <div className="grid grid-cols-2 border-y border-[var(--border)]">
        {(["buy","sell"] as const).map((s) => (
          <button key={s} onClick={() => setSide(s)}
            className={`py-2.5 text-sm font-semibold transition-colors relative ${
              side === s ? (s === "buy" ? "text-[var(--green)]" : "text-[var(--red)]") : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {s === "buy" ? t.trade.buy : t.trade.sell}
            {side === s && <span className={`absolute bottom-0 left-0 right-0 h-0.5 ${s === "buy" ? "bg-[var(--green)]" : "bg-[var(--red)]"}`} />}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4">

        {/* Pro: order type */}
        {!isSimple && (
          <div>
            <label className="text-xs text-[var(--muted)] mb-1.5 block">{t.trade.orderType}</label>
            <button type="button" onClick={() => setShowTypes(!showTypes)}
              className="w-full flex items-center justify-between bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm hover:border-[var(--accent)] transition-colors"
            >
              <span>{ORDER_TYPES.find((o) => o.value === orderType)?.label}</span>
              {showTypes ? <ChevronUp size={14} className="text-[var(--muted)]" /> : <ChevronDown size={14} className="text-[var(--muted)]" />}
            </button>
            {showTypes && (
              <div className="mt-1 rounded-lg border border-[var(--border)] overflow-hidden bg-[var(--surface-2)]">
                {ORDER_TYPES.map((ot) => (
                  <button key={ot.value} type="button"
                    onClick={() => { setOrderType(ot.value as OType); setShowTypes(false); }}
                    className={`w-full text-left px-3 py-2.5 text-sm hover:bg-[var(--surface)] transition-colors border-b border-[var(--border)] last:border-0 ${orderType === ot.value ? "text-[var(--accent)]" : ""}`}
                  >
                    <div className="font-medium">{ot.label}</div>
                    <div className="text-xs text-[var(--muted)] mt-0.5">{ot.desc}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Qty */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-[var(--muted)]">{isSimple ? `${t.trade.amount} (${ticker})` : t.trade.qty}</label>
            {isSimple && side === "buy" && (
              <button type="button" onClick={() => setQty(maxAfford.toFixed(4))}
                className="text-[10px] text-[var(--accent)] hover:underline"
              >{t.trade.maxQty} ({maxAfford.toFixed(4)})</button>
            )}
          </div>
          <input type="number" step="any" min="0" value={qty} required onChange={(e) => setQty(e.target.value)}
            placeholder={`0.00 ${ticker}`}
            className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
          {isSimple && qty && (
            <div className="mt-1 text-[11px] text-[var(--muted)]">
              {side === "buy" ? t.trade.youllOwn : t.trade.youllSell} <strong className="text-[var(--foreground)]">{qty} {ticker}</strong>
            </div>
          )}
        </div>

        {/* Quick % buttons */}
        {isSimple && side === "buy" && price > 0 && (
          <div className="grid grid-cols-4 gap-1">
            {[25, 50, 75, 100].map((pct) => (
              <button key={pct} type="button"
                onClick={() => setQty(((24_200 * pct / 100) / price).toFixed(4))}
                className="py-1 rounded-md text-xs bg-[var(--surface-2)] text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)] transition-colors"
              >{pct}%</button>
            ))}
          </div>
        )}

        {/* Limit price */}
        {!isSimple && (orderType === "limit" || orderType === "stop_limit") && (
          <div>
            <label className="text-xs text-[var(--muted)] mb-1.5 block">{t.trade.limitPrice}</label>
            <input type="number" step="any" value={limitPrice} required onChange={(e) => setLimitPrice(e.target.value)}
              placeholder={price.toFixed(2)}
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>
        )}

        {/* Stop price */}
        {!isSimple && (orderType === "stop" || orderType === "stop_limit") && (
          <div>
            <label className="text-xs text-[var(--muted)] mb-1.5 block">{t.trade.stopPrice}</label>
            <input type="number" step="any" value={stopPrice} required onChange={(e) => setStopPrice(e.target.value)}
              placeholder={price.toFixed(2)}
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>
        )}

        {/* Cost breakdown */}
        {estTotal !== null && (
          <div className="rounded-lg bg-[var(--surface-2)] divide-y divide-[var(--border)] text-xs">
            <div className="flex justify-between px-3 py-2">
              <span className="text-[var(--muted)]">{t.trade.estPrice}</span>
              <span className="font-mono">{sym}{execPrice.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:4})}</span>
            </div>
            <div className="flex justify-between px-3 py-2">
              <span className="text-[var(--muted)]">{t.trade.qty}</span>
              <span className="font-mono">{qty} {ticker}</span>
            </div>
            <div className="flex justify-between px-3 py-2 font-semibold">
              <span>{t.trade.estTotal}</span>
              <span className="font-mono">{sym}{estTotal.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
            </div>
          </div>
        )}

        {/* Status */}
        {message && (
          <div className={`text-xs rounded-lg px-3 py-2.5 leading-relaxed ${
            status === "success"
              ? "bg-[rgba(63,185,80,0.08)] text-[var(--green)] border border-[rgba(63,185,80,0.2)]"
              : "bg-[rgba(248,81,73,0.08)] text-[var(--red)] border border-[rgba(248,81,73,0.2)]"
          }`}>{message}</div>
        )}

        <button type="submit" disabled={status === "loading" || !qty}
          className={`w-full py-3 rounded-xl text-sm font-bold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
            side === "buy" ? "bg-[var(--green)] hover:brightness-110 text-white" : "bg-[var(--red)] hover:brightness-110 text-white"
          }`}
        >
          {status === "loading" ? t.trade.placing : `${side === "buy" ? t.trade.buy : t.trade.sell} ${ticker}`}
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
