// app/simulador/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import TradingViewWidget from "@/components/TradingViewWidget";
import TradeControls from "@/components/TradeControls";
import Link from "next/link";

export default function SimuladorPage() {
  // estado compartilhado do par (sincroniza controles <-> gráfico)
  const [symbol, setSymbol] = useState<string>("BTCUSDT");

  // fullscreen apenas da área do gráfico
  const graphRef = useRef<HTMLDivElement>(null);
  const [isFs, setIsFs] = useState(false);

  const enterFs = () => {
    if (graphRef.current && graphRef.current.requestFullscreen) {
      graphRef.current.requestFullscreen();
    }
  };
  const exitFs = () => {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

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
      {/* COLUNA ESQUERDA: gráfico ocupa toda a área útil */}
      <section
        className="panel"
        style={{ height: "calc(100dvh - 32px)", padding: 0 }} // remove padding interno
      >
        <div
          ref={graphRef}
          style={{ position: "relative", width: "100%", height: "100%" }}
        >
          {/* Botão de fullscreen (apenas ícone) */}
          <button
            aria-label={isFs ? "Sair de tela cheia (X/Esc)" : "Entrar em tela cheia (F)"}
            className="fsBtn"
            onClick={() => (isFs ? exitFs() : enterFs())}
            title={isFs ? "Sair (X/Esc)" : "Tela cheia (F)"}
          >
            {/* Ícone minimalista */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              {isFs ? (
                // ícone 'X'
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              ) : (
                // setinhas para fora
                <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              )}
            </svg>
          </button>

          {/* Gráfico TradingView sincronizado com o par */}
          <TradingViewWidget symbol={`BINANCE:${symbol}`} />
        </div>
      </section>

      {/* COLUNA DIREITA: Controles de Trade (compacto) */}
      <aside className="panel" style={{ height: "calc(100dvh - 32px)" }}>
        <TradeControls
          symbol={symbol}
          onSymbolChange={setSymbol}
        />
        <div style={{ marginTop: 16 }}>
          <Link href="/" className="btn btn-primary">Voltar ao início</Link>
        </div>
      </aside>
    </main>
  );
}
