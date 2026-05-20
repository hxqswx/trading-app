"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Quote, OrderBook, AIAnalysis, WatchlistItem,
  AppNotification, UserSettings,
} from "./types";
import type { Lang } from "./i18n";

export const DEFAULT_WATCHLIST: WatchlistItem[] = [
  // Crypto  (forex rates have their own dedicated panel — no need to be in watchlist)
  { symbol: "BTCUSDT", name: "Bitcoin",        nameCN: "比特币",      type: "crypto" },
  { symbol: "ETHUSDT", name: "Ethereum",        nameCN: "以太坊",      type: "crypto" },
  { symbol: "SOLUSDT", name: "Solana",          nameCN: "索拉纳",      type: "crypto" },
  // US Equities
  { symbol: "AAPL",    name: "Apple",           nameCN: "苹果",        type: "stock"  },
  { symbol: "NVDA",    name: "NVIDIA",          nameCN: "英伟达",      type: "stock"  },
  { symbol: "TSLA",    name: "Tesla",           nameCN: "特斯拉",      type: "stock"  },
  { symbol: "MSFT",    name: "Microsoft",       nameCN: "微软",        type: "stock"  },
  { symbol: "GOOGL",   name: "Alphabet",        nameCN: "谷歌",        type: "stock"  },
  { symbol: "META",    name: "Meta Platforms",  nameCN: "Meta",        type: "stock"  },
  // China / HK
  { symbol: "BABA",    name: "Alibaba",         nameCN: "阿里巴巴",    type: "stock"  },
  { symbol: "PDD",     name: "Pinduoduo",       nameCN: "拼多多",      type: "stock"  },
  { symbol: "BIDU",    name: "Baidu",           nameCN: "百度",        type: "stock"  },
  { symbol: "NIO",     name: "NIO",             nameCN: "蔚来",        type: "stock"  },
  { symbol: "HK0700",  name: "Tencent",         nameCN: "腾讯控股",    type: "hk"     },
  { symbol: "HK9988",  name: "Alibaba HK",      nameCN: "阿里巴巴-W",  type: "hk"     },
  { symbol: "HK3690",  name: "Meituan",         nameCN: "美团-W",      type: "hk"     },
  { symbol: "HK1810",  name: "Xiaomi",          nameCN: "小米集团-W",  type: "hk"     },
  // Mainland China A-shares
  { symbol: "CNMTAI",  name: "Kweichow Moutai", nameCN: "贵州茅台",    type: "cn"     },
  { symbol: "CNCATL",  name: "CATL",            nameCN: "宁德时代",    type: "cn"     },
  { symbol: "CNBYD",   name: "BYD",             nameCN: "比亚迪",      type: "cn"     },
  { symbol: "CNPING",  name: "Ping An",         nameCN: "中国平安",    type: "cn"     },
  { symbol: "CNICBC",  name: "ICBC",            nameCN: "工商银行",    type: "cn"     },
];

const DEFAULT_SETTINGS: UserSettings = {
  defaultOrderType: "market",
  confirmOrders:    false,
  pnlDisplay:       "absolute",
};

const HISTORY_LIMIT    = 60;
const NOTIFICATION_MAX = 50;

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
  reorderWatchlist:    (from: number, to: number) => void;
  resetWatchlist:      () => void;

  // ── UI state ──────────────────────────────────────────────────────────────
  tradeMode: "simple" | "pro";
  setTradeMode: (m: "simple" | "pro") => void;

  lang: Lang;
  setLang: (l: Lang) => void;

  // ── Panels ────────────────────────────────────────────────────────────────
  notifications: AppNotification[];
  addNotification: (n: Omit<AppNotification, "id" | "timestamp" | "read">) => void;
  markAllRead:         () => void;
  dismissNotification: (id: string) => void;

  notificationsOpen: boolean;
  openNotifications:  () => void;
  closeNotifications: () => void;

  settings: UserSettings;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;

  settingsOpen: boolean;
  openSettings:  () => void;
  closeSettings: () => void;
}

export const useTradingStore = create<TradingStore>()(
  persist(
    (set) => ({
      // ── Market data ────────────────────────────────────────────────────
      activeSymbol: "BTCUSDT",
      setActiveSymbol: (activeSymbol) => set({ activeSymbol }),

      quotes: {},
      updateQuote:  (q)  => set((s) => ({ quotes: { ...s.quotes, [q.symbol]: q } })),
      updateQuotes: (qs) => set((s) => ({
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
      setAIAnalysis: (a) => set((s) => ({ aiAnalysis: { ...s.aiAnalysis, [a.symbol]: a } })),

      // ── Watchlist ──────────────────────────────────────────────────────
      watchlist: DEFAULT_WATCHLIST,

      addToWatchlist: (item) =>
        set((s) => ({
          watchlist: s.watchlist.find((w) => w.symbol === item.symbol)
            ? s.watchlist
            : [...s.watchlist, item],
        })),

      removeFromWatchlist: (symbol) =>
        set((s) => ({ watchlist: s.watchlist.filter((w) => w.symbol !== symbol) })),

      reorderWatchlist: (from, to) =>
        set((s) => {
          const list = [...s.watchlist];
          const [item] = list.splice(from, 1);
          list.splice(to, 0, item);
          return { watchlist: list };
        }),

      resetWatchlist: () => set({ watchlist: DEFAULT_WATCHLIST }),

      // ── UI state ───────────────────────────────────────────────────────
      tradeMode: "simple",
      setTradeMode: (tradeMode) => set({ tradeMode }),

      lang: "zh", // default to Chinese
      setLang: (lang) => set({ lang }),

      // ── Notifications ──────────────────────────────────────────────────
      notifications: [],
      addNotification: (n) =>
        set((s) => {
          const entry: AppNotification = { ...n, id: nextId(), timestamp: Date.now(), read: false };
          return { notifications: [entry, ...s.notifications].slice(0, NOTIFICATION_MAX) };
        }),
      markAllRead: () =>
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
      dismissNotification: (id) =>
        set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),

      notificationsOpen: false,
      openNotifications:  () => set({ notificationsOpen: true,  settingsOpen: false }),
      closeNotifications: () => set({ notificationsOpen: false }),

      // ── Settings ───────────────────────────────────────────────────────
      settings: DEFAULT_SETTINGS,
      updateSetting: (key, value) =>
        set((s) => ({ settings: { ...s.settings, [key]: value } })),

      settingsOpen: false,
      openSettings:  () => set({ settingsOpen: true,  notificationsOpen: false }),
      closeSettings: () => set({ settingsOpen: false }),
    }),
    {
      name: "tradeai-store-v2",
      // Only persist user preferences — market data regenerates on load
      partialize: (state) => ({
        watchlist: state.watchlist,
        lang:      state.lang,
        settings:  state.settings,
      }),
    }
  )
);
