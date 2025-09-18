"use client";

import { useEffect, useRef, useState } from "react";
import TradingViewWidget from "@/components/TradingViewWidget";
import TradeControls from "@/components/TradeControls";
import Link from "next/link";

export default function SimuladorPage() {
  const [symbol, setSymbol] = useState<string>("BTCUSDT");

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
      {/* Gráfico */}
      <section className="panel" style={{ height: "calc(100dvh - 32px)", padding: 0 }}>
        <div ref={graphRef} style={{ position: "relative", width: "100%", height: "100%" }}>
          {/* Botão fixo no topo, ao lado da câmera/antes de 'Indicadores' */}
          <div className="chartTopButtons">
            <Link href="/" className="btn btn-primary">Voltar ao início</Link>
          </div>
          <TradingViewWidget symbol={`BINANCE:${symbol}`} />
        </div>
      </section>

      {/* Controles */}
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
