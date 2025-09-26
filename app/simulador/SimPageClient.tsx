"use client";

import { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import TradeControls from "@/components/TradeControls";

/**
 * ATENÇÃO:
 * Este componente presume que você já tem o widget do TradingView
 * como um componente reutilizável. Mantive o nome abaixo igual ao
 * que você vinha usando; ajuste se seu arquivo tiver outro nome.
 */
const TradingViewEmbedWidget = dynamic(
  () => import("@/components/TradingViewEmbedWidget"),
  { ssr: false }
);

export default function SimPageClient() {
  // símbolo atual (mantém o padrão que você já usa, ex.: "BTCUSDT")
  const [symbol, setSymbol] = useState("BTCUSDT");

  // --- Tela cheia ---
  const chartWrapRef = useRef<HTMLDivElement | null>(null);
  const [isFull, setIsFull] = useState(false);

  // trava scroll de fundo quando em tela cheia (evita page “mexer”)
  useEffect(() => {
    if (isFull) {
      const prev = document.documentElement.style.overflow;
      document.documentElement.style.overflow = "hidden";
      return () => {
        document.documentElement.style.overflow = prev;
      };
    }
  }, [isFull]);

  const toggleFullscreen = () => setIsFull(v => !v);

  return (
    <main className="wrapper" style={{ alignItems: "stretch", gap: 16 }}>
      {/* COLUNA ESQUERDA: gráfico ocupa 2/3 em desktop */}
      <section
        className={`panel`}
        style={{
          gridColumn: "1 / span 2",
          display: "grid",
          gridTemplateRows: "auto 1fr",
          position: "relative",
        }}
      >
        {/* WRAPPER do gráfico — é ele que entra/saí de FS */}
        <div
          ref={chartWrapRef}
          className={isFull ? "chartFS" : ""}
          style={{
            position: "relative",
            height: isFull ? "100dvh" : "72vh",
            borderRadius: isFull ? 0 : 12,
            overflow: "hidden",
          }}
        >
          {/* Botão Tela Cheia (usa as regras que já estão no globals.css) */}
          <button
            type="button"
            aria-label="Tela cheia"
            className="chartFsBtn"
            onClick={toggleFullscreen}
            title={isFull ? "Sair da tela cheia" : "Tela cheia"}
          >
            {isFull ? "⤢" : "⤢"}
          </button>

          {/* TradingView — exatamente como já estava, só pegando o símbolo do estado */}
          <TradingViewEmbedWidget
            symbol={symbol}
            // passe outros props que você já usa (interval, theme etc.)
          />
        </div>
      </section>

      {/* COLUNA DIREITA: controles compactos */}
      <section className="panel compactPanel tradePanelShell">
        <div className="compactRoot">
          {/* Título/ações no topo (mantém seu “Voltar ao início” vindo de dentro do TradeControls) */}
          {/* ATENÇÃO: o TradeControls já renderiza o cabeçalho/botões; não duplicamos aqui */}
          <TradeControls
            // PROPS EXISTENTES no seu componente (mantidos)
            symbol={symbol}
            onSymbolChange={setSymbol} // habilita o selector/pares rápidos sem quebrar o TV
            mode="spot"               // mantém SPOT para o plano Starter
            compact                    // se o componente aceitar; caso não, ele ignora
          />
        </div>
      </section>

      <style jsx>{`
        /* container em tela cheia */
        .chartFS {
          position: fixed !important;
          inset: 0 !important;
          z-index: 50 !important;
          background: #0a0f0d;
        }

        /* grid responsivo (gráfico 2 colunas, controles 1) */
        @media (min-width: 1100px) {
          main.wrapper {
            grid-template-columns: 2fr 1fr;
          }
        }
        @media (max-width: 1099px) {
          section.panel:nth-of-type(1) {
            grid-column: 1 / -1;
          }
        }
      `}</style>
    </main>
  );
}
