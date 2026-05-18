"use client";

import { create } from "zustand";
import type { Quote, OrderBook, AIAnalysis, WatchlistItem } from "./types";

export const DEFAULT_WATCHLIST: WatchlistItem[] = [
  { symbol: "BTCUSDT", name: "Bitcoin",   type: "crypto" },
  { symbol: "ETHUSDT", name: "Ethereum",  type: "crypto" },
  { symbol: "SOLUSDT", name: "Solana",    type: "crypto" },
  { symbol: "AAPL",    name: "Apple",     type: "stock"  },
  { symbol: "NVDA",    name: "NVIDIA",    type: "stock"  },
  { symbol: "TSLA",    name: "Tesla",     type: "stock"  },
  { symbol: "MSFT",    name: "Microsoft", type: "stock"  },
  { symbol: "GOOGL",   name: "Alphabet",  type: "stock"  },
];

const HISTORY_LIMIT = 60; // keep last 60 price points per symbol

interface TradingStore {
  activeSymbol: string;
  setActiveSymbol: (s: string) => void;

  quotes: Record<string, Quote>;
  updateQuote:  (q: Quote) => void;
  updateQuotes: (qs: Quote[]) => void;

  /** Ring buffer of recent prices per symbol (for sparklines) */
  priceHistory: Record<string, number[]>;
  addPriceHistory: (symbol: string, price: number) => void;

  orderBook: OrderBook | null;
  setOrderBook: (ob: OrderBook) => void;

  aiAnalysis: Record<string, AIAnalysis>;
  setAIAnalysis: (a: AIAnalysis) => void;

  watchlist: WatchlistItem[];
  addToWatchlist:      (item: WatchlistItem) => void;
  removeFromWatchlist: (symbol: string) => void;

  /** UI mode persisted for session */
  tradeMode: "simple" | "pro";
  setTradeMode: (m: "simple" | "pro") => void;
}

export const useTradingStore = create<TradingStore>((set) => ({
  activeSymbol: "BTCUSDT",
  setActiveSymbol: (activeSymbol) => set({ activeSymbol }),

  quotes: {},
  updateQuote:  (q) => set((s) => ({ quotes: { ...s.quotes, [q.symbol]: q } })),
  updateQuotes: (qs) =>
    set((s) => ({
      quotes: { ...s.quotes, ...Object.fromEntries(qs.map((q) => [q.symbol, q])) },
    })),

  priceHistory: {},
  addPriceHistory: (symbol, price) =>
    set((s) => {
      const prev = s.priceHistory[symbol] ?? [];
      const next = prev.length >= HISTORY_LIMIT ? [...prev.slice(1), price] : [...prev, price];
      return { priceHistory: { ...s.priceHistory, [symbol]: next } };
    }),

  orderBook: null,
  setOrderBook: (orderBook) => set({ orderBook }),

  aiAnalysis: {},
  setAIAnalysis: (a) =>
    set((s) => ({ aiAnalysis: { ...s.aiAnalysis, [a.symbol]: a } })),

  watchlist: DEFAULT_WATCHLIST,
  addToWatchlist: (item) =>
    set((s) => ({
      watchlist: s.watchlist.find((w) => w.symbol === item.symbol)
        ? s.watchlist
        : [...s.watchlist, item],
    })),
  removeFromWatchlist: (symbol) =>
    set((s) => ({ watchlist: s.watchlist.filter((w) => w.symbol !== symbol) })),

  tradeMode: "simple",
  setTradeMode: (tradeMode) => set({ tradeMode }),
}));
