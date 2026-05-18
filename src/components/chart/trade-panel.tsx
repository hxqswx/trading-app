"use client";

import { useState } from "react";
import { useTradingStore } from "@/lib/store";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { TradeOrder } from "@/lib/types";

interface TradePanelProps {
  symbol: string;
}

type OrderType = "market" | "limit" | "stop" | "stop_limit";

export function TradePanel({ symbol }: TradePanelProps) {
  const { quotes } = useTradingStore();
  const quote = quotes[symbol];

  const [side, setSide]           = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [qty, setQty]             = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [stopPrice, setStopPrice]   = useState("");
  const [status, setStatus]         = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage]       = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    const order: TradeOrder = {
      symbol,
      side,
      type:        orderType,
      qty:         parseFloat(qty),
      limitPrice:  limitPrice ? parseFloat(limitPrice) : undefined,
      stopPrice:   stopPrice  ? parseFloat(stopPrice)  : undefined,
    };

    try {
      const res  = await fetch("/api/order", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(order),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Order failed");
      } else {
        setStatus("success");
        setMessage(`Order placed: ${side.toUpperCase()} ${qty} ${symbol}`);
        setQty("");
      }
    } catch (e) {
      setStatus("error");
      setMessage(String(e));
    }
  }

  const estTotal = qty && quote ? parseFloat(qty) * quote.price : null;

  return (
    <Card className="p-0 overflow-hidden">
      <CardHeader className="px-4 pt-4 pb-3 mb-0">
        <CardTitle>Place Order</CardTitle>
        {quote && (
          <span className="text-xs font-mono text-[var(--muted)]">
            {quote.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        )}
      </CardHeader>

      {/* Buy / Sell toggle */}
      <div className="grid grid-cols-2 border-b border-[var(--border)]">
        <button
          onClick={() => setSide("buy")}
          className={`py-2.5 text-sm font-semibold transition-colors ${
            side === "buy"
              ? "bg-[rgba(63,185,80,0.15)] text-[var(--green)] border-b-2 border-[var(--green)]"
              : "text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setSide("sell")}
          className={`py-2.5 text-sm font-semibold transition-colors ${
            side === "sell"
              ? "bg-[rgba(248,81,73,0.15)] text-[var(--red)] border-b-2 border-[var(--red)]"
              : "text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          Sell
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4">
        {/* Order type */}
        <div>
          <label className="text-xs text-[var(--muted)] mb-1.5 block">Order Type</label>
          <div className="grid grid-cols-2 gap-1">
            {(["market", "limit", "stop", "stop_limit"] as OrderType[]).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setOrderType(t)}
                className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  orderType === t
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {t.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </button>
            ))}
          </div>
        </div>

        {/* Qty */}
        <div>
          <label className="text-xs text-[var(--muted)] mb-1.5 block">Quantity</label>
          <input
            type="number"
            step="any"
            min="0"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder="0.00"
            required
            className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>

        {/* Limit price */}
        {(orderType === "limit" || orderType === "stop_limit") && (
          <div>
            <label className="text-xs text-[var(--muted)] mb-1.5 block">Limit Price</label>
            <input
              type="number"
              step="any"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              placeholder={quote ? quote.price.toFixed(2) : "0.00"}
              required
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>
        )}

        {/* Stop price */}
        {(orderType === "stop" || orderType === "stop_limit") && (
          <div>
            <label className="text-xs text-[var(--muted)] mb-1.5 block">Stop Price</label>
            <input
              type="number"
              step="any"
              value={stopPrice}
              onChange={(e) => setStopPrice(e.target.value)}
              placeholder={quote ? quote.price.toFixed(2) : "0.00"}
              required
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>
        )}

        {/* Estimated total */}
        {estTotal !== null && (
          <div className="flex justify-between text-xs text-[var(--muted)] bg-[var(--surface-2)] rounded-lg px-3 py-2">
            <span>Est. Total</span>
            <span className="font-mono text-[var(--foreground)]">
              ${estTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}

        {/* Status message */}
        {message && (
          <div className={`text-xs rounded-lg px-3 py-2 ${
            status === "success"
              ? "bg-[rgba(63,185,80,0.1)] text-[var(--green)]"
              : "bg-[rgba(248,81,73,0.1)] text-[var(--red)]"
          }`}>
            {message}
          </div>
        )}

        <Button
          type="submit"
          variant={side === "buy" ? "buy" : "sell"}
          size="lg"
          disabled={status === "loading"}
          className="w-full mt-1"
        >
          {status === "loading"
            ? "Placing…"
            : `${side === "buy" ? "Buy" : "Sell"} ${symbol.replace("USDT", "")}`}
        </Button>
      </form>
    </Card>
  );
}
