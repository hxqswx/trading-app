/**
 * Zustand store — adapted from web version.
 * Uses AsyncStorage for persistence (instead of localStorage).
 *
 * NOTE: _hasHydrated has been removed. The root index.tsx reads AsyncStorage
 * directly to avoid useSyncExternalStore / React-19 snapshot-consistency
 * issues that cause "Maximum update depth exceeded".
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Quote, PortfolioSummary, WatchlistItem, AssetType } from "./types";
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

export const DEFAULT_MARKET_LISTS: Record<AssetType, WatchlistItem[]> = {
  stock: [
    { symbol: "AAPL",  name: "Apple",     nameCN: "苹果",     type: "stock" },
    { symbol: "NVDA",  name: "NVIDIA",    nameCN: "英伟达",   type: "stock" },
    { symbol: "TSLA",  name: "Tesla",     nameCN: "特斯拉",   type: "stock" },
    { symbol: "MSFT",  name: "Microsoft", nameCN: "微软",     type: "stock" },
    { symbol: "GOOGL", name: "Alphabet",  nameCN: "谷歌",     type: "stock" },
    { symbol: "META",  name: "Meta",      nameCN: "Meta",     type: "stock" },
    { symbol: "AMZN",  name: "Amazon",    nameCN: "亚马逊",   type: "stock" },
    { symbol: "BABA",  name: "Alibaba",   nameCN: "阿里巴巴", type: "stock" },
  ],
  crypto: [
    { symbol: "BTCUSDT", name: "Bitcoin",  nameCN: "比特币",  type: "crypto" },
    { symbol: "ETHUSDT", name: "Ethereum", nameCN: "以太坊",  type: "crypto" },
    { symbol: "SOLUSDT", name: "Solana",   nameCN: "索拉纳",  type: "crypto" },
    { symbol: "BNBUSDT", name: "BNB",      nameCN: "币安币",  type: "crypto" },
    { symbol: "XRPUSDT", name: "Ripple",   nameCN: "瑞波币",  type: "crypto" },
  ],
  hk: [
    { symbol: "HK0700", name: "Tencent",       nameCN: "腾讯控股", type: "hk" },
    { symbol: "HK9988", name: "Alibaba HK",    nameCN: "阿里巴巴", type: "hk" },
    { symbol: "HK0005", name: "HSBC",          nameCN: "汇丰控股", type: "hk" },
    { symbol: "HK0941", name: "China Mobile",  nameCN: "中国移动", type: "hk" },
    { symbol: "HK1299", name: "AIA Group",     nameCN: "友邦保险", type: "hk" },
  ],
  cn: [
    { symbol: "CN600519", name: "Kweichow Moutai",   nameCN: "贵州茅台", type: "cn" },
    { symbol: "CN000001", name: "Ping An Bank",      nameCN: "平安银行", type: "cn" },
    { symbol: "CN000858", name: "Wuliangye",         nameCN: "五粮液",   type: "cn" },
    { symbol: "CN601318", name: "Ping An Insurance", nameCN: "中国平安", type: "cn" },
    { symbol: "CN600036", name: "China Merchants Bank", nameCN: "招商银行", type: "cn" },
  ],
  forex: [
    { symbol: "EURUSD=X", name: "EUR/USD", nameCN: "欧元/美元",   type: "forex" },
    { symbol: "GBPUSD=X", name: "GBP/USD", nameCN: "英镑/美元",   type: "forex" },
    { symbol: "USDJPY=X", name: "USD/JPY", nameCN: "美元/日元",   type: "forex" },
    { symbol: "AUDUSD=X", name: "AUD/USD", nameCN: "澳元/美元",   type: "forex" },
    { symbol: "USDCNH=X", name: "USD/CNH", nameCN: "美元/人民币", type: "forex" },
  ],
};

interface TradingStore {
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
  portfolio:           PortfolioSummary | null;
  portfolioLoading:    boolean;
  setPortfolio:        (p: PortfolioSummary | null) => void;
  setPortfolioLoading: (v: boolean) => void;

  // Watchlist
  watchlist:           WatchlistItem[];
  addToWatchlist:      (item: WatchlistItem) => void;
  removeFromWatchlist: (symbol: string) => void;
  resetWatchlist:      () => void;

  // Per-market lists (Markets screen tabs)
  marketLists:              Record<AssetType, WatchlistItem[]>;
  addToMarketList:          (type: AssetType, item: WatchlistItem) => void;
  removeFromMarketList:     (type: AssetType, symbol: string) => void;
  resetMarketList:          (type: AssetType) => void;
}

export const useTradingStore = create<TradingStore>()(
  persist(
    (set) => ({
      lang:     "zh",
      setLang:  (lang) => set({ lang }),
      theme:    "dark",
      setTheme: (theme) => set({ theme }),

      activeSymbol:    "BTCUSDT",
      setActiveSymbol: (activeSymbol) => set({ activeSymbol }),

      quotes:       {},
      updateQuotes: (qs) =>
        set((s) => ({
          quotes: {
            ...s.quotes,
            ...Object.fromEntries(qs.map((q) => [q.symbol, q])),
          },
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

      marketLists: DEFAULT_MARKET_LISTS,
      addToMarketList: (type, item) =>
        set((s) => ({
          marketLists: {
            ...s.marketLists,
            [type]: s.marketLists[type].find((w) => w.symbol === item.symbol)
              ? s.marketLists[type]
              : [...s.marketLists[type], item],
          },
        })),
      removeFromMarketList: (type, symbol) =>
        set((s) => ({
          marketLists: {
            ...s.marketLists,
            [type]: s.marketLists[type].filter((w) => w.symbol !== symbol),
          },
        })),
      resetMarketList: (type) =>
        set((s) => ({
          marketLists: {
            ...s.marketLists,
            [type]: DEFAULT_MARKET_LISTS[type],
          },
        })),
    }),
    {
      name:    "tradeai-mobile-v1",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        lang:        state.lang,
        theme:       state.theme,
        watchlist:   state.watchlist,
        marketLists: state.marketLists,
      }),
    }
  )
);
