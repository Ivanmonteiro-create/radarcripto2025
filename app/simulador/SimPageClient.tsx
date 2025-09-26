// app/simulador/SimPageClient.tsx
"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import TradingViewEmbedWidget from "@/components/TradingViewEmbedWidget";

type Pair = "BTCUSDT" | "ETHUSDT" | "BNBUSDT";

export default function SimPageClient() {
  const [symbol, setSymbol] = useState<Pair>("BTCUSDT");

  // container do gráfico para Fullscreen
  const chartWrapRef = useRef<HTMLDivElement | null>(null);

  const handleFs = useCallback(() => {
    const el = chartWrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      el.requestFullscreen?.().catch(() => {});
    }
  }, []);

  const title = useMemo(() => `Gráfico — ${symbol}`, [symbol]);

  return (
    <main className="wrapperSingle" style={{ padding: 16 }}>
      <div className="panel tradePanelShell" style={{ width: "min(1300px, 98vw)" }}>
        {/* Cabeçalho compacto com Voltar e Título */}
        <div className="tcHeader compactHeader" style={{ marginBottom: 10 }}>
          <h2 className="tcTitle">{title}</h2>
          <div className="tcHeaderActions">
            <button
              className="btn chartFsBtn--header"
              aria-label="Tela cheia"
              title="Tela cheia"
              onClick={handleFs}
            >
              ⛶
            </button>
            <Link href="/" className="btn tcBackBtn">
              Voltar ao início
            </Link>
          </div>
        </div>

        {/* GRID 2:1 — Esquerda gráfico, Direita controles */}
        <div
          className="compactGrid"
          style={{
            gridTemplateColumns: "minmax(620px, 2fr) minmax(340px, 1fr)",
            alignItems: "start",
          }}
        >
          {/* === COLUNA A: GRÁFICO === */}
          <div className="colA">
            <div
              ref={chartWrapRef}
              className="panel"
              style={{
                padding: 8,
                position: "relative",
                minHeight: 560,
                overflow: "hidden",
              }}
            >
              {/* Botão FS alinhado com o “ícone da câmera” (CSS global já sabe posicionar esse seletor) */}
              <button
                className="chartFsBtn"
                aria-label="Tela cheia"
                title="Tela cheia"
                onClick={handleFs}
              >
                ⛶
              </button>

              <TradingViewEmbedWidget
                symbol={symbol}
                interval="1"
                theme="dark"
                autosize
                height={560}
              />
            </div>
          </div>

          {/* === COLUNA B: CONTROLES === */}
          <div className="colB">
            <section className="panel compactPanel">
              <header className="compactHeader">
                <h3 className="compactTitle">Controles de Trade</h3>
                <span className="badge">Plano atual: Starter (Spot)</span>
              </header>

              {/* Pares rápidos */}
              <div className="pairsRow" style={{ marginBottom: 8 }}>
                {(["BTCUSDT", "ETHUSDT", "BNBUSDT"] as Pair[]).map((p) => (
                  <button
                    key={p}
                    className={`chip ${p === symbol ? "chip-active" : ""}`}
                    onClick={() => setSymbol(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Linhas principais */}
              <div className="twoCols" style={{ marginTop: 8 }}>
                <div className="cardMini">
                  <label className="lbl">Equity (simulado)</label>
                  <div className="fakeInput">10.000,00 USDT</div>
                </div>
                <div className="cardMini">
                  <label className="lbl">Saldo (USDT)</label>
                  <div className="fakeInput">10.000,00</div>
                </div>
              </div>

              <div className="threeCols" style={{ marginTop: 6 }}>
                <div className="cardMini">
                  <label className="lbl">Taxa (Perf) %</label>
                  <div className="fakeInput">0,00%</div>
                </div>
                <div className="cardMini">
                  <label className="lbl">Risco por trade (%)</label>
                  <div className="fakeInput">1,00%</div>
                </div>
                <div className="cardMini">
                  <label className="lbl">USDT p/ referência</label>
                  <div className="fakeInput">1000</div>
                </div>
              </div>

              {/* Ações */}
              <div className="twoCols" style={{ marginTop: 8 }}>
                <button className="btn btnBuy">Comprar</button>
                <button className="btn btnSell">Vender</button>
              </div>

              {/* Histórico (apenas o do rodapé deve ficar visível — CSS global já cuida) */}
              <div className="historyCard" style={{ marginTop: 12 }}>
                <p className="muted xs">Histórico: sem operações ainda.</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
