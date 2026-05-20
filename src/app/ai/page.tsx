"use client";

import { AITerminal } from "@/components/ai-terminal/ai-terminal";
import { useT } from "@/lib/hooks/use-t";
import { useTradingStore, DEFAULT_WATCHLIST } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Brain } from "lucide-react";

/** Compact watchlist sidebar used by the AI page */
function AssetPicker() {
  const { activeSymbol, setActiveSymbol, quotes } = useTradingStore();

  return (
    <div className="w-40 border-r border-[#30363d] bg-[#161b22] flex flex-col shrink-0 overflow-hidden hidden md:flex">
      <div className="px-3 py-2 border-b border-[#30363d]">
        <span className="font-mono text-[9px] text-[#8b949e] tracking-widest uppercase">Assets</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {DEFAULT_WATCHLIST.map((item) => {
          const q       = quotes[item.symbol];
          const active  = activeSymbol === item.symbol;
          const up      = (q?.changePct ?? 0) >= 0;
          return (
            <button
              key={item.symbol}
              onClick={() => setActiveSymbol(item.symbol)}
              className={cn(
                "w-full text-left px-3 py-2 border-b border-[#0d1117] font-mono text-[11px]",
                "hover:bg-[#21262d] transition-colors",
                active && "bg-[#1f6feb20] border-l-2 border-l-[#58a6ff]"
              )}
            >
              <div className={cn("font-bold text-[10px]", active ? "text-[#58a6ff]" : "text-[#e6edf3]")}>
                {item.symbol}
              </div>
              {q && (
                <div className={cn("text-[9px]", up ? "text-[#3fb950]" : "text-[#f85149]")}>
                  {up ? "+" : ""}{q.changePct.toFixed(2)}%
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function AIPage() {
  const t = useT();

  return (
    <div className="flex flex-col h-screen bg-[#0d1117] overflow-hidden">
      {/* Page header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-[#30363d] bg-[#161b22] shrink-0">
        <div className="w-7 h-7 rounded bg-gradient-to-br from-[#1f6feb] to-[#6366f1] flex items-center justify-center">
          <Brain size={14} className="text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-[#e6edf3]">{t.aiTerminal.title}</h1>
          <p className="text-[10px] text-[#8b949e] font-mono">{t.aiTerminal.subtitle}</p>
        </div>
      </div>

      {/* Body: asset picker + terminal */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <AssetPicker />
        <div className="flex-1 min-h-0 min-w-0">
          <AITerminal />
        </div>
      </div>
    </div>
  );
}
