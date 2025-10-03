// components/LiveTickers.tsx
"use client";

import React from "react";
import TickerCard from "./TickerCard";
import useLivePrice from "@/lib/useLivePrice";

// Ordem e quantidade fixas -> ok usar hook dentro do map
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

export default function LiveTickers() {
  return (
    <aside className="live-tickers" aria-label="Cotações em tempo real">
      {PAIRS.map((pair) => {
        // O seu hook pode retornar number ou objeto; tratamos os dois jeitos.
        const data: any = useLivePrice(pair);
        const price =
          typeof data === "number"
            ? (data as number)
            : (data?.price as number | undefined);

        return <TickerCard key={pair} symbol={pair} price={price} />;
      })}
    </aside>
  );
}
