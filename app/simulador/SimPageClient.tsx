// app/simulador/SimPageClient.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import TradingViewWidget from "@/components/TradingViewWidget";
import TradeControls from "@/components/TradeControls";
import Link from "next/link";

/** websocket leve para preço ao vivo da Binance */
function useBinanceLastPrice(symbol: string) {
  const [price, setPrice] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    try { wsRef.current?.close(); } catch {}
    const stream = `${symbol.toLowerCase()}@ticker`;
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${stream}`);
    wsRef.current = ws;
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data?.c) setPrice(parseFloat(data.c)); // last price
      } catch {}
    };
    ws.onerror = () => {/* silencioso */};
    return () => { try { ws.close(); } catch {} };
  }, [symbol]);

  return price;
}

type Props = { initialSymbol?: string };

export default function SimPageClient({ initialSymbol = "BTCUSDT" }: Props) {
  const [symbol, setSymbol] = useState(initialSymbol);
  const livePrice = useBinanceLastPrice(symbol);

  return (
    <main
      className="wrapper"
      style={{
        gridTemplateColumns: "1fr 340px",
        gap: 16,
      }}
    >
      {/* GRÁFICO — ocupa bem a tela */}
      <section className="panel" style={{ minHeight: "calc(100dvh - 32px)", position: "relative" }}>
        {/* Botão de tela cheia (ícone de “quatro cantos”) */}
        <button
          className="chartFsBtn chartFsBtn--header"
          title="Tela cheia"
          aria-label="Tela cheia"
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 5,
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "rgba(255,255,255,.08)",
            border: "1px solid rgba(255,255,255,.18)",
            color: "#e6e6e6",
            display: "grid",
            placeItems: "center",
            lineHeight: 1,
          }}
          onClick={() => {
            const el = document.fullscreenElement ? document.exitFullscreen() : (document.documentElement.requestFullscreen?.());
            return el;
          }}
        >
          {/* SVG “colchetes” (quatro cantos) */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div style={{ position: "absolute", left: 14, top: 10, zIndex: 4, fontWeight: 900, opacity: .85 }}>
          Gráfico — {symbol}
        </div>

        <div style={{ position: "relative", height: "100%" }}>
          <TradingViewWidget symbol={symbol} interval="1" theme="dark" autosize />
        </div>
      </section>

      {/* CONTROLES — 340px, sem duplicar back button */}
      <aside className="panel compactPanel compactRoot" style={{ position: "relative" }}>
        <header className="compactHeader tcHeader" style={{ marginBottom: 8 }}>
          <h2 className="compactTitle tcTitle">Controles de Trade</h2>
          <div className="tcHeaderActions">
            <Link href="/" className="btn tcBackBtn">Voltar ao início</Link>
          </div>
        </header>

        {/* 
          Passamos:
          - symbol: string
          - onSymbolChange: (s:string) => void
          - livePrice: number | null  (opcional — seu componente usa se existir)
        */}
        <TradeControls symbol={symbol} onSymbolChange={setSymbol} livePrice={livePrice ?? undefined} />
      </aside>
    </main>
  );
}
