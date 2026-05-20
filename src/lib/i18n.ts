export type Lang = "en" | "zh";

export interface Translations {
  nav: {
    dashboard: string; markets: string; portfolio: string;
    strategies: string; notifications: string; settings: string;
    ai: string;
  };
  topbar: { live: string };
  watchlist: {
    title: string; search: string;
    crypto: string; equities: string; cnHk: string; mainlandCN: string;
  };
  trade: {
    placeOrder: string; simple: string; pro: string;
    buy: string; sell: string; buying: string; selling: string;
    qty: string; amount: string; maxQty: string;
    limitPrice: string; stopPrice: string;
    estPrice: string; estTotal: string;
    paperTrading: string; placing: string;
    bought: string; sold: string; at: string;
    orderType: string;
    market: string; marketDesc: string;
    limit: string; limitDesc: string;
    stop: string; stopDesc: string;
    stopLimit: string; stopLimitDesc: string;
    youllOwn: string; youllSell: string;
  };
  orderbook: {
    title: string; spread: string;
    price: string; size: string; total: string;
  };
  ai: {
    title: string; analyse: string; analysing: string;
    crunching: string; clickHint: string; clickHintBtn: string;
    sentiment: string; riskLevel: string;
    support: string; resistance: string; signals: string;
    updated: string; keyLevels: string;
    bullish: string; bearish: string; neutral: string;
    low: string; medium: string; high: string; risk: string;
  };
  chart: { loading: string; range24h: string; vol: string; title: string };
  dashboard: {
    title: string; subtitle: string;
    greeting: string; greetingSub: string; today: string;
    positions: string; topMovers: string;
    noPositions: string;
  };
  portfolio: {
    title: string; subtitle: string;
    equity: string; cash: string; dayPnl: string; totalPnl: string;
    positions: string; openPositions: string; noPositions: string;
    allocation: string; total: string;
  };
  markets: {
    title: string; subtitle: string;
    usEquities: string; chinaHK: string; mainlandCN: string; crypto: string; cnHk: string;
    change24h: string; volume: string;
  };
  table: {
    asset: string; qty: string; avgCost: string;
    current: string; value: string; pnl: string;
    high: string; low: string;
  };
  badge: { stock: string; crypto: string; hk: string; cn: string };
  notFound: { title: string; sub: string; back: string };
  strategies: {
    title: string; subtitle: string; tabLabel: string;
    asset: string; signals: string; consensus: string; trade: string; refresh: string;
    strongBuy: string; buy: string; hold: string; sell: string; strongSell: string;
  };
  auth: {
    signIn: string; signOut: string; profile: string; demoHint: string;
  };
  notifications: {
    title: string; markAllRead: string;
    empty: string; emptySub: string; clearAll: string;
  };
  settings: {
    title: string;
    sectionAppearance: string; sectionTrading: string;
    sectionAccount: string; sectionAbout: string;
    // Appearance
    language: string; theme: string; themeHint: string; dark: string;
    // Trading
    defaultOrderType: string; defaultOrderTypeHint: string;
    confirmOrders: string; confirmOrdersHint: string;
    pnlDisplay: string;
    // Account
    paperBalance: string; paperNote: string;
    resetBalance: string; resetting: string;
    resetSuccess: string; resetSuccessBody: string; resetWarning: string;
    // About
    aboutMarket: string; aboutDB: string; aboutCache: string; aboutAuth: string;
    viewOnGithub: string;
  };
  aiTerminal: {
    title: string;
    subtitle: string;
    statusOnline: string;
    statusOffline: string;
    statusChecking: string;
    latency: string;
    model: string;
    provider: string;
    newsFeed: string;
    noNews: string;
    analysisTerminal: string;
    analyse: string;
    analysing: string;
    selectAsset: string;
    chat: string;
    chatPlaceholder: string;
    send: string;
    clearChat: string;
    you: string;
    quantai: string;
    setupHint: string;
    setupStep1: string;
    setupStep2: string;
    setupStep3: string;
    bullish: string;
    bearish: string;
    neutral: string;
  };
  loading: string;
  error: string;
}

const en: Translations = {
  nav: { dashboard: "Dashboard", markets: "Markets", portfolio: "Portfolio", strategies: "Strategies", notifications: "Notifications", settings: "Settings", ai: "AI Terminal" },
  topbar: { live: "Live" },
  watchlist: { title: "Watchlist", search: "Search…", crypto: "Crypto", equities: "US Equities", cnHk: "HK Stocks", mainlandCN: "A-Shares" },
  trade: {
    placeOrder: "Place Order", simple: "Simple", pro: "Pro",
    buy: "Buy", sell: "Sell", buying: "Buy", selling: "Sell",
    qty: "Quantity", amount: "Amount", maxQty: "Max",
    limitPrice: "Limit Price", stopPrice: "Stop Price",
    estPrice: "Est. Price", estTotal: "Total",
    paperTrading: "Paper trading — no real money used",
    placing: "Placing order…", bought: "Bought", sold: "Sold", at: "@",
    orderType: "Order Type",
    market: "Market", marketDesc: "Execute immediately at the current price",
    limit: "Limit", limitDesc: "Execute only at your specified price or better",
    stop: "Stop", stopDesc: "Trigger a market order when price hits your stop",
    stopLimit: "Stop-Limit", stopLimitDesc: "Trigger a limit order when price hits your stop",
    youllOwn: "You'll own", youllSell: "You'll sell",
  },
  orderbook: { title: "Order Book", spread: "Spread", price: "Price", size: "Size", total: "Total" },
  ai: {
    title: "AI Analysis", analyse: "Analyse", analysing: "Analysing…",
    crunching: "Crunching market data…", clickHint: "Click", clickHintBtn: "Analyse",
    sentiment: "Sentiment", riskLevel: "Risk", support: "Support", resistance: "Resistance",
    signals: "Signals", updated: "Last updated", keyLevels: "Key Levels",
    bullish: "BULLISH", bearish: "BEARISH", neutral: "NEUTRAL",
    low: "LOW", medium: "MEDIUM", high: "HIGH", risk: "RISK",
  },
  chart: { loading: "Loading chart…", range24h: "24h range", vol: "Vol", title: "Chart" },
  dashboard: {
    title: "Dashboard", subtitle: "Portfolio overview & market summary",
    greeting: "Good morning 👋", greetingSub: "Your portfolio is looking great today.",
    today: "today", positions: "Open Positions", topMovers: "Top Movers",
    noPositions: "No open positions",
  },
  portfolio: {
    title: "Portfolio", subtitle: "Positions, P&L, and allocation",
    equity: "Total Equity", cash: "Cash Available", dayPnl: "Day P&L", totalPnl: "Total P&L",
    positions: "positions", openPositions: "Open Positions", noPositions: "No open positions",
    allocation: "Allocation", total: "Total",
  },
  markets: {
    title: "Markets", subtitle: "Live prices across all assets",
    usEquities: "US Equities", chinaHK: "HK Stocks", mainlandCN: "A-Shares", crypto: "Crypto", cnHk: "HK Stocks",
    change24h: "24h Change", volume: "Volume",
  },
  table: { asset: "Asset", qty: "Qty", avgCost: "Avg Cost", current: "Current", value: "Market Value", pnl: "P&L", high: "High", low: "Low" },
  badge: { stock: "US", crypto: "Crypto", hk: "HK", cn: "A股" },
  notFound: { title: "Page not found", sub: "The page you're looking for doesn't exist.", back: "Back to Dashboard" },
  strategies: {
    title: "Strategy Screener",
    subtitle: "Six institutional-grade signals across all assets",
    tabLabel: "Strategy",
    asset: "Asset", signals: "Strategy Signals", consensus: "Consensus", trade: "Trade", refresh: "Refresh",
    strongBuy: "STRONG BUY", buy: "BUY", hold: "HOLD", sell: "SELL", strongSell: "STRONG SELL",
  },
  auth: {
    signIn: "Sign In", signOut: "Sign Out", profile: "Profile",
    demoHint: "Demo · any email · password: demo123",
  },
  notifications: {
    title: "Notifications",
    markAllRead: "Mark all read",
    empty: "No notifications yet",
    emptySub: "Order fills, strategy signals, and system alerts will appear here.",
    clearAll: "Clear all",
  },
  settings: {
    title: "Settings",
    sectionAppearance: "Appearance", sectionTrading: "Trading",
    sectionAccount: "Account", sectionAbout: "About",
    language: "Language", theme: "Theme", themeHint: "More themes coming soon", dark: "Dark",
    defaultOrderType: "Default Order Type",
    defaultOrderTypeHint: "Pre-selects the order type when you open a trade panel",
    confirmOrders: "Confirm Orders",
    confirmOrdersHint: "Show a confirmation dialog before placing each order",
    pnlDisplay: "P&L Display",
    paperBalance: "Paper Balance",
    paperNote: "Simulated funds — no real money involved",
    resetBalance: "Reset Paper Account",
    resetting: "Resetting…",
    resetSuccess: "Account Reset",
    resetSuccessBody: "Your paper account has been reset to $25,000.",
    resetWarning: "This will erase all positions and order history.",
    aboutMarket: "Market Data", aboutDB: "Database",
    aboutCache: "Cache", aboutAuth: "Authentication",
    viewOnGithub: "View on GitHub",
  },
  aiTerminal: {
    title: "AI Command Center",
    subtitle: "Local LLM · Real-time analysis · Zero cloud dependency",
    statusOnline: "LLM ONLINE",
    statusOffline: "LLM OFFLINE",
    statusChecking: "CONNECTING…",
    latency: "latency",
    model: "Model",
    provider: "Provider",
    newsFeed: "News Feed",
    noNews: "No news fetched yet — select an asset and analyse",
    analysisTerminal: "Analysis Terminal",
    analyse: "RUN ANALYSIS",
    analysing: "ANALYSING…",
    selectAsset: "← Select an asset from the watchlist",
    chat: "AI Chat",
    chatPlaceholder: "Ask QuantAI anything about markets…",
    send: "Send",
    clearChat: "Clear",
    you: "YOU",
    quantai: "QUANTAI",
    setupHint: "Connect your local LLM to enable AI analysis",
    setupStep1: "1. Download LM Studio from lmstudio.ai",
    setupStep2: "2. Load any GGUF model and start the server",
    setupStep3: "3. Restart the dev server — AI will auto-connect",
    bullish: "BULL",
    bearish: "BEAR",
    neutral: "NEUT",
  },
  loading: "Loading…",
  error: "Something went wrong",
};

const zh: Translations = {
  nav: { dashboard: "总览", markets: "市场", portfolio: "持仓", strategies: "策略", notifications: "通知", settings: "设置", ai: "AI 终端" },
  topbar: { live: "实时" },
  watchlist: { title: "自选股", search: "搜索…", crypto: "加密货币", equities: "美股", cnHk: "港股", mainlandCN: "A股" },
  trade: {
    placeOrder: "下单", simple: "简单", pro: "专业",
    buy: "买入", sell: "卖出", buying: "买入", selling: "卖出",
    qty: "数量", amount: "数量", maxQty: "最大",
    limitPrice: "限价", stopPrice: "止损价",
    estPrice: "预估价格", estTotal: "总计",
    paperTrading: "模拟交易 — 不涉及真实资金",
    placing: "正在下单…", bought: "已买入", sold: "已卖出", at: "@",
    orderType: "订单类型",
    market: "市价单", marketDesc: "以当前市价立即成交",
    limit: "限价单", limitDesc: "仅在达到您指定价格或更优价格时成交",
    stop: "止损单", stopDesc: "当价格触及止损价时触发市价单",
    stopLimit: "止损限价单", stopLimitDesc: "当价格触及止损价时触发限价单",
    youllOwn: "将持有", youllSell: "将卖出",
  },
  orderbook: { title: "盘口", spread: "价差", price: "价格", size: "数量", total: "累计" },
  ai: {
    title: "AI 分析", analyse: "开始分析", analysing: "分析中…",
    crunching: "正在处理市场数据…", clickHint: "点击", clickHintBtn: "开始分析",
    sentiment: "市场情绪", riskLevel: "风险等级", support: "支撑位", resistance: "阻力位",
    signals: "交易信号", updated: "更新时间", keyLevels: "关键价位",
    bullish: "看涨", bearish: "看跌", neutral: "中性",
    low: "低", medium: "中", high: "高", risk: "风险",
  },
  chart: { loading: "图表加载中…", range24h: "24小时区间", vol: "成交量", title: "图表" },
  dashboard: {
    title: "总览", subtitle: "投资组合概览与市场摘要",
    greeting: "早上好 👋", greetingSub: "您的投资组合今日表现不错。",
    today: "今日", positions: "当前持仓", topMovers: "涨跌幅榜",
    noPositions: "暂无持仓",
  },
  portfolio: {
    title: "持仓", subtitle: "仓位、盈亏与资产分配",
    equity: "总净值", cash: "可用资金", dayPnl: "当日盈亏", totalPnl: "总盈亏",
    positions: "个持仓", openPositions: "当前持仓", noPositions: "暂无持仓",
    allocation: "资产分配", total: "合计",
  },
  markets: {
    title: "市场", subtitle: "全品种实时行情",
    usEquities: "美股", chinaHK: "港股", mainlandCN: "A股", crypto: "加密货币", cnHk: "港股",
    change24h: "24小时涨跌", volume: "成交量",
  },
  table: { asset: "资产", qty: "数量", avgCost: "均价", current: "现价", value: "市值", pnl: "盈亏", high: "最高", low: "最低" },
  badge: { stock: "美股", crypto: "加密", hk: "港股", cn: "A股" },
  notFound: { title: "页面未找到", sub: "您访问的页面不存在。", back: "返回总览" },
  strategies: {
    title: "策略筛选器",
    subtitle: "六大机构级信号，覆盖全品种资产",
    tabLabel: "策略",
    asset: "资产", signals: "策略信号", consensus: "综合评级", trade: "交易", refresh: "刷新",
    strongBuy: "强烈买入", buy: "买入", hold: "观望", sell: "卖出", strongSell: "强烈卖出",
  },
  auth: {
    signIn: "登录", signOut: "退出登录", profile: "个人资料",
    demoHint: "演示账号 · 任意邮箱 · 密码：demo123",
  },
  notifications: {
    title: "通知",
    markAllRead: "全部已读",
    empty: "暂无通知",
    emptySub: "订单成交、策略信号和系统消息将在此显示。",
    clearAll: "清除全部",
  },
  settings: {
    title: "设置",
    sectionAppearance: "外观", sectionTrading: "交易",
    sectionAccount: "账户", sectionAbout: "关于",
    language: "语言", theme: "主题", themeHint: "更多主题即将推出", dark: "暗色",
    defaultOrderType: "默认订单类型",
    defaultOrderTypeHint: "打开交易面板时预选订单类型",
    confirmOrders: "订单确认",
    confirmOrdersHint: "下单前显示确认对话框",
    pnlDisplay: "盈亏显示方式",
    paperBalance: "模拟账户余额",
    paperNote: "模拟资金 — 不涉及真实资金",
    resetBalance: "重置模拟账户",
    resetting: "重置中…",
    resetSuccess: "账户已重置",
    resetSuccessBody: "模拟账户已重置至 $25,000。",
    resetWarning: "此操作将清除所有持仓和订单记录。",
    aboutMarket: "市场数据", aboutDB: "数据库",
    aboutCache: "缓存", aboutAuth: "身份验证",
    viewOnGithub: "在 GitHub 查看",
  },
  aiTerminal: {
    title: "AI 指挥中心",
    subtitle: "本地大模型 · 实时分析 · 零云依赖",
    statusOnline: "模型在线",
    statusOffline: "模型离线",
    statusChecking: "连接中…",
    latency: "延迟",
    model: "模型",
    provider: "提供商",
    newsFeed: "新闻动态",
    noNews: "暂无新闻 — 请选择资产并运行分析",
    analysisTerminal: "分析终端",
    analyse: "运行分析",
    analysing: "分析中…",
    selectAsset: "← 从自选股中选择资产",
    chat: "AI 对话",
    chatPlaceholder: "向 QuantAI 询问任何市场问题…",
    send: "发送",
    clearChat: "清除",
    you: "您",
    quantai: "QUANTAI",
    setupHint: "连接本地大模型以启用 AI 分析",
    setupStep1: "1. 从 lmstudio.ai 下载 LM Studio",
    setupStep2: "2. 加载任意 GGUF 模型并启动服务",
    setupStep3: "3. 重启开发服务器 — AI 将自动连接",
    bullish: "看涨",
    bearish: "看跌",
    neutral: "中性",
  },
  loading: "加载中…",
  error: "发生错误",
};

export const translations: Record<Lang, Translations> = { en, zh };
