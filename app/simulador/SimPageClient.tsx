"use client";

import React, { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import TradeControls, {
  Pair,
  TradeRecord,
  TradeSide,
} from "@/components/TradeControls";

/**
 * IMPORTANTE
 * - Mantemos o widget do TradingView exatamente como você já usa (ssr:false)
 * - A fonte do preço (livePrice) continua vindo do seu estado atual
 *   (se você já atualiza via priceFeed ou via widget, ótimo).
 * - Aqui só “damos vida” aos botões e controlamos o histórico/CSV/PNL locais.
 */

const TradingViewWidget = dynamic(
  () => import("@/components/TradingViewWidget"),
  { ssr: false }
);

export default function SimPageClient() {
  // ======= estado principal =======
  const [symbol, setSymbol] = useState<Pair>("BTCUSDT");

  // Se você já possui um hook/efeito que atualiza livePrice a partir do priceFeed,
  // mantenha-o. Aqui deixo um fallback estático para não quebrar caso falte feed.
  const [livePrice, setLivePrice] = useState<number | undefined>(undefined);

  // Balanço/saldo e PNL simples (você pode evoluir essa lógica depois)
  const [balance, setBalance] = useState<number>(100_000); // USDT
  const [equity, setEquity] = useState<number | undefined>(undefined);
  const [pnl, setPnl] = useState<number>(0);

  // Histórico de operações (mostrado no rodapé)
  const [history, setHistory] = useState<TradeRecord[]>([]);

  // ======= handlers =======
  const onSymbolChange = useCallback((s: Pair) => {
    setSymbol(s);
    // Se o seu price feed troca o canal com base no símbolo, faça isso aqui.
    // Ex.: subscribePrice(s, setLivePrice)
  }, []);

  const addToHistory = useCallback(
    (side: TradeSide, price: number | undefined, sizeUSDT: number) => {
      const px = typeof price === "number" ? price : NaN;
      const rec: TradeRecord = {
        ts: Date.now(),
        side,
        symbol,
        price: px,
        sizeUSDT,
        // PNL real depende de abertura/fechamento; aqui mantemos opcional.
      };
      setHistory((h) => [...h, rec]);
    },
    [symbol]
  );

  const handleBuy = useCallback(
    (p: {
      symbol: Pair;
      price?: number;
      sizeUSDT: number;
      riskPct: number;
      tpPrice?: number;
      slPrice?: number;
    }) => {
      // Lógica mínima: apenas registrar a ordem no histórico
      addToHistory("BUY", p.price, p.sizeUSDT);

      // (Opcional) reservar margem / ajustar saldo:
      // setBalance((b) => b); // deixe inalterado por enquanto

      // (Opcional) atualizar equity/PNL com base em posição aberta
      // setPnl((x) => x);
      // setEquity(balance + pnl);
    },
    [addToHistory]
  );

  const handleSell = useCallback(
    (p: {
      symbol: Pair;
      price?: number;
      sizeUSDT: number;
      riskPct: number;
      tpPrice?: number;
      slPrice?: number;
    }) => {
      addToHistory("SELL", p.price, p.sizeUSDT);
      // Mesma observação da compra sobre saldo/equity/pnl
    },
    [addToHistory]
  );

  const handleResetHistory = useCallback(() => {
    setHistory([]);
    setPnl(0);
    // equity/balance ficam como estão (ou resete se quiser)
  }, []);

  const handleExportCSV = useCallback(() => {
    // Gera CSV simples do histórico atual
    const headers = ["datetime", "side", "symbol", "price", "sizeUSDT", "pnl"];
    const lines = [headers.join(",")];

    history.forEach((r) => {
      const row = [
        new Date(r.ts).toISOString(),
        r.side,
        r.symbol,
        isFinite(r.price) ? r.price : "",
        r.sizeUSDT,
        typeof r.pnl === "number" ? r.pnl : "",
      ];
      lines.push(row.join(","));
    });

    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    a.download = `radarcrypto-historico-${ts}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [history]);

  // Equity (se quiser mostrar algo, soma saldo + PNL simples)
  const computedEquity = useMemo(() => {
    if (typeof balance !== "number") return undefined;
    return balance + pnl;
  }, [balance, pnl]);

  // ======= Layout =======
  return (
    <main className="simWrap">
      <section className="chartPanel compactPanel">
        <TradingViewWidget
          symbol={symbol}
          interval="1"
          theme="dark"
          autosize
          // Se você já recebe preço do widget, continue chamando setLivePrice
          // via onPrice? ou por outro listener seu.
        />
      </section>

      <section className="tradePanelShell">
        <TradeControls
          symbol={symbol}
          onSymbolChange={onSymbolChange}
          livePrice={livePrice}
          pnl={pnl}
          equity={computedEquity}
          balance={balance}
          onBuy={handleBuy}
          onSell={handleSell}
          onResetHistory={handleResetHistory}
          onExportCSV={handleExportCSV}
          history={history}
        />
      </section>

      <style jsx>{`
        .simWrap {
          display: grid;
          grid-template-columns: 1.4fr 0.9fr; /* mantém o gráfico dominante */
          gap: 14px;
          align-items: start;
        }
        .chartPanel {
          min-height: 72vh;
        }
        .compactPanel {
          /* já está coerente com seu tema; mantemos */
        }
        .tradePanelShell {
          max-height: calc(100vh - 24px);
          overflow: auto;
        }

        @media (max-width: 1100px) {
          .simWrap {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
