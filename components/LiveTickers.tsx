// components/LiveTickers.tsx
"use client";

import React from "react";
import TickerCard from "./TickerCard";
// ⬇️ O hook é exportado com *named export*
import { useLivePrice } from "@/lib/useLivePrice";

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
        const data: any = useLivePrice(pair);
        const price =
          typeof data === "number"
            ? (data as number)
            : (data?.price as number | undefined);

        return <TickerCard key={pair} symbol={pair} price={price ?? null} />;
      })}
    </aside>
  );
}
