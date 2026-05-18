"use client";

import { create } from "zustand";
import type { Quote, OrderBook, AIAnalysis, WatchlistItem } from "./types";

export const DEFAULT_WATCHLIST: WatchlistItem[] = [
  { symbol: "AAPL",    name: "Apple",      type: "stock"  },
  { symbol: "TSLA",    name: "Tesla",       type: "stock"  },
  { symbol: "NVDA",    name: "NVIDIA",      type: "stock"  },
  { symbol: "MSFT",    name: "Microsoft",   type: "stock"  },
  { symbol: "GOOGL",   name: "Alphabet",    type: "stock"  },
  { symbol: "BTCUSDT", name: "Bitcoin",     type: "crypto" },
  { symbol: "ETHUSDT", name: "Ethereum",    type: "crypto" },
  { symbol: "SOLUSDT", name: "Solana",      type: "crypto" },
];

interface TradingStore {
  // Active symbol
  activeSymbol: string;
  setActiveSymbol: (s: string) => void;

  // Quotes map  symbol -> Quote
  quotes: Record<string, Quote>;
  updateQuote: (q: Quote) => void;
  updateQuotes: (qs: Quote[]) => void;

  // OrderBook
  orderBook: OrderBook | null;
  setOrderBook: (ob: OrderBook) => void;

  // AI Analysis
  aiAnalysis: Record<string, AIAnalysis>;
  setAIAnalysis: (a: AIAnalysis) => void;

  // Watchlist
  watchlist: WatchlistItem[];
  addToWatchlist: (item: WatchlistItem) => void;
  removeFromWatchlist: (symbol: string) => void;
}

export const useTradingStore = create<TradingStore>((set) => ({
  activeSymbol: "BTCUSDT",

  setActiveSymbol: (activeSymbol) => set({ activeSymbol }),

  quotes: {},
  updateQuote: (q) =>
    set((s) => ({ quotes: { ...s.quotes, [q.symbol]: q } })),
  updateQuotes: (qs) =>
    set((s) => ({
      quotes: { ...s.quotes, ...Object.fromEntries(qs.map((q) => [q.symbol, q])) },
    })),

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
}));
