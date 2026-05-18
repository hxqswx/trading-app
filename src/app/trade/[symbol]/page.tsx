import { TradeView } from "./trade-view";

// Next.js 16: params is a Promise — must be awaited
export default async function TradePage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  const decoded = decodeURIComponent(symbol).toUpperCase();
  return <TradeView symbol={decoded} />;
}
