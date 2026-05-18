"use client";

import { create } from "zustand";
import type {
  Quote, OrderBook, AIAnalysis, WatchlistItem,
  AppNotification, UserSettings,
} from "./types";
import type { Lang } from "./i18n";

export const DEFAULT_WATCHLIST: WatchlistItem[] = [
  // Crypto
  { symbol: "BTCUSDT", name: "Bitcoin",        type: "crypto" },
  { symbol: "ETHUSDT", name: "Ethereum",        type: "crypto" },
  { symbol: "SOLUSDT", name: "Solana",          type: "crypto" },
  // US Equities
  { symbol: "AAPL",    name: "Apple",           type: "stock"  },
  { symbol: "NVDA",    name: "NVIDIA",          type: "stock"  },
  { symbol: "TSLA",    name: "Tesla",           type: "stock"  },
  { symbol: "MSFT",    name: "Microsoft",       type: "stock"  },
  { symbol: "GOOGL",   name: "Alphabet",        type: "stock"  },
  // China / HK
  { symbol: "BABA",    name: "Alibaba",         type: "stock"  },
  { symbol: "PDD",     name: "Pinduoduo",       type: "stock"  },
  { symbol: "BIDU",    name: "Baidu",           type: "stock"  },
  { symbol: "NIO",     name: "NIO",             type: "stock"  },
  { symbol: "HK0700",  name: "Tencent",         type: "hk"     },
  { symbol: "HK9988",  name: "Alibaba HK",      type: "hk"     },
  { symbol: "HK3690",  name: "Meituan",         type: "hk"     },
  { symbol: "HK1810",  name: "Xiaomi",          type: "hk"     },
  // Mainland China A-shares
  { symbol: "CNMTAI",  name: "Kweichow Moutai", type: "cn"     },
  { symbol: "CNCATL",  name: "CATL",            type: "cn"     },
  { symbol: "CNBYD",   name: "BYD",             type: "cn"     },
  { symbol: "CNPING",  name: "Ping An",         type: "cn"     },
  { symbol: "CNICBC",  name: "ICBC",            type: "cn"     },
];

const DEFAULT_SETTINGS: UserSettings = {
  defaultOrderType: "market",
  confirmOrders:    false,
  pnlDisplay:       "absolute",
};

const HISTORY_LIMIT    = 60;
const NOTIFICATION_MAX = 50; // keep the last 50

let _notifId = 0;
function nextId() { return `n-${Date.now()}-${++_notifId}`; }

interface TradingStore {
  // ── Market data ──────────────────────────────────────────────────────────
  activeSymbol: string;
  setActiveSymbol: (s: string) => void;

  quotes: Record<string, Quote>;
  updateQuote:  (q: Quote)   => void;
  updateQuotes: (qs: Quote[]) => void;

  priceHistory: Record<string, number[]>;
  addPriceHistory: (symbol: string, price: number) => void;

  orderBook: OrderBook | null;
  setOrderBook: (ob: OrderBook) => void;

  aiAnalysis: Record<string, AIAnalysis>;
  setAIAnalysis: (a: AIAnalysis) => void;

  // ── Watchlist ─────────────────────────────────────────────────────────────
  watchlist: WatchlistItem[];
  addToWatchlist:      (item: WatchlistItem) => void;
  removeFromWatchlist: (symbol: string) => void;

  // ── UI state ──────────────────────────────────────────────────────────────
  tradeMode: "simple" | "pro";
  setTradeMode: (m: "simple" | "pro") => void;

  lang: Lang;
  setLang: (l: Lang) => void;

  // ── Notifications ─────────────────────────────────────────────────────────
  notifications: AppNotification[];
  addNotification: (n: Omit<AppNotification, "id" | "timestamp" | "read">) => void;
  markAllRead:          () => void;
  dismissNotification:  (id: string) => void;

  notificationsOpen: boolean;
  openNotifications:  () => void;
  closeNotifications: () => void;

  // ── Settings ──────────────────────────────────────────────────────────────
  settings: UserSettings;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;

  settingsOpen: boolean;
  openSettings:  () => void;
  closeSettings: () => void;
}

export const useTradingStore = create<TradingStore>((set) => ({
  // ── Market data ──────────────────────────────────────────────────────────
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

  // ── Watchlist ─────────────────────────────────────────────────────────────
  watchlist: DEFAULT_WATCHLIST,
  addToWatchlist: (item) =>
    set((s) => ({
      watchlist: s.watchlist.find((w) => w.symbol === item.symbol)
        ? s.watchlist
        : [...s.watchlist, item],
    })),
  removeFromWatchlist: (symbol) =>
    set((s) => ({ watchlist: s.watchlist.filter((w) => w.symbol !== symbol) })),

  // ── UI state ──────────────────────────────────────────────────────────────
  tradeMode: "simple",
  setTradeMode: (tradeMode) => set({ tradeMode }),

  lang: "en",
  setLang: (lang) => set({ lang }),

  // ── Notifications ─────────────────────────────────────────────────────────
  notifications: [],
  addNotification: (n) =>
    set((s) => {
      const entry: AppNotification = {
        ...n, id: nextId(), timestamp: Date.now(), read: false,
      };
      const list = [entry, ...s.notifications].slice(0, NOTIFICATION_MAX);
      return { notifications: list };
    }),
  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    })),
  dismissNotification: (id) =>
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),

  notificationsOpen: false,
  openNotifications:  () => set({ notificationsOpen: true,  settingsOpen: false }),
  closeNotifications: () => set({ notificationsOpen: false }),

  // ── Settings ──────────────────────────────────────────────────────────────
  settings: DEFAULT_SETTINGS,
  updateSetting: (key, value) =>
    set((s) => ({ settings: { ...s.settings, [key]: value } })),

  settingsOpen: false,
  openSettings:  () => set({ settingsOpen: true,  notificationsOpen: false }),
  closeSettings: () => set({ settingsOpen: false }),
}));
