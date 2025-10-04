// components/LiveTickers.tsx
"use client";

import React from "react";
import TickerCard from "./TickerCard";
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
        const { price } = useLivePrice(pair);
        return <TickerCard key={pair} symbol={pair} price={price} />;
      })}
    </aside>
  );
}
