// components/LiveTickers.tsx
"use client";

import React from "react";
import TickerCard from "./TickerCard";
import { useLivePrice } from "@/lib/useLivePrice"; // named export

// Pares exibidos na Home (ordem = de cima pra baixo)
const PAIRS = [
  "ADAUSDT",
  "BTCUSDT",
  "ETHUSDT",
  "SOLUSDT",
  "LINKUSDT",
  "BNBUSDT",
  "XRPUSDT",
  "DOGEUSDT",
] as const;

export type Pair = (typeof PAIRS)[number];

export default function LiveTickers() {
  return (
    /**
     * Mantemos a classe original (live-tickers) e adicionamos rc-tickers-rail
     * para permitir o “lock” por CSS que fixa a coluna à esquerda.
     * (Se o CSS final preferir mirar só .live-tickers, também funciona.)
     */
    <aside className="live-tickers rc-tickers-rail" aria-label="Cotações em tempo real">
      {PAIRS.map((pair) => {
        // O hook pode retornar number OU objeto { price }
        const data: unknown = useLivePrice(pair);
        const price =
          typeof data === "number"
            ? data
            : (data as { price?: number } | null | undefined)?.price ?? null;

        return <TickerCard key={pair} symbol={pair} price={price} />;
      })}
    </aside>
  );
}
