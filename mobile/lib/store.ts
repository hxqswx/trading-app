/**
 * Zustand store — adapted from web version.
 * Uses AsyncStorage for persistence (instead of localStorage).
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Quote, PortfolioSummary, WatchlistItem } from "./types";
import type { Lang } from "./i18n";
import type { ColorScheme } from "./theme";

const DEFAULT_WATCHLIST: WatchlistItem[] = [
  { symbol: "BTCUSDT", name: "Bitcoin",   nameCN: "比特币",  type: "crypto" },
  { symbol: "ETHUSDT", name: "Ethereum",  nameCN: "以太坊",  type: "crypto" },
  { symbol: "AAPL",    name: "Apple",     nameCN: "苹果",    type: "stock"  },
  { symbol: "NVDA",    name: "NVIDIA",    nameCN: "英伟达",  type: "stock"  },
  { symbol: "TSLA",    name: "Tesla",     nameCN: "特斯拉",  type: "stock"  },
  { symbol: "MSFT",    name: "Microsoft", nameCN: "微软",    type: "stock"  },
  { symbol: "GOOGL",   name: "Alphabet",  nameCN: "谷歌",    type: "stock"  },
  { symbol: "META",    name: "Meta",      nameCN: "Meta",    type: "stock"  },
  { symbol: "BABA",    name: "Alibaba",   nameCN: "阿里巴巴",type: "stock"  },
  { symbol: "HK0700",  name: "Tencent",   nameCN: "腾讯控股",type: "hk"     },
];

interface TradingStore {
  // Hydration flag
  _hasHydrated: boolean;

  // Auth
  token:    string | null;
  user:     { name: string; email: string } | null;
  setAuth:  (token: string, user: { name: string; email: string }) => void;
  clearAuth: () => void;

  // Preferences
  lang:     Lang;
  setLang:  (l: Lang) => void;
  theme:    ColorScheme;
  setTheme: (t: ColorScheme) => void;

  // Market data
  activeSymbol:    string;
  setActiveSymbol: (s: string) => void;
  quotes:          Record<string, Quote>;
  updateQuotes:    (qs: Quote[]) => void;

  // Portfolio
  portfolio:        PortfolioSummary | null;
  portfolioLoading: boolean;
  setPortfolio:     (p: PortfolioSummary | null) => void;
  setPortfolioLoading: (v: boolean) => void;

  // Watchlist
  watchlist:           WatchlistItem[];
  addToWatchlist:      (item: WatchlistItem) => void;
  removeFromWatchlist: (symbol: string) => void;
  resetWatchlist:      () => void;
}

export const useTradingStore = create<TradingStore>()(
  persist(
    (set) => ({
      _hasHydrated: false,

      token:    null,
      user:     null,
      setAuth:  (token, user) => set({ token, user }),
      clearAuth: () => set({ token: null, user: null }),

      lang:     "zh",
      setLang:  (lang) => set({ lang }),
      theme:    "dark",
      setTheme: (theme) => set({ theme }),

      activeSymbol:    "BTCUSDT",
      setActiveSymbol: (activeSymbol) => set({ activeSymbol }),

      quotes:       {},
      updateQuotes: (qs) =>
        set((s) => ({
          quotes: { ...s.quotes, ...Object.fromEntries(qs.map((q) => [q.symbol, q])) },
        })),

      portfolio:           null,
      portfolioLoading:    false,
      setPortfolio:        (portfolio) => set({ portfolio }),
      setPortfolioLoading: (portfolioLoading) => set({ portfolioLoading }),

      watchlist:           DEFAULT_WATCHLIST,
      addToWatchlist:      (item) =>
        set((s) => ({
          watchlist: s.watchlist.find((w) => w.symbol === item.symbol)
            ? s.watchlist
            : [...s.watchlist, item],
        })),
      removeFromWatchlist: (symbol) =>
        set((s) => ({ watchlist: s.watchlist.filter((w) => w.symbol !== symbol) })),
      resetWatchlist:      () => set({ watchlist: DEFAULT_WATCHLIST }),
    }),
    {
      name:    "tradeai-mobile-v1",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        token:     state.token,
        user:      state.user,
        lang:      state.lang,
        theme:     state.theme,
        watchlist: state.watchlist,
      }),
      onRehydrateStorage: () => () => {
        useTradingStore.setState({ _hasHydrated: true });
      },
    }
  )
);
