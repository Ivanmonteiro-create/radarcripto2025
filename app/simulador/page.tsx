"use client";

import { useEffect, useRef, useState } from "react";
import TradingViewWidget from "@/components/TradingViewWidget";
import TradeControls from "@/components/TradeControls";

export default function SimuladorPage() {
  const [symbol, setSymbol] = useState<string>("BTCUSDT");

  // fullscreen do gráfico
  const graphRef = useRef<HTMLDivElement>(null);
  const [isFs, setIsFs] = useState(false);
  const enterFs = () => graphRef.current?.requestFullscreen?.();
  const exitFs  = () => document.fullscreenElement && document.exitFullscreen?.();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "f") enterFs();
      if (e.key.toLowerCase() === "x" || e.key === "Escape") exitFs();
    };
    const onFsChange = () => setIsFs(Boolean(document.fullscreenElement));
    document.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFsChange);
    };
  }, []);

  return (
    <main className="wrapper" style={{ gridTemplateColumns: "1fr 360px" }}>
      {/* GRÁFICO */}
      <section className="panel" style={{ height: "calc(100dvh - 32px)", padding: 0 }}>
        <div ref={graphRef} style={{ position: "relative", width: "100%", height: "100%" }}>
          {/* Ícone de tela cheia ao lado da câmera */}
          <button
            className="chartFsBtn"
            title={isFs ? "Sair de tela cheia (X/Esc)" : "Tela cheia (F)"}
            aria-label={isFs ? "Sair de tela cheia" : "Entrar em tela cheia"}
            onClick={() => (isFs ? exitFs() : enterFs())}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              {isFs ? (
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              ) : (
                <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              )}
            </svg>
          </button>

          <TradingViewWidget symbol={`BINANCE:${symbol}`} />
        </div>
      </section>

      {/* CONTROLES */}
      <aside className="panel" style={{ height: "calc(100dvh - 32px)" }}>
        <TradeControls
          symbol={symbol}
          onSymbolChange={setSymbol}
          /* <- removido: isFullscreen */
        />
      </aside>
    </main>
  );
}
