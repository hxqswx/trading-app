import { PortfolioSummaryCards } from "@/components/portfolio/portfolio-summary";
import { PositionsTable } from "@/components/portfolio/positions-table";
import { Watchlist } from "@/components/watchlist/watchlist";

export default function DashboardPage() {
  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex-1 flex flex-col gap-6 p-6 min-w-0">
        <div>
          <h1 className="text-xl font-bold">Dashboard</h1>
          <p className="text-sm text-[var(--muted)] mt-0.5">Portfolio overview &amp; market summary</p>
        </div>

        <PortfolioSummaryCards />
        <PositionsTable />
      </div>

      {/* Watchlist sidebar */}
      <aside className="w-72 border-l border-[var(--border)] flex flex-col h-full overflow-hidden">
        <Watchlist />
      </aside>
    </div>
  );
}
