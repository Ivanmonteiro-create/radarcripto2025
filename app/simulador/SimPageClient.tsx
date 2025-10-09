'use client';

import { useState, useEffect } from "react";
import TradingViewWidget from "@/components/TradingViewWidget";
import TradeControls from "@/components/TradeControls";
import { useEffect, useRef, useState } from 'react';
import TradingViewWidget from '../../components/TradingViewWidget';
import TradeControls from '../../components/TradeControls';
import { useLivePrice } from '../../lib/priceFeed';

type Pair =
  | 'BTCUSDT' | 'ETHUSDT' | 'BNBUSDT' | 'SOLUSDT'
  | 'ADAUSDT' | 'XRPUSDT' | 'DOGEUSDT' | 'LINKUSDT';

export default function SimPageClient() {
  const [pair, setPair] = useState("BTCUSDT");
  const [symbol, setSymbol] = useState<Pair>('BTCUSDT');
  const livePrice = useLivePrice(symbol);

  const chartPanelRef = useRef<HTMLDivElement | null>(null);
  const [isFs, setIsFs] = useState(false);

  // Atalho para tela cheia (F para entrar, Esc para sair)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") {
        setIsFs(true);
      }
      if (e.key === "Escape") {
        setIsFs(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    const onChange = () => setIsFs(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFs = () => setIsFs((v) => !v);
  const enterFs = () => {
    const el = chartPanelRef.current;
    if (!el || document.fullscreenElement) return;
    void el.requestFullscreen();
  };
  const exitFs = () => { if (document.fullscreenElement) void document.exitFullscreen(); };
  const toggleFs = () => (document.fullscreenElement ? exitFs() : enterFs());

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'f') { e.preventDefault(); enterFs(); }
      if (k === 'x') { e.preventDefault(); exitFs(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="relative flex h-[calc(100vh-64px)] w-full bg-black">
      {/* Gráfico TradingView */}
      <div className="flex-1 relative">
        <TradingViewWidget pair={pair} isFullscreen={isFs} />
    <main
      /* Full-bleed: sem padding, sem gap, altura total */
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 380px',
        gap: 0,
        padding: 0,
        height: '100dvh',
        alignItems: 'stretch',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Voltar ao início — canto direito superior */}
      {!isFs && (
        <a
          href="/"
          className="btn tcBackBtn"
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 50,
            padding: '10px 14px',
            borderRadius: 12,
            fontWeight: 800,
          }}
        >
          Voltar ao início
        </a>
      )}

      {/* Gráfico (painel colado às bordas) */}
      <section
        ref={chartPanelRef}
        className="panel"
        style={{
          position: 'relative',
          minHeight: '100%',
          height: '100%',
          borderRadius: 0,
          borderRight: '1px solid rgba(255,255,255,.06)',
        }}
      >
        {!isFs && (
          <div className="compactHeader" style={{ marginBottom: 8 }}>
            <h2 className="compactTitle" style={{ margin: 0 }}>
              Gráfico — {symbol}
            </h2>
          </div>
        )}

        {/* Botão Tela Cheia — TOPO DIREITO */}
        {/* Botão Tela Cheia — TOPO DIREITO (ajuste principal) */}
        {!isFs && (
          <button
            aria-label="Tela cheia"
            title="Tela cheia"
            onClick={toggleFs}
            style={{
              position: "absolute",
              top: 8,
              position: 'absolute',
              top: 8,         // <-- antes estava bottom: 86
              right: 8,
              zIndex: 40,
              width: 28,
              height: 28,
              borderRadius: 8,
              display: "grid",
              placeItems: "center",
              background: "rgba(255,255,255,.12)",
              color: "#e6e6e6",
              border: "1px solid rgba(255,255,255,.25)",
              cursor: "pointer",
              display: 'grid',
              placeItems: 'center',
              background: 'rgba(255,255,255,.12)',
              color: '#e6e6e6',
              border: '1px solid rgba(255,255,255,.25)',
              cursor: 'pointer',
              lineHeight: 1,
              fontWeight: 900,
              fontSize: 14,
@@ -59,42 +122,31 @@ export default function SimPageClient() {
          </button>
        )}

        {/* Botão Fechar no modo fullscreen */}
        {isFs && (
          <button
            aria-label="Sair tela cheia"
            title="Sair tela cheia"
            onClick={toggleFs}
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              zIndex: 50,
              width: 28,
              height: 28,
              borderRadius: 8,
              display: "grid",
              placeItems: "center",
              background: "rgba(255,0,0,.3)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,.5)",
              cursor: "pointer",
              lineHeight: 1,
              fontWeight: 900,
              fontSize: 14,
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Painel de Controles */}
      {!isFs && (
        <div className="w-80 border-l border-gray-800 bg-[#0d1311]">
          <TradeControls pair={pair} onPairChange={setPair} />
        <div style={{ height: 'calc(100% - 0px)', minHeight: 520 }}>
          {/* Usa a sua API original: prop "symbol" com o prefixo da corretora */}
          <TradingViewWidget symbol={`BINANCE:${symbol}`} />
        </div>
      )}
    </div>
      </section>

      {/* Controles */}
      <section
        className="panel compactPanel"
        style={{
          display: 'grid',
          alignContent: 'start',
          gap: 10,
          minHeight: '100%',
          height: '100%',
          borderRadius: 0,
          borderLeft: '1px solid rgba(255,255,255,.06)',
        }}
      >
        <TradeControls
          symbol={symbol}
          onSymbolChange={(s: string) => setSymbol(s as Pair)}
          livePrice={livePrice}
        />
      </section>
    </main>
  );
}
