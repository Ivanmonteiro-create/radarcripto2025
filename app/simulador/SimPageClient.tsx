"use client";

import { useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";

// IMPORT CORRETO do seu widget existente
const TradingViewWidget = dynamic(
  () => import("@/components/TradingViewWidget"),
  { ssr: false }
);

// Seus controles (mantém como já existe no projeto)
import TradeControls from "@/components/TradeControls";

type Props = {
  // mantido vazio para uso futuro se necessário
};

export default function SimPageClient(_: Props) {
  // Símbolo padrão — o TradeControls pode alterar isso
  const [symbol, setSymbol] = useState<string>("BTCUSDT");

  // Ref do contêiner do gráfico para o modo tela cheia
  const chartWrapRef = useRef<HTMLDivElement | null>(null);

  const goFullscreen = useCallback(() => {
    const el = chartWrapRef.current;
    if (!el) return;
    const anyEl = el as any;
    (el.requestFullscreen ||
      anyEl.webkitRequestFullscreen ||
      anyEl.mozRequestFullScreen ||
      anyEl.msRequestFullscreen)?.call(el);
  }, []);

  return (
    <main
      className="wrapper"
      style={{
        // grid 2:1 — gráfico grande como antes
        gridTemplateColumns: "minmax(600px, 2fr) minmax(360px, 1fr)",
        alignItems: "stretch",
      }}
    >
      {/* COLUNA ESQUERDA — GRÁFICO */}
      <section className="panel" style={{ padding: 12, display: "grid", gridTemplateRows: "auto 1fr" }}>
        {/* Cabeçalho do painel com botão Tela Cheia */}
        <div
          className="tcHeader"
          style={{
            marginBottom: 8,
          }}
        >
          <h2 className="tcTitle">Gráfico — {symbol}</h2>

          <div className="tcHeaderActions">
            {/* Botão Tela Cheia (ativo) */}
            <button
              type="button"
              title="Tela cheia"
              aria-label="Tela cheia"
              className="chartFsBtn--header"
              onClick={goFullscreen}
            >
              ⤢
            </button>
          </div>
        </div>

        {/* Área do gráfico (vira fullscreen) */}
        <div
          ref={chartWrapRef}
          style={{
            position: "relative",
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,.08)",
          }}
        >
          <TradingViewWidget symbol={symbol} />
        </div>
      </section>

      {/* COLUNA DIREITA — CONTROLES */}
      <section className="panel compactPanel tradePanelShell">
        <div className="tcHeader" style={{ marginBottom: 10 }}>
          <h2 className="tcTitle">Controles de Trade</h2>
          {/* “Voltar ao início” segue estilos globais verdes */}
          <a href="/" className="btn tcBackBtn">Voltar ao início</a>
        </div>

        <div className="compactGrid">
          {/* O seu componente já exibe preço, equity, etc.
              e aceita troca de símbolo. Mantemos o contrato: */}
          <TradeControls
            symbol={symbol}
            onSymbolChange={(s: string) => setSymbol(s)}
          />
        </div>
      </section>
    </main>
  );
}
