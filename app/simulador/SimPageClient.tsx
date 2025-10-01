"use client";

import { useState, useEffect } from "react";
import TradingViewWidget from "@/components/TradingViewWidget";
import TradeControls from "@/components/TradeControls";

export default function SimPageClient() {
  const [pair, setPair] = useState("BTCUSDT");
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
  }, []);

  const toggleFs = () => setIsFs((v) => !v);

  return (
    <div className="relative flex h-[calc(100vh-64px)] w-full bg-black">
      {/* Gráfico TradingView */}
      <div className="flex-1 relative">
        <TradingViewWidget pair={pair} isFullscreen={isFs} />

        {/* Botão Tela Cheia — TOPO DIREITO */}
        {!isFs && (
          <button
            aria-label="Tela cheia"
            title="Tela cheia"
            onClick={toggleFs}
            style={{
              position: "absolute",
              top: 8,
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
              lineHeight: 1,
              fontWeight: 900,
              fontSize: 14,
            }}
          >
            [ ]
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
        </div>
      )}
    </div>
  );
}
