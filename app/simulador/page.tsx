// app/simulador/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import TradingViewWidget from "@/components/TradingViewWidget";
import TradeControls from "@/components/TradeControls";
import Link from "next/link";

type StudyPreset = "clean" | "rsi" | "macd" | "bb";

/** Map de presets -> lista de estudos do TradingView (ids oficiais) */
const STUDY_MAP: Record<StudyPreset, string[]> = {
  clean: [],
  rsi: ["RSI@tv-basicstudies"],
  macd: ["MACD@tv-basicstudies"],
  bb: ["BB@tv-basicstudies"], // Bollinger Bands
};

export default function SimuladorPage() {
  // estado compartilhado do par (sincroniza controles <-> gráfico)
  const [symbol, setSymbol] = useState<string>("BTCUSDT");

  // presets de indicadores do gráfico
  const [preset, setPreset] = useState<StudyPreset>("clean");

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
          {/* Barra superior fora do iframe: Início + Indicadores (lado ESQUERDO) */}
          <div className="graphTopBar">
            <Link href="/" className="btn btn-primary">Voltar ao início</Link>

            <div className="indicatorsWrap">
              <button className="indBtn" title="Indicadores">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 6h14M5 12h14M5 18h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span>Indicadores</span>
              </button>
              <select
                aria-label="Preset de indicadores"
                value={preset}
                onChange={(e) => setPreset(e.target.value as StudyPreset)}
                className="indSelect"
              >
                <option value="clean">Limpo</option>
                <option value="rsi">RSI</option>
                <option value="macd">MACD</option>
                <option value="bb">BB</option>
              </select>
            </div>
          </div>

          {/* TradingView sincronizado com o par e com preset de indicadores */}
          <TradingViewWidget
            symbol={`BINANCE:${symbol}`}
            studies={STUDY_MAP[preset]}
          />
        </div>
      </section>

      {/* CONTROLES (ícone de FS mais chamativo no header) */}
      <aside className="panel" style={{ height: "calc(100dvh - 32px)" }}>
        <TradeControls
          symbol={symbol}
          onSymbolChange={setSymbol}
          isFullscreen={isFs}
          onEnterFullscreen={enterFs}
          onExitFullscreen={exitFs}
          strongFs // deixa o botão mais chamativo
        />
      </aside>
    </main>
  );
}
