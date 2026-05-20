/**
 * asset-registry.ts — Comprehensive searchable asset catalog
 *
 * Single source of truth for every symbol the app can display or trade.
 * Used by:
 *   - Search modal (client-side instant search, EN + ZH)
 *   - Yahoo Finance / Binance ticker mapping (server-side)
 *   - Mock data fallback for symbols not in original ASSET_META
 */

import type { AssetType } from "./types";

export interface AssetEntry {
  /** Internal app symbol (e.g. "AAPL", "HK0700", "CNMTAI", "BTCUSDT", "USDCNY") */
  symbol:    string;
  /** Yahoo Finance ticker (may differ from symbol) */
  yfTicker:  string;
  /** English name */
  name:      string;
  /** Simplified Chinese name */
  nameCN:    string;
  type:      AssetType;
  currency:  "USD" | "HKD" | "CNY";
  market:    "US" | "HK" | "CN" | "CRYPTO" | "FX";
  /** Approximate base price for mock fallback */
  basePrice: number;
  sector?:   string;
  sectorCN?: string;
}

export const ASSET_CATALOG: AssetEntry[] = [

  // ── Forex — CNY pairs (primary) ────────────────────────────────────────
  { symbol:"USDCNY", yfTicker:"USDCNY=X", name:"US Dollar / Chinese Yuan",       nameCN:"美元兑人民币",  type:"forex", currency:"CNY", market:"FX", basePrice:7.24  },
  { symbol:"EURCNY", yfTicker:"EURCNY=X", name:"Euro / Chinese Yuan",            nameCN:"欧元兑人民币",  type:"forex", currency:"CNY", market:"FX", basePrice:7.85  },
  { symbol:"GBPCNY", yfTicker:"GBPCNY=X", name:"British Pound / Chinese Yuan",   nameCN:"英镑兑人民币",  type:"forex", currency:"CNY", market:"FX", basePrice:9.20  },
  { symbol:"JPYCNY", yfTicker:"JPYCNY=X", name:"Japanese Yen / Chinese Yuan",    nameCN:"日元兑人民币",  type:"forex", currency:"CNY", market:"FX", basePrice:0.0481},
  { symbol:"HKDCNY", yfTicker:"HKDCNY=X", name:"Hong Kong Dollar / Chinese Yuan",nameCN:"港元兑人民币",  type:"forex", currency:"CNY", market:"FX", basePrice:0.928 },
  { symbol:"AUDCNY", yfTicker:"AUDCNY=X", name:"Australian Dollar / Chinese Yuan",nameCN:"澳元兑人民币",  type:"forex", currency:"CNY", market:"FX", basePrice:4.62  },
  { symbol:"CADCNY", yfTicker:"CADCNY=X", name:"Canadian Dollar / Chinese Yuan", nameCN:"加元兑人民币",  type:"forex", currency:"CNY", market:"FX", basePrice:5.28  },
  { symbol:"CHFCNY", yfTicker:"CHFCNY=X", name:"Swiss Franc / Chinese Yuan",     nameCN:"瑞郎兑人民币",  type:"forex", currency:"CNY", market:"FX", basePrice:8.15  },
  { symbol:"SGDCNY", yfTicker:"SGDCNY=X", name:"Singapore Dollar / Chinese Yuan",nameCN:"新加坡元兑人民币",type:"forex",currency:"CNY", market:"FX", basePrice:5.37  },
  { symbol:"KRWCNY", yfTicker:"KRWCNY=X", name:"Korean Won / Chinese Yuan",      nameCN:"韩元兑人民币",  type:"forex", currency:"CNY", market:"FX", basePrice:0.0052},
  // ── Forex — major cross pairs ──────────────────────────────────────────
  { symbol:"EURUSD", yfTicker:"EURUSD=X", name:"Euro / US Dollar",               nameCN:"欧元兑美元",    type:"forex", currency:"USD", market:"FX", basePrice:1.085 },
  { symbol:"USDJPY", yfTicker:"JPY=X",    name:"US Dollar / Japanese Yen",       nameCN:"美元兑日元",    type:"forex", currency:"USD", market:"FX", basePrice:150.5 },
  { symbol:"GBPUSD", yfTicker:"GBPUSD=X", name:"British Pound / US Dollar",      nameCN:"英镑兑美元",    type:"forex", currency:"USD", market:"FX", basePrice:1.27  },

  // ── Crypto ─────────────────────────────────────────────────────────────
  { symbol:"BTCUSDT",  yfTicker:"BTC-USD",    name:"Bitcoin",          nameCN:"比特币",      type:"crypto", currency:"USD", market:"CRYPTO", basePrice:77000  },
  { symbol:"ETHUSDT",  yfTicker:"ETH-USD",    name:"Ethereum",         nameCN:"以太坊",      type:"crypto", currency:"USD", market:"CRYPTO", basePrice:3000   },
  { symbol:"SOLUSDT",  yfTicker:"SOL-USD",    name:"Solana",           nameCN:"索拉纳",      type:"crypto", currency:"USD", market:"CRYPTO", basePrice:150    },
  { symbol:"BNBUSDT",  yfTicker:"BNB-USD",    name:"BNB",              nameCN:"币安币",      type:"crypto", currency:"USD", market:"CRYPTO", basePrice:600    },
  { symbol:"XRPUSDT",  yfTicker:"XRP-USD",    name:"XRP",              nameCN:"瑞波币",      type:"crypto", currency:"USD", market:"CRYPTO", basePrice:2.5    },
  { symbol:"DOGEUSDT", yfTicker:"DOGE-USD",   name:"Dogecoin",         nameCN:"狗狗币",      type:"crypto", currency:"USD", market:"CRYPTO", basePrice:0.35   },
  { symbol:"ADAUSDT",  yfTicker:"ADA-USD",    name:"Cardano",          nameCN:"卡尔达诺",    type:"crypto", currency:"USD", market:"CRYPTO", basePrice:0.85   },
  { symbol:"AVAXUSDT", yfTicker:"AVAX-USD",   name:"Avalanche",        nameCN:"雪崩协议",    type:"crypto", currency:"USD", market:"CRYPTO", basePrice:35     },
  { symbol:"DOTUSDT",  yfTicker:"DOT-USD",    name:"Polkadot",         nameCN:"波卡",        type:"crypto", currency:"USD", market:"CRYPTO", basePrice:8      },
  { symbol:"LINKUSDT", yfTicker:"LINK-USD",   name:"Chainlink",        nameCN:"链链接",      type:"crypto", currency:"USD", market:"CRYPTO", basePrice:15     },
  { symbol:"UNIUSDT",  yfTicker:"UNI-USD",    name:"Uniswap",          nameCN:"Uniswap",     type:"crypto", currency:"USD", market:"CRYPTO", basePrice:10     },
  { symbol:"LTCUSDT",  yfTicker:"LTC-USD",    name:"Litecoin",         nameCN:"莱特币",      type:"crypto", currency:"USD", market:"CRYPTO", basePrice:90     },
  { symbol:"SUIUSDT",  yfTicker:"SUI-USD",    name:"Sui",              nameCN:"Sui",         type:"crypto", currency:"USD", market:"CRYPTO", basePrice:3.5    },
  { symbol:"PEPEUSDT", yfTicker:"PEPE-USD",   name:"Pepe",             nameCN:"青蛙币",      type:"crypto", currency:"USD", market:"CRYPTO", basePrice:0.00001},
  { symbol:"TONUSDT",  yfTicker:"TON-USD",    name:"Toncoin",          nameCN:"Toncoin",     type:"crypto", currency:"USD", market:"CRYPTO", basePrice:5      },

  // ── US Equities — Tech ─────────────────────────────────────────────────
  { symbol:"AAPL",  yfTicker:"AAPL",  name:"Apple",             nameCN:"苹果",        type:"stock", currency:"USD", market:"US", basePrice:200,  sector:"Technology",    sectorCN:"科技"   },
  { symbol:"MSFT",  yfTicker:"MSFT",  name:"Microsoft",         nameCN:"微软",        type:"stock", currency:"USD", market:"US", basePrice:420,  sector:"Technology",    sectorCN:"科技"   },
  { symbol:"NVDA",  yfTicker:"NVDA",  name:"NVIDIA",            nameCN:"英伟达",      type:"stock", currency:"USD", market:"US", basePrice:900,  sector:"Semiconductors",sectorCN:"半导体" },
  { symbol:"GOOGL", yfTicker:"GOOGL", name:"Alphabet",          nameCN:"谷歌",        type:"stock", currency:"USD", market:"US", basePrice:175,  sector:"Technology",    sectorCN:"科技"   },
  { symbol:"META",  yfTicker:"META",  name:"Meta Platforms",    nameCN:"Meta",        type:"stock", currency:"USD", market:"US", basePrice:580,  sector:"Technology",    sectorCN:"科技"   },
  { symbol:"AMZN",  yfTicker:"AMZN",  name:"Amazon",            nameCN:"亚马逊",      type:"stock", currency:"USD", market:"US", basePrice:200,  sector:"Technology",    sectorCN:"科技"   },
  { symbol:"TSLA",  yfTicker:"TSLA",  name:"Tesla",             nameCN:"特斯拉",      type:"stock", currency:"USD", market:"US", basePrice:280,  sector:"Automotive",    sectorCN:"汽车"   },
  { symbol:"AMD",   yfTicker:"AMD",   name:"AMD",               nameCN:"AMD超威",     type:"stock", currency:"USD", market:"US", basePrice:130,  sector:"Semiconductors",sectorCN:"半导体" },
  { symbol:"INTC",  yfTicker:"INTC",  name:"Intel",             nameCN:"英特尔",      type:"stock", currency:"USD", market:"US", basePrice:22,   sector:"Semiconductors",sectorCN:"半导体" },
  { symbol:"QCOM",  yfTicker:"QCOM",  name:"Qualcomm",          nameCN:"高通",        type:"stock", currency:"USD", market:"US", basePrice:165,  sector:"Semiconductors",sectorCN:"半导体" },
  { symbol:"AVGO",  yfTicker:"AVGO",  name:"Broadcom",          nameCN:"博通",        type:"stock", currency:"USD", market:"US", basePrice:220,  sector:"Semiconductors",sectorCN:"半导体" },
  { symbol:"NFLX",  yfTicker:"NFLX",  name:"Netflix",           nameCN:"奈飞",        type:"stock", currency:"USD", market:"US", basePrice:1000, sector:"Technology",    sectorCN:"科技"   },
  { symbol:"CRM",   yfTicker:"CRM",   name:"Salesforce",        nameCN:"赛富时",      type:"stock", currency:"USD", market:"US", basePrice:310,  sector:"Technology",    sectorCN:"科技"   },
  { symbol:"ORCL",  yfTicker:"ORCL",  name:"Oracle",            nameCN:"甲骨文",      type:"stock", currency:"USD", market:"US", basePrice:170,  sector:"Technology",    sectorCN:"科技"   },
  { symbol:"ADBE",  yfTicker:"ADBE",  name:"Adobe",             nameCN:"奥多比",      type:"stock", currency:"USD", market:"US", basePrice:420,  sector:"Technology",    sectorCN:"科技"   },
  { symbol:"NOW",   yfTicker:"NOW",   name:"ServiceNow",        nameCN:"ServiceNow",  type:"stock", currency:"USD", market:"US", basePrice:950,  sector:"Technology",    sectorCN:"科技"   },
  { symbol:"PLTR",  yfTicker:"PLTR",  name:"Palantir",          nameCN:"帕兰提尔",    type:"stock", currency:"USD", market:"US", basePrice:90,   sector:"Technology",    sectorCN:"科技"   },
  { symbol:"SHOP",  yfTicker:"SHOP",  name:"Shopify",           nameCN:"Shopify",     type:"stock", currency:"USD", market:"US", basePrice:110,  sector:"Technology",    sectorCN:"科技"   },
  { symbol:"UBER",  yfTicker:"UBER",  name:"Uber",              nameCN:"优步",        type:"stock", currency:"USD", market:"US", basePrice:80,   sector:"Technology",    sectorCN:"科技"   },
  { symbol:"COIN",  yfTicker:"COIN",  name:"Coinbase",          nameCN:"Coinbase",    type:"stock", currency:"USD", market:"US", basePrice:230,  sector:"Financials",    sectorCN:"金融"   },
  { symbol:"MSTR",  yfTicker:"MSTR",  name:"MicroStrategy",     nameCN:"微策略",      type:"stock", currency:"USD", market:"US", basePrice:380,  sector:"Technology",    sectorCN:"科技"   },

  // ── US — Finance ────────────────────────────────────────────────────────
  { symbol:"JPM",   yfTicker:"JPM",   name:"JPMorgan Chase",    nameCN:"摩根大通",    type:"stock", currency:"USD", market:"US", basePrice:240,  sector:"Financials",    sectorCN:"金融"   },
  { symbol:"GS",    yfTicker:"GS",    name:"Goldman Sachs",     nameCN:"高盛",        type:"stock", currency:"USD", market:"US", basePrice:560,  sector:"Financials",    sectorCN:"金融"   },
  { symbol:"V",     yfTicker:"V",     name:"Visa",              nameCN:"维萨",        type:"stock", currency:"USD", market:"US", basePrice:330,  sector:"Financials",    sectorCN:"金融"   },
  { symbol:"MA",    yfTicker:"MA",    name:"Mastercard",        nameCN:"万事达",      type:"stock", currency:"USD", market:"US", basePrice:530,  sector:"Financials",    sectorCN:"金融"   },
  { symbol:"BRK-B", yfTicker:"BRK-B", name:"Berkshire Hathaway",nameCN:"伯克希尔",    type:"stock", currency:"USD", market:"US", basePrice:470,  sector:"Financials",    sectorCN:"金融"   },

  // ── US — Other sectors ──────────────────────────────────────────────────
  { symbol:"WMT",   yfTicker:"WMT",   name:"Walmart",           nameCN:"沃尔玛",      type:"stock", currency:"USD", market:"US", basePrice:95,   sector:"Consumer",      sectorCN:"消费"   },
  { symbol:"COST",  yfTicker:"COST",  name:"Costco",            nameCN:"好市多",      type:"stock", currency:"USD", market:"US", basePrice:950,  sector:"Consumer",      sectorCN:"消费"   },
  { symbol:"DIS",   yfTicker:"DIS",   name:"Disney",            nameCN:"迪士尼",      type:"stock", currency:"USD", market:"US", basePrice:100,  sector:"Entertainment", sectorCN:"娱乐"   },
  { symbol:"BA",    yfTicker:"BA",    name:"Boeing",            nameCN:"波音",        type:"stock", currency:"USD", market:"US", basePrice:165,  sector:"Aerospace",     sectorCN:"航空"   },
  { symbol:"XOM",   yfTicker:"XOM",   name:"ExxonMobil",        nameCN:"埃克森美孚",  type:"stock", currency:"USD", market:"US", basePrice:110,  sector:"Energy",        sectorCN:"能源"   },
  { symbol:"RIVN",  yfTicker:"RIVN",  name:"Rivian",            nameCN:"Rivian",      type:"stock", currency:"USD", market:"US", basePrice:12,   sector:"Automotive",    sectorCN:"汽车"   },
  { symbol:"LCID",  yfTicker:"LCID",  name:"Lucid Motors",      nameCN:"Lucid汽车",   type:"stock", currency:"USD", market:"US", basePrice:2.5,  sector:"Automotive",    sectorCN:"汽车"   },

  // ── US — Chinese ADRs ─────────────────────────────────────────────────
  { symbol:"BABA",  yfTicker:"BABA",  name:"Alibaba",           nameCN:"阿里巴巴",    type:"stock", currency:"USD", market:"US", basePrice:100,  sector:"E-commerce",   sectorCN:"电商"   },
  { symbol:"PDD",   yfTicker:"PDD",   name:"Pinduoduo",         nameCN:"拼多多",      type:"stock", currency:"USD", market:"US", basePrice:130,  sector:"E-commerce",   sectorCN:"电商"   },
  { symbol:"JD",    yfTicker:"JD",    name:"JD.com",            nameCN:"京东",        type:"stock", currency:"USD", market:"US", basePrice:35,   sector:"E-commerce",   sectorCN:"电商"   },
  { symbol:"BIDU",  yfTicker:"BIDU",  name:"Baidu",             nameCN:"百度",        type:"stock", currency:"USD", market:"US", basePrice:90,   sector:"Technology",   sectorCN:"科技"   },
  { symbol:"NIO",   yfTicker:"NIO",   name:"NIO",               nameCN:"蔚来",        type:"stock", currency:"USD", market:"US", basePrice:4,    sector:"Automotive",   sectorCN:"汽车"   },
  { symbol:"XPEV",  yfTicker:"XPEV",  name:"XPeng",             nameCN:"小鹏汽车",    type:"stock", currency:"USD", market:"US", basePrice:15,   sector:"Automotive",   sectorCN:"汽车"   },
  { symbol:"LI",    yfTicker:"LI",    name:"Li Auto",           nameCN:"理想汽车",    type:"stock", currency:"USD", market:"US", basePrice:24,   sector:"Automotive",   sectorCN:"汽车"   },
  { symbol:"TCOM",  yfTicker:"TCOM",  name:"Trip.com",          nameCN:"携程",        type:"stock", currency:"USD", market:"US", basePrice:62,   sector:"Travel",       sectorCN:"旅游"   },
  { symbol:"EDU",   yfTicker:"EDU",   name:"New Oriental",      nameCN:"新东方",      type:"stock", currency:"USD", market:"US", basePrice:55,   sector:"Education",    sectorCN:"教育"   },
  { symbol:"TAL",   yfTicker:"TAL",   name:"TAL Education",     nameCN:"好未来",      type:"stock", currency:"USD", market:"US", basePrice:12,   sector:"Education",    sectorCN:"教育"   },
  { symbol:"VNET",  yfTicker:"VNET",  name:"VNET Group",        nameCN:"万网",        type:"stock", currency:"USD", market:"US", basePrice:5,    sector:"Technology",   sectorCN:"科技"   },

  // ── Hong Kong ─────────────────────────────────────────────────────────
  { symbol:"HK0700", yfTicker:"0700.HK", name:"Tencent",           nameCN:"腾讯控股",    type:"hk", currency:"HKD", market:"HK", basePrice:380,  sector:"Technology",   sectorCN:"科技"   },
  { symbol:"HK9988", yfTicker:"9988.HK", name:"Alibaba HK",        nameCN:"阿里巴巴-W",  type:"hk", currency:"HKD", market:"HK", basePrice:85,   sector:"E-commerce",   sectorCN:"电商"   },
  { symbol:"HK3690", yfTicker:"3690.HK", name:"Meituan",           nameCN:"美团-W",      type:"hk", currency:"HKD", market:"HK", basePrice:160,  sector:"Services",     sectorCN:"服务"   },
  { symbol:"HK1810", yfTicker:"1810.HK", name:"Xiaomi",            nameCN:"小米集团-W",  type:"hk", currency:"HKD", market:"HK", basePrice:38,   sector:"Technology",   sectorCN:"科技"   },
  { symbol:"HK0941", yfTicker:"0941.HK", name:"China Mobile",      nameCN:"中国移动",    type:"hk", currency:"HKD", market:"HK", basePrice:78,   sector:"Telecom",      sectorCN:"电信"   },
  { symbol:"HK2318", yfTicker:"2318.HK", name:"Ping An HK",        nameCN:"中国平安",    type:"hk", currency:"HKD", market:"HK", basePrice:38,   sector:"Financials",   sectorCN:"金融"   },
  { symbol:"HK0939", yfTicker:"0939.HK", name:"CCB",               nameCN:"建设银行",    type:"hk", currency:"HKD", market:"HK", basePrice:6.5,  sector:"Banking",      sectorCN:"银行"   },
  { symbol:"HK1398", yfTicker:"1398.HK", name:"ICBC HK",           nameCN:"工商银行",    type:"hk", currency:"HKD", market:"HK", basePrice:4.5,  sector:"Banking",      sectorCN:"银行"   },
  { symbol:"HK0005", yfTicker:"0005.HK", name:"HSBC Holdings",     nameCN:"汇丰控股",    type:"hk", currency:"HKD", market:"HK", basePrice:72,   sector:"Banking",      sectorCN:"银行"   },
  { symbol:"HK0388", yfTicker:"0388.HK", name:"HKEX",              nameCN:"香港交易所",  type:"hk", currency:"HKD", market:"HK", basePrice:280,  sector:"Financials",   sectorCN:"金融"   },
  { symbol:"HK2020", yfTicker:"2020.HK", name:"ANTA Sports",       nameCN:"安踏体育",    type:"hk", currency:"HKD", market:"HK", basePrice:88,   sector:"Consumer",     sectorCN:"消费"   },
  { symbol:"HK1024", yfTicker:"1024.HK", name:"Kuaishou",          nameCN:"快手-W",      type:"hk", currency:"HKD", market:"HK", basePrice:45,   sector:"Technology",   sectorCN:"科技"   },
  { symbol:"HK9618", yfTicker:"9618.HK", name:"JD HK",             nameCN:"京东集团-SW", type:"hk", currency:"HKD", market:"HK", basePrice:140,  sector:"E-commerce",   sectorCN:"电商"   },
  { symbol:"HK1211", yfTicker:"1211.HK", name:"BYD HK",            nameCN:"比亚迪股份",  type:"hk", currency:"HKD", market:"HK", basePrice:27,   sector:"Automotive",   sectorCN:"汽车"   },
  { symbol:"HK2015", yfTicker:"2015.HK", name:"Li Auto HK",        nameCN:"理想汽车-W",  type:"hk", currency:"HKD", market:"HK", basePrice:90,   sector:"Automotive",   sectorCN:"汽车"   },
  { symbol:"HK9866", yfTicker:"9866.HK", name:"NIO HK",            nameCN:"蔚来-SW",     type:"hk", currency:"HKD", market:"HK", basePrice:35,   sector:"Automotive",   sectorCN:"汽车"   },
  { symbol:"HK9868", yfTicker:"9868.HK", name:"XPeng HK",          nameCN:"小鹏汽车-W",  type:"hk", currency:"HKD", market:"HK", basePrice:70,   sector:"Automotive",   sectorCN:"汽车"   },
  { symbol:"HK0175", yfTicker:"0175.HK", name:"Geely Auto",        nameCN:"吉利汽车",    type:"hk", currency:"HKD", market:"HK", basePrice:9,    sector:"Automotive",   sectorCN:"汽车"   },
  { symbol:"HK0002", yfTicker:"0002.HK", name:"CLP Holdings",      nameCN:"中电控股",    type:"hk", currency:"HKD", market:"HK", basePrice:55,   sector:"Utilities",    sectorCN:"公用事业"},
  { symbol:"HK6690", yfTicker:"6690.HK", name:"Haier Smart Home",  nameCN:"海尔智家",    type:"hk", currency:"HKD", market:"HK", basePrice:22,   sector:"Consumer",     sectorCN:"消费"   },

  // ── A-shares (Shanghai .SS / Shenzhen .SZ) ───────────────────────────
  { symbol:"CNMTAI",  yfTicker:"600519.SS", name:"Kweichow Moutai", nameCN:"贵州茅台",    type:"cn", currency:"CNY", market:"CN", basePrice:1750, sector:"Consumer",     sectorCN:"消费"   },
  { symbol:"CNCATL",  yfTicker:"300750.SZ", name:"CATL",            nameCN:"宁德时代",    type:"cn", currency:"CNY", market:"CN", basePrice:250,  sector:"New Energy",   sectorCN:"新能源" },
  { symbol:"CNBYD",   yfTicker:"002594.SZ", name:"BYD A",           nameCN:"比亚迪",      type:"cn", currency:"CNY", market:"CN", basePrice:290,  sector:"Automotive",   sectorCN:"汽车"   },
  { symbol:"CNPING",  yfTicker:"601318.SS", name:"Ping An",         nameCN:"中国平安",    type:"cn", currency:"CNY", market:"CN", basePrice:45,   sector:"Financials",   sectorCN:"金融"   },
  { symbol:"CNICBC",  yfTicker:"601398.SS", name:"ICBC",            nameCN:"工商银行",    type:"cn", currency:"CNY", market:"CN", basePrice:6.5,  sector:"Banking",      sectorCN:"银行"   },
  { symbol:"CNBOC",   yfTicker:"601988.SS", name:"Bank of China",   nameCN:"中国银行",    type:"cn", currency:"CNY", market:"CN", basePrice:5.5,  sector:"Banking",      sectorCN:"银行"   },
  { symbol:"CNAGRI",  yfTicker:"601288.SS", name:"Agricultural Bank",nameCN:"农业银行",   type:"cn", currency:"CNY", market:"CN", basePrice:4.5,  sector:"Banking",      sectorCN:"银行"   },
  { symbol:"CNCMB",   yfTicker:"600036.SS", name:"China Merchants Bank",nameCN:"招商银行",type:"cn", currency:"CNY", market:"CN", basePrice:38,   sector:"Banking",      sectorCN:"银行"   },
  { symbol:"CNWLY",   yfTicker:"000858.SZ", name:"Wuliangye",       nameCN:"五粮液",      type:"cn", currency:"CNY", market:"CN", basePrice:130,  sector:"Consumer",     sectorCN:"消费"   },
  { symbol:"CNYILI",  yfTicker:"600887.SS", name:"Yili Group",      nameCN:"伊利股份",    type:"cn", currency:"CNY", market:"CN", basePrice:25,   sector:"Consumer",     sectorCN:"消费"   },
  { symbol:"CNMIDEA", yfTicker:"000333.SZ", name:"Midea Group",     nameCN:"美的集团",    type:"cn", currency:"CNY", market:"CN", basePrice:60,   sector:"Consumer",     sectorCN:"消费"   },
  { symbol:"CNGREE",  yfTicker:"000651.SZ", name:"Gree Electric",   nameCN:"格力电器",    type:"cn", currency:"CNY", market:"CN", basePrice:35,   sector:"Consumer",     sectorCN:"消费"   },
  { symbol:"CNLONGI", yfTicker:"601012.SS", name:"LONGi Green Energy",nameCN:"隆基绿能",  type:"cn", currency:"CNY", market:"CN", basePrice:16,   sector:"New Energy",   sectorCN:"新能源" },
  { symbol:"CNLXJM",  yfTicker:"002475.SZ", name:"LUXSHARE",        nameCN:"立讯精密",    type:"cn", currency:"CNY", market:"CN", basePrice:28,   sector:"Technology",   sectorCN:"科技"   },
  { symbol:"CNSFY",   yfTicker:"002352.SZ", name:"S.F. Holding",    nameCN:"顺丰控股",    type:"cn", currency:"CNY", market:"CN", basePrice:38,   sector:"Logistics",    sectorCN:"物流"   },
  { symbol:"CNCITM",  yfTicker:"601888.SS", name:"CITS",            nameCN:"中国中免",    type:"cn", currency:"CNY", market:"CN", basePrice:65,   sector:"Retail",       sectorCN:"零售"   },
  { symbol:"CNSANY",  yfTicker:"600031.SS", name:"SANY Heavy",      nameCN:"三一重工",    type:"cn", currency:"CNY", market:"CN", basePrice:14,   sector:"Industrials",  sectorCN:"工业"   },
  { symbol:"CNHRMJ",  yfTicker:"600276.SS", name:"Hengrui Medicine",nameCN:"恒瑞医药",    type:"cn", currency:"CNY", market:"CN", basePrice:35,   sector:"Healthcare",   sectorCN:"医药"   },
  { symbol:"CNAIER",  yfTicker:"300015.SZ", name:"AIER Eye",        nameCN:"爱尔眼科",    type:"cn", currency:"CNY", market:"CN", basePrice:12,   sector:"Healthcare",   sectorCN:"医药"   },
  { symbol:"CNYZLY",  yfTicker:"600900.SS", name:"Yangtze Power",   nameCN:"长江电力",    type:"cn", currency:"CNY", market:"CN", basePrice:24,   sector:"Utilities",    sectorCN:"公用事业"},
  { symbol:"CNWHCH",  yfTicker:"600309.SS", name:"Wanhua Chemical", nameCN:"万华化学",    type:"cn", currency:"CNY", market:"CN", basePrice:80,   sector:"Materials",    sectorCN:"化工"   },
  { symbol:"CNZGLT",  yfTicker:"601601.SS", name:"China Pacific Insurance",nameCN:"中国太保",type:"cn",currency:"CNY",market:"CN", basePrice:30,  sector:"Financials",   sectorCN:"金融"   },
  { symbol:"CNZGRX",  yfTicker:"601628.SS", name:"China Life",      nameCN:"中国人寿",    type:"cn", currency:"CNY", market:"CN", basePrice:20,   sector:"Financials",   sectorCN:"金融"   },
  { symbol:"CNMYFC",  yfTicker:"002714.SZ", name:"Muyuan Foods",    nameCN:"牧原股份",    type:"cn", currency:"CNY", market:"CN", basePrice:42,   sector:"Agriculture",  sectorCN:"农业"   },
];

// ── Lookup helpers ─────────────────────────────────────────────────────────

const _bySymbol = new Map(ASSET_CATALOG.map((a) => [a.symbol, a]));
const _byYfTicker = new Map(ASSET_CATALOG.map((a) => [a.yfTicker, a]));

export function getAsset(symbol: string): AssetEntry | undefined {
  return _bySymbol.get(symbol);
}

export function getAssetByYfTicker(yfTicker: string): AssetEntry | undefined {
  return _byYfTicker.get(yfTicker);
}

/** Full YF_TICKER map — used by server-side market-data routes */
export const CATALOG_YF_TICKER: Record<string, string> = Object.fromEntries(
  ASSET_CATALOG.map((a) => [a.symbol, a.yfTicker])
);

/** Symbols that use Binance (all XXXUSDT crypto) */
export const BINANCE_SYMBOLS = new Set(
  ASSET_CATALOG.filter((a) => a.type === "crypto").map((a) => a.symbol)
);

/** Forex symbols — routed via Yahoo Finance =X tickers */
export const FOREX_SYMBOLS = new Set(
  ASSET_CATALOG.filter((a) => a.type === "forex").map((a) => a.symbol)
);

// ── Client-side fuzzy search ───────────────────────────────────────────────

/**
 * Search the catalog by any combination of:
 *   - English name (partial, case-insensitive)
 *   - Chinese name (partial)
 *   - Internal symbol (partial, case-insensitive)
 *   - Yahoo Finance ticker (partial, case-insensitive)
 *
 * Returns up to `limit` results ranked by match quality.
 */
export function searchAssets(query: string, limit = 20): AssetEntry[] {
  const q = query.trim();
  if (!q) return [];

  const ql  = q.toLowerCase();
  const scored: { asset: AssetEntry; score: number }[] = [];

  for (const asset of ASSET_CATALOG) {
    let score = 0;
    const symL    = asset.symbol.toLowerCase();
    const yfL     = asset.yfTicker.toLowerCase();
    const nameL   = asset.name.toLowerCase();
    const nameCN  = asset.nameCN;

    // Exact ticker match → highest priority
    if (symL === ql || yfL === ql) { score = 100; }
    // Starts-with ticker
    else if (symL.startsWith(ql) || yfL.startsWith(ql)) { score = 80; }
    // Exact name match
    else if (nameL === ql || nameCN === q) { score = 70; }
    // Starts-with name
    else if (nameL.startsWith(ql) || nameCN.startsWith(q)) { score = 60; }
    // Contains in name/ticker
    else if (nameL.includes(ql) || symL.includes(ql) || yfL.includes(ql)) { score = 40; }
    // Contains in Chinese name
    else if (nameCN.includes(q)) { score = 35; }
    // Sector match
    else if (asset.sectorCN?.includes(q) || asset.sector?.toLowerCase().includes(ql)) { score = 20; }

    if (score > 0) scored.push({ asset, score });
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.asset);
}
