// components/LiveTickers.tsx
"use client";

import React from "react";
import { useLivePrice } from "@/lib/useLivePrice";

const PAIRS = [
  "ADAUSDT", "BTCUSDT", "ETHUSDT", "SOLUSDT",
  "LINKUSDT", "BNBUSDT", "XRPUSDT", "DOGEUSDT",
] as const;

function TickerChip({ pair }: { pair: (typeof PAIRS)[number] }) {
  const { price } = useLivePrice(pair);
  return (
    <div className="rc-chip">
      <div className="rc-chip__pair">{pair}</div>
      <div className="rc-chip__price">{price ? price.toLocaleString("pt-PT") : "—"}</div>
    </div>
  );
}

export default function LiveTickers() {
  return (
    <div className="rc-tickers rc-tickers--left">
      {PAIRS.map((p) => (
        <TickerChip key={p} pair={p} />
      ))}
    </div>
  );
}
