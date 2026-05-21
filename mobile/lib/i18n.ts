// Shared i18n — identical to web src/lib/i18n.ts (pure TypeScript, no web deps)
export type Lang = "en" | "zh";

export interface Translations {
  nav: { dashboard: string; markets: string; portfolio: string; strategies: string; notifications: string; settings: string; ai: string };
  trade: { placeOrder: string; buy: string; sell: string; buying: string; selling: string; qty: string; amount: string; maxQty: string; limitPrice: string; stopPrice: string; estPrice: string; estTotal: string; paperTrading: string; placing: string; bought: string; sold: string; at: string; orderType: string; market: string; limit: string; stop: string; stopLimit: string; youllOwn: string; youllSell: string; available: string; position: string; noPosition: string; sellAll: string; insufficientFunds: string; insufficientPosition: string; simple: string; pro: string; marketDesc: string; limitDesc: string; stopDesc: string; stopLimitDesc: string };
  ai: { title: string; analyse: string; analysing: string; crunching: string; clickHint: string; clickHintBtn: string; sentiment: string; riskLevel: string; support: string; resistance: string; signals: string; updated: string; keyLevels: string; bullish: string; bearish: string; neutral: string; low: string; medium: string; high: string; risk: string };
  chart: { loading: string; range24h: string; vol: string; title: string };
  dashboard: { title: string; subtitle: string; greeting: string; greetingSub: string; today: string; positions: string; topMovers: string; gainers: string; losers: string; noPositions: string };
  portfolio: { title: string; subtitle: string; equity: string; cash: string; dayPnl: string; totalPnl: string; positions: string; openPositions: string; noPositions: string; allocation: string; total: string };
  markets: { title: string; subtitle: string; forex: string; rate: string; pair: string; usEquities: string; chinaHK: string; mainlandCN: string; crypto: string; cnHk: string; change24h: string; volume: string };
  table: { asset: string; qty: string; avgCost: string; current: string; value: string; pnl: string; high: string; low: string };
  badge: { stock: string; crypto: string; hk: string; cn: string; forex: string };
  strategies: { title: string; subtitle: string; tabLabel: string; asset: string; signals: string; consensus: string; trade: string; refresh: string; strongBuy: string; buy: string; hold: string; sell: string; strongSell: string };
  auth: { signIn: string; signOut: string; profile: string; demoHint: string };
  settings: { title: string; sectionAppearance: string; sectionTrading: string; sectionAccount: string; sectionAbout: string; language: string; theme: string; dark: string; light: string; accountEquity: string; accountCash: string; accountDayPnl: string; accountAlpaca: string; accountManage: string; aboutMarketUS: string; aboutMarketCrypto: string; aboutMarketOther: string; aboutDB: string; aboutAuth: string };
  loading: string; error: string;
}

const en: Translations = {
  nav: { dashboard: "Dashboard", markets: "Markets", portfolio: "Portfolio", strategies: "Strategies", notifications: "Notifications", settings: "Settings", ai: "AI" },
  trade: { placeOrder: "Place Order", buy: "Buy", sell: "Sell", buying: "Buy", selling: "Sell", qty: "Quantity", amount: "Amount", maxQty: "Max", limitPrice: "Limit Price", stopPrice: "Stop Price", estPrice: "Est. Price", estTotal: "Total", paperTrading: "Paper trading — no real money", placing: "Placing…", bought: "Bought", sold: "Sold", at: "@", orderType: "Order Type", market: "Market", limit: "Limit", stop: "Stop", stopLimit: "Stop-Limit", youllOwn: "You'll own", youllSell: "You'll sell", available: "Available", position: "Position", noPosition: "No position", sellAll: "Sell All", insufficientFunds: "Insufficient funds", insufficientPosition: "Insufficient position", simple: "Simple", pro: "Pro", marketDesc: "Execute immediately at current price", limitDesc: "Execute at your price or better", stopDesc: "Trigger market order at stop price", stopLimitDesc: "Trigger limit order at stop price" },
  ai: { title: "AI Analysis", analyse: "Analyse", analysing: "Analysing…", crunching: "Crunching market data…", clickHint: "Tap", clickHintBtn: "Analyse", sentiment: "Sentiment", riskLevel: "Risk", support: "Support", resistance: "Resistance", signals: "Signals", updated: "Updated", keyLevels: "Key Levels", bullish: "BULLISH", bearish: "BEARISH", neutral: "NEUTRAL", low: "LOW", medium: "MEDIUM", high: "HIGH", risk: "RISK" },
  chart: { loading: "Loading chart…", range24h: "24h range", vol: "Vol", title: "Chart" },
  dashboard: { title: "Dashboard", subtitle: "Portfolio overview", greeting: "Good morning 👋", greetingSub: "Your portfolio today.", today: "today", positions: "Open Positions", topMovers: "Top Movers", gainers: "Top Gainers", losers: "Top Losers", noPositions: "No open positions" },
  portfolio: { title: "Portfolio", subtitle: "Positions, P&L & allocation", equity: "Total Equity", cash: "Cash", dayPnl: "Day P&L", totalPnl: "Total P&L", positions: "positions", openPositions: "Open Positions", noPositions: "No open positions", allocation: "Allocation", total: "Total" },
  markets: { title: "Markets", subtitle: "Live prices", forex: "FX", rate: "Rate", pair: "Pair", usEquities: "US Equities", chinaHK: "HK Stocks", mainlandCN: "A-Shares", crypto: "Crypto", cnHk: "HK Stocks", change24h: "24h Change", volume: "Volume" },
  table: { asset: "Asset", qty: "Qty", avgCost: "Avg Cost", current: "Current", value: "Value", pnl: "P&L", high: "High", low: "Low" },
  badge: { stock: "US", crypto: "Crypto", hk: "HK", cn: "CN", forex: "FX" },
  strategies: { title: "Strategies", subtitle: "Institutional-grade signals", tabLabel: "Strategy", asset: "Asset", signals: "Signals", consensus: "Consensus", trade: "Trade", refresh: "Refresh", strongBuy: "STRONG BUY", buy: "BUY", hold: "HOLD", sell: "SELL", strongSell: "STRONG SELL" },
  auth: { signIn: "Sign In", signOut: "Sign Out", profile: "Profile", demoHint: "Demo · any email · password: demo123" },
  settings: { title: "Settings", sectionAppearance: "Appearance", sectionTrading: "Trading", sectionAccount: "Account", sectionAbout: "About", language: "Language", theme: "Theme", dark: "Dark", light: "Light", accountEquity: "Total Equity", accountCash: "Cash", accountDayPnl: "Day P&L", accountAlpaca: "Alpaca Paper Account", accountManage: "Manage at Alpaca ↗", aboutMarketUS: "US Stocks", aboutMarketCrypto: "Crypto", aboutMarketOther: "HK / CN / FX", aboutDB: "Neon Postgres / Mock", aboutAuth: "NextAuth.js v5" },
  loading: "Loading…", error: "Something went wrong",
};

const zh: Translations = {
  nav: { dashboard: "总览", markets: "市场", portfolio: "持仓", strategies: "策略", notifications: "通知", settings: "设置", ai: "AI" },
  trade: { placeOrder: "下单", buy: "买入", sell: "卖出", buying: "买入", selling: "卖出", qty: "数量", amount: "数量", maxQty: "最大", limitPrice: "限价", stopPrice: "止损价", estPrice: "预估价格", estTotal: "总计", paperTrading: "模拟交易 — 不涉及真实资金", placing: "下单中…", bought: "已买入", sold: "已卖出", at: "@", orderType: "订单类型", market: "市价单", limit: "限价单", stop: "止损单", stopLimit: "止损限价单", youllOwn: "将持有", youllSell: "将卖出", available: "可用资金", position: "持仓", noPosition: "暂无持仓", sellAll: "清仓", insufficientFunds: "资金不足", insufficientPosition: "持仓不足", simple: "简单", pro: "专业", marketDesc: "以当前市价立即成交", limitDesc: "仅在指定价格或更优时成交", stopDesc: "触及止损价时触发市价单", stopLimitDesc: "触及止损价时触发限价单" },
  ai: { title: "AI 分析", analyse: "开始分析", analysing: "分析中…", crunching: "处理市场数据…", clickHint: "点击", clickHintBtn: "开始分析", sentiment: "市场情绪", riskLevel: "风险等级", support: "支撑位", resistance: "阻力位", signals: "交易信号", updated: "更新时间", keyLevels: "关键价位", bullish: "看涨", bearish: "看跌", neutral: "中性", low: "低", medium: "中", high: "高", risk: "风险" },
  chart: { loading: "图表加载中…", range24h: "24小时区间", vol: "成交量", title: "图表" },
  dashboard: { title: "总览", subtitle: "投资组合概览", greeting: "早上好 👋", greetingSub: "今日投资组合。", today: "今日", positions: "当前持仓", topMovers: "涨跌榜", gainers: "涨幅榜", losers: "跌幅榜", noPositions: "暂无持仓" },
  portfolio: { title: "持仓", subtitle: "仓位、盈亏与资产分配", equity: "总净值", cash: "可用资金", dayPnl: "当日盈亏", totalPnl: "总盈亏", positions: "个持仓", openPositions: "当前持仓", noPositions: "暂无持仓", allocation: "资产分配", total: "合计" },
  markets: { title: "市场", subtitle: "全品种实时行情", forex: "外汇", rate: "汇率", pair: "货币对", usEquities: "美股", chinaHK: "港股", mainlandCN: "A股", crypto: "加密货币", cnHk: "港股", change24h: "24小时涨跌", volume: "成交量" },
  table: { asset: "资产", qty: "数量", avgCost: "均价", current: "现价", value: "市值", pnl: "盈亏", high: "最高", low: "最低" },
  badge: { stock: "美股", crypto: "加密", hk: "港股", cn: "A股", forex: "外汇" },
  strategies: { title: "策略筛选器", subtitle: "六大机构级信号", tabLabel: "策略", asset: "资产", signals: "策略信号", consensus: "综合评级", trade: "交易", refresh: "刷新", strongBuy: "强烈买入", buy: "买入", hold: "观望", sell: "卖出", strongSell: "强烈卖出" },
  auth: { signIn: "登录", signOut: "退出登录", profile: "个人资料", demoHint: "演示账号 · 任意邮箱 · 密码：demo123" },
  settings: { title: "设置", sectionAppearance: "外观", sectionTrading: "交易", sectionAccount: "账户", sectionAbout: "关于", language: "语言", theme: "主题", dark: "暗色", light: "浅色", accountEquity: "总净值", accountCash: "现金", accountDayPnl: "今日盈亏", accountAlpaca: "Alpaca 纸交易账户", accountManage: "前往 Alpaca 管理 ↗", aboutMarketUS: "美股", aboutMarketCrypto: "加密货币", aboutMarketOther: "港股 / A股 / 外汇", aboutDB: "Neon Postgres / Mock", aboutAuth: "NextAuth.js v5" },
  loading: "加载中…", error: "发生错误",
};

export const translations: Record<Lang, Translations> = { en, zh };
