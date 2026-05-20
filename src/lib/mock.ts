import type { Quote, Candle, CandleInterval, OrderBook, OrderBookLevel, PortfolioSummary, AIAnalysis, AssetType } from "./types";

// ── Asset registry ───────────────────────────────────────────────────────────

export const ASSET_META: Record<string, {
  name: string; nameCN: string;
  type: AssetType; currency: string;
  basePrice: number; volatility: number; avgVolume: number;
  description: string; descriptionCN: string;
  sector?: string; sectorCN?: string;
  market: "US" | "HK" | "CN" | "CRYPTO";
}> = {
  // ── Crypto ─────────────────────────────────────────────────────────────────
  BTCUSDT: { name: "Bitcoin",   nameCN: "比特币",   type: "crypto", currency: "USD", basePrice: 68_400,  volatility: 0.018, avgVolume: 25_000,      description: "Digital gold & store of value",        descriptionCN: "数字黄金与价值储存",               market: "CRYPTO" },
  ETHUSDT: { name: "Ethereum",  nameCN: "以太坊",   type: "crypto", currency: "USD", basePrice: 3_520,   volatility: 0.022, avgVolume: 350_000,     description: "Smart contract blockchain platform",    descriptionCN: "智能合约区块链平台",               market: "CRYPTO" },
  SOLUSDT: { name: "Solana",    nameCN: "索拉纳",   type: "crypto", currency: "USD", basePrice: 182.40,  volatility: 0.030, avgVolume: 4_500_000,   description: "High-speed Layer-1 blockchain",         descriptionCN: "高性能Layer-1公链",                market: "CRYPTO" },

  // ── US Equities ────────────────────────────────────────────────────────────
  AAPL: { name: "Apple",     nameCN: "苹果",     type: "stock", currency: "USD", basePrice: 187.42, volatility: 0.012, avgVolume: 55_000_000, description: "Consumer electronics & software",     descriptionCN: "消费电子与软件",       sector: "Technology",    sectorCN: "科技",   market: "US" },
  TSLA: { name: "Tesla",     nameCN: "特斯拉",   type: "stock", currency: "USD", basePrice: 192.30, volatility: 0.028, avgVolume: 120_000_000,description: "Electric vehicles & clean energy",   descriptionCN: "电动汽车与清洁能源",   sector: "Automotive",   sectorCN: "汽车",   market: "US" },
  NVDA: { name: "NVIDIA",    nameCN: "英伟达",   type: "stock", currency: "USD", basePrice: 875.80, volatility: 0.022, avgVolume: 45_000_000, description: "GPUs, AI & data center chips",       descriptionCN: "GPU、AI与数据中心芯片", sector: "Semiconductors",sectorCN: "半导体", market: "US" },
  MSFT: { name: "Microsoft", nameCN: "微软",     type: "stock", currency: "USD", basePrice: 412.60, volatility: 0.010, avgVolume: 22_000_000, description: "Cloud computing & enterprise software",descriptionCN: "云计算与企业软件",     sector: "Technology",   sectorCN: "科技",   market: "US" },
  GOOGL:{ name: "Alphabet",  nameCN: "谷歌",     type: "stock", currency: "USD", basePrice: 172.90, volatility: 0.011, avgVolume: 25_000_000, description: "Search, ads & cloud services",       descriptionCN: "搜索、广告与云服务",   sector: "Technology",   sectorCN: "科技",   market: "US" },

  // ── US-listed Chinese stocks (ADR) ─────────────────────────────────────────
  BABA: { name: "Alibaba",   nameCN: "阿里巴巴", type: "stock", currency: "USD", basePrice: 82.40,  volatility: 0.028, avgVolume: 18_000_000, description: "China's largest e-commerce group",   descriptionCN: "中国最大电商集团",     sector: "E-commerce",   sectorCN: "电商",   market: "US" },
  PDD:  { name: "Pinduoduo", nameCN: "拼多多",   type: "stock", currency: "USD", basePrice: 138.60, volatility: 0.030, avgVolume: 14_000_000, description: "Social e-commerce & Temu operator",  descriptionCN: "社交电商与Temu运营商", sector: "E-commerce",   sectorCN: "电商",   market: "US" },
  JD:   { name: "JD.com",    nameCN: "京东",     type: "stock", currency: "USD", basePrice: 28.20,  volatility: 0.025, avgVolume: 12_000_000, description: "China's second-largest e-retailer",  descriptionCN: "中国第二大电商平台",   sector: "E-commerce",   sectorCN: "电商",   market: "US" },
  BIDU: { name: "Baidu",     nameCN: "百度",     type: "stock", currency: "USD", basePrice: 95.10,  volatility: 0.022, avgVolume: 6_000_000,  description: "China's leading AI & search engine", descriptionCN: "中国领先AI与搜索引擎", sector: "Technology",   sectorCN: "科技",   market: "US" },
  NIO:  { name: "NIO",       nameCN: "蔚来",     type: "stock", currency: "USD", basePrice: 5.80,   volatility: 0.045, avgVolume: 35_000_000, description: "Premium Chinese EV brand",           descriptionCN: "高端电动汽车品牌",     sector: "Automotive",   sectorCN: "汽车",   market: "US" },

  // ── Hong Kong listed stocks ────────────────────────────────────────────────
  HK0700: { name: "Tencent",     nameCN: "腾讯控股", type: "hk", currency: "HKD", basePrice: 372.00, volatility: 0.020, avgVolume: 18_000_000, description: "China's largest internet & gaming company", descriptionCN: "中国最大互联网与游戏公司", sector: "Technology",  sectorCN: "科技", market: "HK" },
  HK9988: { name: "Alibaba HK",  nameCN: "阿里巴巴", type: "hk", currency: "HKD", basePrice: 75.40,  volatility: 0.025, avgVolume: 22_000_000, description: "Alibaba Group Hong Kong listing",          descriptionCN: "阿里巴巴集团港股",         sector: "E-commerce",  sectorCN: "电商", market: "HK" },
  HK3690: { name: "Meituan",     nameCN: "美团",     type: "hk", currency: "HKD", basePrice: 148.20, volatility: 0.028, avgVolume: 16_000_000, description: "China's leading food delivery & local services",descriptionCN: "中国领先外卖与本地生活服务", sector: "Services",  sectorCN: "服务", market: "HK" },
  HK1810: { name: "Xiaomi",      nameCN: "小米集团", type: "hk", currency: "HKD", basePrice: 18.60,  volatility: 0.032, avgVolume: 52_000_000, description: "Smartphones, IoT & EV ecosystem",         descriptionCN: "手机、IoT与新能源车生态",  sector: "Technology",  sectorCN: "科技", market: "HK" },

  // ── Mainland China A-shares (CNY) ──────────────────────────────────────────
  CNMTAI:  { name: "Kweichow Moutai", nameCN: "贵州茅台", type: "cn", currency: "CNY", basePrice: 1_748,  volatility: 0.012, avgVolume: 3_800_000,  description: "China's iconic luxury baijiu brand and most valuable A-share",     descriptionCN: "中国最具代表性的高端白酒品牌，A股市值之王",         sector: "Consumer Staples", sectorCN: "消费品", market: "CN" },
  CNCATL:  { name: "CATL",            nameCN: "宁德时代", type: "cn", currency: "CNY", basePrice: 244.5,  volatility: 0.022, avgVolume: 28_000_000, description: "World's largest EV battery manufacturer by market share",          descriptionCN: "全球市占率第一的动力电池龙头企业",                 sector: "New Energy",       sectorCN: "新能源", market: "CN" },
  CNBYD:   { name: "BYD",             nameCN: "比亚迪",   type: "cn", currency: "CNY", basePrice: 285.2,  volatility: 0.025, avgVolume: 22_000_000, description: "Leading Chinese EV and battery maker; Warren Buffett holding",    descriptionCN: "中国新能源汽车龙头，巴菲特长期持仓标的",            sector: "Automotive",       sectorCN: "汽车",   market: "CN" },
  CNPING:  { name: "Ping An",         nameCN: "中国平安", type: "cn", currency: "CNY", basePrice: 44.6,   volatility: 0.015, avgVolume: 65_000_000, description: "China's largest insurance & financial services conglomerate",     descriptionCN: "中国最大综合金融保险集团",                         sector: "Financials",       sectorCN: "金融",   market: "CN" },
  CNICBC:  { name: "ICBC",            nameCN: "工商银行", type: "cn", currency: "CNY", basePrice: 6.48,   volatility: 0.008, avgVolume: 280_000_000,description: "Industrial & Commercial Bank of China, world's largest bank by assets", descriptionCN: "中国工商银行，资产规模全球最大的商业银行",    sector: "Banking",          sectorCN: "银行",   market: "CN" },
};

// ── Currency formatting ──────────────────────────────────────────────────────

export function currencySymbol(currency: string): string {
  if (currency === "HKD") return "HK$";
  if (currency === "CNY") return "¥";
  return "$";
}

// ── Seeded PRNG ──────────────────────────────────────────────────────────────

function lcg(seed: number) {
  const m = 0x80000000;
  const a = 1664525;
  const c = 1013904223;
  let state = (seed ^ 0xdeadbeef) >>> 0;
  return () => {
    state = ((a * state + c) >>> 0) % m;
    return state / m;
  };
}

function symbolSeed(symbol: string): number {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) hash = (hash * 31 + symbol.charCodeAt(i)) >>> 0;
  return hash;
}

function normalRandom(r: () => number): number {
  const u1 = Math.max(r(), 1e-10);
  const u2 = r();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// ── Quote ────────────────────────────────────────────────────────────────────

export function generateQuote(symbol: string, priceOverride?: number): Quote {
  const meta = ASSET_META[symbol];
  if (!meta) {
    // Unknown / custom symbol — return a safe placeholder
    return {
      symbol, price: 100, open: 100, high: 102, low: 98,
      volume: 1_000_000, change: 0, changePct: 0,
      timestamp: Date.now(), type: "stock", currency: "USD",
    };
  }
  const r = lcg(symbolSeed(symbol) + Math.floor(Date.now() / 60_000));

  const price     = priceOverride ?? meta.basePrice * (1 + (r() - 0.5) * 0.01);
  const changePct = (r() - 0.45) * meta.volatility * 100 * 10;
  const open      = price / (1 + changePct / 100);
  const high      = price * (1 + r() * meta.volatility * 1.5);
  const low       = price * (1 - r() * meta.volatility * 1.5);

  return {
    symbol, price, open,
    high: Math.max(high, price),
    low:  Math.min(low,  price),
    volume:    meta.avgVolume * (0.7 + r() * 0.6),
    change:    price - open,
    changePct,
    timestamp: Date.now(),
    type:      meta.type,
    currency:  meta.currency,
  };
}

// ── Candles ──────────────────────────────────────────────────────────────────

const INTERVAL_SECONDS: Record<CandleInterval, number> = {
  "1m": 60, "5m": 300, "15m": 900, "1h": 3600, "4h": 14400, "1d": 86400,
};

export function generateCandles(symbol: string, interval: CandleInterval, limit: number): Candle[] {
  const meta = ASSET_META[symbol];
  if (!meta) return [];

  const r       = lcg(symbolSeed(symbol) ^ (INTERVAL_SECONDS[interval] * 7));
  const barSecs = INTERVAL_SECONDS[interval];
  const now     = Math.floor(Date.now() / barSecs) * barSecs;
  const σ       = meta.volatility * Math.sqrt(barSecs / 3600);

  let price = meta.basePrice * Math.pow(1 - 0.0001, limit);
  const candles: Candle[] = [];

  for (let i = 0; i < limit; i++) {
    const time   = now - (limit - 1 - i) * barSecs;
    const change = normalRandom(r) * σ + 0.0001;
    const close  = price * (1 + change);
    const open   = price;
    const body   = Math.abs(close - open);
    const high   = Math.max(open, close) + body * r() * 0.8 + price * σ * 0.2;
    const low    = Math.min(open, close) - body * r() * 0.8 - price * σ * 0.2;
    const volume = meta.avgVolume * barSecs / 3600 * (0.5 + r());
    candles.push({ time, open, high: Math.max(high, open, close), low: Math.min(low, open, close), close, volume });
    price = close;
  }
  return candles;
}

export function generateSparkline(symbol: string): number[] {
  return generateCandles(symbol, "1h", 24).map((c) => c.close);
}

// ── OrderBook ────────────────────────────────────────────────────────────────

export function generateOrderBook(symbol: string, currentPrice: number, depth = 20): OrderBook {
  const meta   = ASSET_META[symbol];
  if (!meta) throw new Error(`Unknown symbol: ${symbol}`);
  const r      = lcg(symbolSeed(symbol) + Math.floor(Date.now() / 2000));
  const spread = currentPrice * 0.00015;
  const tick   = currentPrice * 0.0001;

  let bidTotal = 0;
  const bids: OrderBookLevel[] = Array.from({ length: depth }, (_, i) => {
    const price = currentPrice - spread / 2 - i * tick;
    const size  = (meta.avgVolume / 1_000_000) * (1 + r() * 4) * Math.exp(-i * 0.18);
    bidTotal   += size;
    return { price, size: parseFloat(size.toFixed(4)), total: parseFloat(bidTotal.toFixed(4)) };
  });

  let askTotal = 0;
  const asks: OrderBookLevel[] = Array.from({ length: depth }, (_, i) => {
    const price = currentPrice + spread / 2 + i * tick;
    const size  = (meta.avgVolume / 1_000_000) * (1 + r() * 4) * Math.exp(-i * 0.18);
    askTotal   += size;
    return { price, size: parseFloat(size.toFixed(4)), total: parseFloat(askTotal.toFixed(4)) };
  });

  return { symbol, bids, asks, timestamp: Date.now() };
}

// ── Portfolio ────────────────────────────────────────────────────────────────

export const MOCK_PORTFOLIO: PortfolioSummary = {
  equity:    142_680.50,
  cash:      24_200.00,
  dayPnl:    1_386.20,
  dayPnlPct: 0.98,
  totalPnl:  42_680.50,
  positions: [
    { symbol: "AAPL",    qty: 50,   avgEntryPrice: 172.10, currentPrice: 187.42, marketValue:  9_371.00, unrealizedPnl:   766.00, unrealizedPnlPct:  8.91, type: "stock", currency: "USD" },
    { symbol: "NVDA",    qty: 20,   avgEntryPrice: 420.00, currentPrice: 875.80, marketValue: 17_516.00, unrealizedPnl: 9_116.00, unrealizedPnlPct: 108.52, type: "stock", currency: "USD" },
    { symbol: "TSLA",    qty: 30,   avgEntryPrice: 240.00, currentPrice: 192.30, marketValue:  5_769.00, unrealizedPnl: -1_431.00,unrealizedPnlPct:-19.83,  type: "stock", currency: "USD" },
    { symbol: "BABA",    qty: 100,  avgEntryPrice: 72.00,  currentPrice: 82.40,  marketValue:  8_240.00, unrealizedPnl: 1_040.00, unrealizedPnlPct: 14.44,  type: "stock", currency: "USD" },
    { symbol: "BTCUSDT", qty: 0.8,  avgEntryPrice: 42_000, currentPrice: 68_400, marketValue: 54_720.00, unrealizedPnl: 21_120.00,unrealizedPnlPct: 62.86,  type: "crypto",currency: "USD" },
    { symbol: "ETHUSDT", qty: 3,    avgEntryPrice: 2_200,  currentPrice: 3_520,  marketValue: 10_560.00, unrealizedPnl: 3_960.00, unrealizedPnlPct: 60.00,  type: "crypto",currency: "USD" },
    { symbol: "HK0700",  qty: 200,  avgEntryPrice: 310.00, currentPrice: 372.00, marketValue: 74_400.00, unrealizedPnl: 12_400.00,unrealizedPnlPct: 20.00,  type: "hk",    currency: "HKD" },
    { symbol: "HK9988",  qty: 500,  avgEntryPrice: 68.00,  currentPrice: 75.40,  marketValue: 37_700.00, unrealizedPnl: 3_700.00, unrealizedPnlPct: 10.88,  type: "hk",    currency: "HKD" },
    { symbol: "CNMTAI",  qty: 10,   avgEntryPrice: 1_580,  currentPrice: 1_748,  marketValue: 17_480.00, unrealizedPnl: 1_680.00, unrealizedPnlPct: 10.63,  type: "cn",    currency: "CNY" },
    { symbol: "CNBYD",   qty: 100,  avgEntryPrice: 258.00, currentPrice: 285.20, marketValue: 28_520.00, unrealizedPnl: 2_720.00, unrealizedPnlPct: 10.54,  type: "cn",    currency: "CNY" },
  ],
};

// ── AI Analyses ──────────────────────────────────────────────────────────────

/** Two languages per symbol. Route returns the right one based on Accept-Language. */
export const MOCK_AI_ANALYSES: Record<string, Record<"en" | "zh", Omit<AIAnalysis, "symbol" | "timestamp">>> = {
  AAPL: {
    en: { sentiment: "bullish", summary: "Apple continues to show resilience with strong services revenue growth and stable iPhone demand. The stock is consolidating near all-time highs with supportive macro conditions for large-cap tech.", keyLevels: { support: 182.00, resistance: 195.00 }, signals: ["RSI at 58 — momentum building", "Golden cross on daily chart", "Services revenue beat estimates by 6%"], riskLevel: "low" },
    zh: { sentiment: "bullish", summary: "苹果公司服务业务收入持续强劲增长，iPhone需求保持稳定，显示出较强韧性。股价在历史高位附近整固，宏观环境对大市值科技股构成支撑。", keyLevels: { support: 182.00, resistance: 195.00 }, signals: ["RSI 58点，动能持续积累", "日线金叉形态确立", "服务业务营收超预期6%"], riskLevel: "low" },
  },
  TSLA: {
    en: { sentiment: "neutral", summary: "Tesla faces near-term margin pressure from price cuts but long-term EV demand remains intact. Robotaxi timeline clarity is the next key catalyst.", keyLevels: { support: 175.00, resistance: 215.00 }, signals: ["Volume declining — consolidation phase", "FSD v13 rollout update pending", "Margin headwinds from price competition"], riskLevel: "medium" },
    zh: { sentiment: "neutral", summary: "特斯拉短期面临降价带来的利润压力，但长期电动车需求依然稳健。Robotaxi时间表的明朗化将是下一个重要催化剂，现阶段维持中性观望。", keyLevels: { support: 175.00, resistance: 215.00 }, signals: ["成交量萎缩，价格进入整固", "FSD v13全面推送待定", "价格战拖累毛利率"], riskLevel: "medium" },
  },
  NVDA: {
    en: { sentiment: "bullish", summary: "NVIDIA maintains its dominant position in AI accelerator chips with Blackwell demand far exceeding supply. Data center revenue compounding at 100%+ YoY.", keyLevels: { support: 820.00, resistance: 950.00 }, signals: ["AI capex cycle in full swing", "Blackwell supply constraint easing H2", "Multiple expansion risk if AI spending slows"], riskLevel: "medium" },
    zh: { sentiment: "bullish", summary: "英伟达在AI加速芯片领域保持绝对主导地位，Blackwell需求远超供应。数据中心营收同比增速超过100%，AI资本开支周期仍处于全面扩张阶段。", keyLevels: { support: 820.00, resistance: 950.00 }, signals: ["AI资本开支周期全面展开", "Blackwell供应瓶颈下半年有望缓解", "若AI支出放缓存在估值回调风险"], riskLevel: "medium" },
  },
  MSFT: {
    en: { sentiment: "bullish", summary: "Microsoft's Azure cloud business accelerating with AI workloads. Copilot integration across enterprise products creating durable pricing power.", keyLevels: { support: 395.00, resistance: 435.00 }, signals: ["Azure growth re-accelerating to 30%+", "Copilot ARR exceeding expectations", "PE at 32x — fair for growth profile"], riskLevel: "low" },
    zh: { sentiment: "bullish", summary: "微软Azure云业务受AI工作负载驱动持续加速，Copilot在企业产品中的深度整合形成持久定价权。风险收益比在大型科技股中最为均衡。", keyLevels: { support: 395.00, resistance: 435.00 }, signals: ["Azure增速重新加速至30%+", "Copilot年度经常性收入超预期", "市盈率32倍，与增长匹配"], riskLevel: "low" },
  },
  GOOGL: {
    en: { sentiment: "neutral", summary: "Alphabet faces a critical period as AI-native search challenges its core business. YouTube and Cloud are bright spots. Range-bound pending search disruption clarity.", keyLevels: { support: 162.00, resistance: 185.00 }, signals: ["Search market share steady at 89%", "Cloud margins expanding positively", "AI Overviews reducing click-through rates"], riskLevel: "medium" },
    zh: { sentiment: "neutral", summary: "谷歌正处于关键转型期，AI原生搜索对其核心业务形成挑战。YouTube和云计算是亮点。搜索业务受冲击程度明朗之前，股价可能维持区间震荡。", keyLevels: { support: 162.00, resistance: 185.00 }, signals: ["搜索市场份额稳定在89%", "云业务利润率持续改善", "AI摘要功能降低用户点击率"], riskLevel: "medium" },
  },
  BTCUSDT: {
    en: { sentiment: "bullish", summary: "Bitcoin is in a post-halving bull phase with institutional demand via ETFs providing a structural bid. Spot ETF inflows remain robust.", keyLevels: { support: 62_000, resistance: 75_000 }, signals: ["ETF daily inflows averaging $300M+", "Long-term holder supply at cycle highs", "Halving supply shock fully priced in H2"], riskLevel: "medium" },
    zh: { sentiment: "bullish", summary: "比特币处于减半后牛市阶段，机构通过ETF持续流入提供结构性支撑。现货ETF日均净流入维持高位，链上长期持有者筹码处于周期高位。", keyLevels: { support: 62_000, resistance: 75_000 }, signals: ["ETF日均净流入超3亿美元", "长期持有者筹码处于周期高位", "减半供应冲击已在下半年充分定价"], riskLevel: "medium" },
  },
  ETHUSDT: {
    en: { sentiment: "bullish", summary: "Ethereum's deflationary supply mechanics reasserting post-EIP-4844. L2 activity surging, boosting base layer fee burn. Spot ETF catalyst remains a potential re-rating event.", keyLevels: { support: 3_200, resistance: 4_000 }, signals: ["Blob fees growing — L2 ecosystem healthy", "ETF approval improving institutional narrative", "Staking yield compressing supply"], riskLevel: "medium" },
    zh: { sentiment: "bullish", summary: "EIP-4844后以太坊通缩机制重新确立，L2活跃度大幅提升带动基础层费用销毁增加。现货ETF批准预期持续改善机构叙事，潜在重新估值机会值得关注。", keyLevels: { support: 3_200, resistance: 4_000 }, signals: ["Blob费用增长，L2生态健康", "ETF获批预期提升机构参与意愿", "质押收益率压缩流通供应"], riskLevel: "medium" },
  },
  SOLUSDT: {
    en: { sentiment: "bullish", summary: "Solana is the fastest-growing L1 by DEX volume and active addresses. 99.9%+ uptime over the past year. Meme coin activity and DePIN driving transaction volume to new highs.", keyLevels: { support: 165.00, resistance: 205.00 }, signals: ["DEX volume #1 across all L1s", "DePIN TVL growing 40% QoQ", "Validator count at all-time high"], riskLevel: "high" },
    zh: { sentiment: "bullish", summary: "Solana是DEX交易量和活跃地址增速最快的L1公链，过去一年正常运行率超99.9%。Meme币和DePIN应用持续推动链上交易量创历史新高。", keyLevels: { support: 165.00, resistance: 205.00 }, signals: ["DEX交易量全L1排名第一", "DePIN总锁仓量季环比增长40%", "验证者数量创历史新高"], riskLevel: "high" },
  },
  BABA: {
    en: { sentiment: "neutral", summary: "Alibaba is navigating a difficult period with intensified domestic competition from PDD and JD, while cloud and international commerce provide incremental growth. Regulatory pressure has largely stabilised.", keyLevels: { support: 75.00, resistance: 92.00 }, signals: ["Cloud revenue growth re-accelerating to 9%+", "International commerce (AIDC) growing 40% YoY", "PDD Temu competition pressuring domestic GMV"], riskLevel: "medium" },
    zh: { sentiment: "neutral", summary: "阿里巴巴正艰难应对拼多多和京东的国内竞争加剧，云计算和国际商业提供增量增长动力。监管压力已基本趋于稳定，当前估值处于历史低位区间。", keyLevels: { support: 75.00, resistance: 92.00 }, signals: ["云计算营收增速重回9%+", "国际商业(AIDC)同比增长40%", "Temu竞争持续压制国内GMV"], riskLevel: "medium" },
  },
  PDD: {
    en: { sentiment: "bullish", summary: "Pinduoduo continues its explosive growth trajectory with Temu's international expansion offsetting slowing domestic growth. Margins remain under pressure but manageable.", keyLevels: { support: 122.00, resistance: 158.00 }, signals: ["Temu active in 50+ countries", "Domestic active users still growing double-digits", "Margin compression from Temu investment cycle"], riskLevel: "high" },
    zh: { sentiment: "bullish", summary: "拼多多保持强劲增长势头，Temu国际扩张有效弥补国内增速放缓。利润率承压但属可控范围。低价策略在消费降级环境中具有显著优势。", keyLevels: { support: 122.00, resistance: 158.00 }, signals: ["Temu已进入50+国家和地区", "国内月活用户仍保持两位数增长", "Temu投入期拖累整体利润率"], riskLevel: "high" },
  },
  JD: {
    en: { sentiment: "neutral", summary: "JD.com's logistics-first model provides competitive advantages in electronics and home appliances. However, topline growth has decelerated amid macro headwinds and fierce competition.", keyLevels: { support: 24.00, resistance: 33.00 }, signals: ["Logistics revenue growing faster than retail", "Cost efficiency drive improving EBITA margins", "Consumer electronics category under pressure from rivals"], riskLevel: "medium" },
    zh: { sentiment: "neutral", summary: "京东以物流为核心的模式在3C和家电品类中具有竞争壁垒，但宏观逆风和竞争加剧导致收入增速明显放缓。降本增效推动EBITA利润率改善。", keyLevels: { support: 24.00, resistance: 33.00 }, signals: ["物流业务增速超越零售主业", "降本增效推动EBITA利润率提升", "3C品类受竞争对手冲击明显"], riskLevel: "medium" },
  },
  BIDU: {
    en: { sentiment: "neutral", summary: "Baidu's ERNIE Bot AI capabilities are improving rapidly but monetisation remains the key challenge. Autonomous driving (Apollo Go) is a long-term optionality. Online advertising recovery is gradual.", keyLevels: { support: 85.00, resistance: 108.00 }, signals: ["ERNIE Bot monthly active users surpassing 300M", "Apollo Go expanding to 10 new cities", "Ad revenue recovery lagging broader digital ad market"], riskLevel: "medium" },
    zh: { sentiment: "neutral", summary: "百度文心一言大模型能力快速提升，但商业化落地仍是关键挑战。自动驾驶（萝卜快跑）提供长期期权价值。在线广告复苏进程较数字广告大盘明显滞后。", keyLevels: { support: 85.00, resistance: 108.00 }, signals: ["文心一言月活用户突破3亿", "萝卜快跑扩展至10个新城市", "广告收入复苏落后于行业整体"], riskLevel: "medium" },
  },
  NIO: {
    en: { sentiment: "bearish", summary: "NIO faces mounting cash burn and intensifying EV price war pressure. Vehicle deliveries are growing but margins remain deeply negative. The ONVO brand launch is critical for reaching profitability.", keyLevels: { support: 4.80, resistance: 7.20 }, signals: ["Monthly deliveries trending to 30K+", "ONVO L60 targeting mainstream price segment", "Cash runway requires additional financing in 2025"], riskLevel: "high" },
    zh: { sentiment: "bearish", summary: "蔚来面临持续的现金消耗和激烈的电动车价格战压力，交付量增长但毛利率仍深度亏损。乐道品牌发布是走向盈利的关键节点，现金储备需要持续补充。", keyLevels: { support: 4.80, resistance: 7.20 }, signals: ["月交付量趋势向3万辆+", "乐道L60主攻主流价格区间", "现金储备需在2025年前补充融资"], riskLevel: "high" },
  },
  HK0700: {
    en: { sentiment: "bullish", summary: "Tencent's gaming business is recovering strongly with new title approvals accelerating. WeChat ecosystem continues to monetise through mini-programs and video accounts. AI integration across products is a key re-rating catalyst.", keyLevels: { support: 340.00, resistance: 410.00 }, signals: ["Game approvals at multi-year highs", "Video account advertising RPM growing 50%+ YoY", "Share buyback programme of HK$100B+"], riskLevel: "low" },
    zh: { sentiment: "bullish", summary: "腾讯游戏业务伴随版号审批提速强劲复苏，微信生态持续通过小程序和视频号深化变现。AI能力全面整合将成为核心重新估值催化剂，百亿港元回购计划提供下行保护。", keyLevels: { support: 340.00, resistance: 410.00 }, signals: ["游戏版号审批量创多年新高", "视频号广告eCPM同比增长50%+", "百亿港元规模股票回购持续推进"], riskLevel: "low" },
  },
  HK9988: {
    en: { sentiment: "neutral", summary: "Alibaba HK shares track the ADR closely. Cloud and international growth provide upside optionality while domestic e-commerce faces structural headwinds from PDD.", keyLevels: { support: 68.00, resistance: 85.00 }, signals: ["HK listing primary venue for regional funds", "Cloud margin inflection expected in H2", "Strategic asset monetisation ongoing"], riskLevel: "medium" },
    zh: { sentiment: "neutral", summary: "阿里港股与ADR走势基本同步。云计算和国际业务增长提供上行期权，国内电商持续面临拼多多的结构性竞争压力。港股流动性改善有助于吸引区域资金配置。", keyLevels: { support: 68.00, resistance: 85.00 }, signals: ["港股成为区域基金主要配置渠道", "云业务利润拐点有望下半年兑现", "非核心资产持续处置变现"], riskLevel: "medium" },
  },
  HK3690: {
    en: { sentiment: "bullish", summary: "Meituan's core food delivery business remains a structural compounder. In-store hotel & travel recovery is gaining momentum. Overseas expansion (Keeta) adds long-term optionality.", keyLevels: { support: 130.00, resistance: 168.00 }, signals: ["Core food delivery EBITDA margin at record highs", "Keeta expanding in Middle East & HK markets", "Instant commerce growth 30%+ YoY"], riskLevel: "medium" },
    zh: { sentiment: "bullish", summary: "美团核心外卖业务持续复合增长，到店及酒旅业务复苏动能强劲。海外扩张（Keeta）为长期增长提供新的期权价值，即时零售业务高速增长。", keyLevels: { support: 130.00, resistance: 168.00 }, signals: ["核心外卖EBITDA利润率创历史新高", "Keeta积极拓展中东及港澳市场", "即时零售GMV同比增长30%+"], riskLevel: "medium" },
  },
  HK1810: {
    en: { sentiment: "bullish", summary: "Xiaomi's smartphone recovery is outperforming peers. The EV launch (SU7) has exceeded expectations with strong demand. IoT ecosystem creates a durable competitive moat.", keyLevels: { support: 16.00, resistance: 22.00 }, signals: ["SU7 deliveries exceeding 20K/month", "Global smartphone shipments growing 8% YoY", "AIoT devices approaching 1 billion connected"], riskLevel: "medium" },
    zh: { sentiment: "bullish", summary: "小米智能手机复苏明显优于同行。电动车SU7发布超预期，市场需求强劲。IoT生态系统构建了持久的竞争护城河，全球接入设备即将突破10亿台。", keyLevels: { support: 16.00, resistance: 22.00 }, signals: ["SU7月交付量突破2万辆", "全球手机出货量同比增长8%", "AIoT接入设备接近10亿台"], riskLevel: "medium" },
  },
  // ── A-shares ────────────────────────────────────────────────────────────────
  CNMTAI: {
    en: { sentiment: "bullish", summary: "Kweichow Moutai remains China's most prestigious spirits brand with exceptional pricing power. The company's direct sales channel expansion is driving margin improvement. Long-term demand from gift-giving and banquet culture remains structural.", keyLevels: { support: 1_680, resistance: 1_840 }, signals: ["Direct sales channel share reaching 40%+", "Wholesale price premium maintained above ¥2,800", "Free cash flow yield ~3% at current price"], riskLevel: "low" },
    zh: { sentiment: "bullish", summary: "贵州茅台凭借极强的品牌定价权长期屹立A股之巅。直销渠道占比持续提升推动利润率改善，礼赠及宴席文化提供结构性需求支撑，现金流充沛，是价值投资者的核心配置标的。", keyLevels: { support: 1_680, resistance: 1_840 }, signals: ["直销渠道占比突破40%", "批发价格维持2800元以上溢价", "当前股价自由现金流收益率约3%"], riskLevel: "low" },
  },
  CNCATL: {
    en: { sentiment: "bullish", summary: "CATL is expanding globally with European and North American gigafactories while maintaining 37%+ global EV battery market share. Sodium-ion and solid-state battery commercialisation timelines are key catalysts.", keyLevels: { support: 220, resistance: 272 }, signals: ["Global market share stable at 37%+", "European gigafactory nearing production ramp", "Sodium-ion battery mass production from 2025"], riskLevel: "medium" },
    zh: { sentiment: "bullish", summary: "宁德时代全球市占率稳居37%以上，欧洲及北美超级工厂持续推进产能落地。钠离子和固态电池量产时间表是核心催化剂，全球化布局构建了竞争护城河。", keyLevels: { support: 220, resistance: 272 }, signals: ["全球市占率稳定在37%以上", "欧洲超级工厂即将进入产能爬坡期", "钠离子电池2025年实现大规模量产"], riskLevel: "medium" },
  },
  CNBYD: {
    en: { sentiment: "bullish", summary: "BYD is the world's top-selling EV brand, outpacing Tesla in volume. Its vertically integrated supply chain gives unmatched cost advantages. Overseas expansion into Europe and Southeast Asia broadens the growth runway.", keyLevels: { support: 258, resistance: 318 }, signals: ["Monthly sales exceeding 400K vehicles", "Seagull EV driving emerging market penetration", "Overseas revenue growing 60%+ YoY"], riskLevel: "medium" },
    zh: { sentiment: "bullish", summary: "比亚迪已成为全球销量最高的新能源汽车品牌，垂直整合供应链带来无与伦比的成本优势。出海战略加速推进，欧洲及东南亚市场为成长打开更广阔空间。", keyLevels: { support: 258, resistance: 318 }, signals: ["月销量突破40万辆", "海鸥车型驱动新兴市场渗透率快速提升", "海外营收同比增长60%+"], riskLevel: "medium" },
  },
  CNPING: {
    en: { sentiment: "neutral", summary: "Ping An Insurance is a financial conglomerate with leading positions in life insurance, property insurance, and banking. Near-term challenges include credit quality concerns in its banking arm and soft premium growth amid macro weakness.", keyLevels: { support: 40.5, resistance: 49.8 }, signals: ["Life insurance NBV growth recovering to 6%+", "Ping An Bank NPL ratio stabilising", "Dividend yield ~5.5% offering downside support"], riskLevel: "medium" },
    zh: { sentiment: "neutral", summary: "中国平安是寿险、财险和银行领域均居于领先的综合金融集团。短期挑战在于银行板块资产质量承压以及宏观下行背景下保费增长放缓，高股息收益率提供安全边际。", keyLevels: { support: 40.5, resistance: 49.8 }, signals: ["寿险新业务价值增速回升至6%+", "平安银行不良率趋于稳定", "股息收益率约5.5%，提供下行保护"], riskLevel: "medium" },
  },
  CNICBC: {
    en: { sentiment: "neutral", summary: "ICBC is the world's largest bank by total assets with a stable business model anchored in retail and corporate deposits. Net interest margin compression is the key risk. The stock's 6%+ dividend yield makes it a popular income holding.", keyLevels: { support: 6.0, resistance: 7.2 }, signals: ["NIM stabilising as rate cuts slow", "Dividend payout ratio maintained at ~30%", "State-backed asset quality support limiting downside"], riskLevel: "low" },
    zh: { sentiment: "neutral", summary: "工商银行是全球资产规模最大的商业银行，以零售和对公存款为核心的商业模式稳健。净息差收窄是主要风险，6%以上的股息收益率使其成为受欢迎的高息配置品种。", keyLevels: { support: 6.0, resistance: 7.2 }, signals: ["随利率下调节奏放缓，净息差趋于稳定", "股息分配比例维持约30%", "国家背书支撑资产质量，下行空间有限"], riskLevel: "low" },
  },
};
