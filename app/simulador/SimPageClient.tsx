"use client";

import { useState } from "react";
import TradingViewWidget from "@/components/TradingViewWidget";
import TradeControls from "@/components/TradeControls";

export default function SimPageClient() {
  // Par inicial — ajuste se quiser outro
  const [symbol, setSymbol] = useState("BTCUSDT");

  return (
    <main className="simShell">
      {/* PAINEL DO GRÁFICO */}
      <section className="panel chartBox">
        <div className="chartWrap">
          {/* O componente deve preencher 100% do contêiner */}
          <TradingViewWidget symbol={symbol} />
        </div>
      </section>

      {/* PAINEL DE CONTROLES */}
      <section className="panel compactPanel">
        <div className="tcHeader">
          <h2 className="compactTitle">Controles de Trade</h2>
          <a href="/" className="btn tcBackBtn">Voltar ao início</a>
        </div>

        <div className="tradePanelShell">
          {/* Se o seu TradeControls aceita troca de par via callback, passe onChangeSymbol={setSymbol}.
             Se NÃO aceitar, deixe só symbol={symbol} como abaixo. */}
          <TradeControls symbol={symbol} />
        </div>
      </section>
    </main>
  );
}
