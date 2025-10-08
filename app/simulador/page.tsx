"use client";

import Link from "next/link";
import TradingViewWidget from "@/components/TradingViewWidget";
import TradeControls from "@/components/TradeControls";

export default function SimuladorPage() {
  return (
    <div className="rc-sim flex flex-col min-h-screen bg-black text-white">
      <div className="rc-sim__grid grid grid-cols-12 gap-4 w-full h-full">
        {/* === GRÁFICO === */}
        <div className="col-span-9 flex items-stretch justify-center bg-transparent">
          <TradingViewWidget symbol="BTCUSDT" />
        </div>

        {/* === PAINEL DE CONTROLES === */}
        <aside className="rc-sim__panel col-span-3 flex flex-col justify-start bg-[#0d0d0d]/80 rounded-2xl p-4 border border-green-700 shadow-lg">
          <header className="rc-sim__panelHead flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-green-400">
              Controles de Trade
            </h2>
            <Link
              href="/"
              className="rc-btn rc-btn--green bg-green-600 text-black px-3 py-1 rounded-lg hover:bg-green-500 transition"
            >
              Voltar ao início
            </Link>
          </header>

          <TradeControls />
        </aside>
      </div>
    </div>
  );
}
