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
      {/* GRÁFICO (ocupa todos os cantos) */}
      <section className="panel" style={{ height: "calc(100dvh - 32px)", padding: 0 }}>
        <div ref={graphRef} style={{ position: "relative", width: "100%", height: "100%" }}>
          {/* Botão flutuante "Voltar ao início" – abaixo da barra do TV (após 'Indicadores') */}
          <Link href="/" className="btn btn-primary topGraphBtn" title="Voltar ao início">
            Início
          </Link>

          {/* TradingView sincronizado com o par */}
          <TradingViewWidget symbol={`BINANCE:${symbol}`} />
        </div>
      </section>

      {/* CONTROLES (ícone de FS na mesma linha do título) */}
      <aside className="panel" style={{ height: "calc(100dvh - 32px)" }}>
        <TradeControls
          symbol={symbol}
          onSymbolChange={setSymbol}
          isFullscreen={isFs}
          onEnterFullscreen={enterFs}
          onExitFullscreen={exitFs}
        />
      </aside>
    </main>
  );
}
