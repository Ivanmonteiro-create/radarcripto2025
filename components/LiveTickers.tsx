// components/LiveTickers.tsx
"use client";

import React from "react";
import TickerCard from "./TickerCard";

// Se você já tem um hook/prop com os preços ao vivo, troque este array pelo seu.
// A ordem define quem fica no topo (ADA/USDT primeiro, como você quer).
const DEFAULT_SYMBOLS = [
  "ADA/USDT",
  "BTC/USDT",
  "ETH/USDT",
  "SOL/USDT",
  "LINK/USDT",
  "BNB/USDT",
  "XRP/USDT",
  "DOGE/USDT",
];

type LiveTickersProps = {
  data?: { symbol: string; price: number | string }[]; // opcional: injete seus preços prontos
};

export default function LiveTickers({ data }: LiveTickersProps) {
  // Se vier `data`, usa; senão monta lista com preço vazio (evita quebra visual)
  const items =
    data ??
    DEFAULT_SYMBOLS.map((s) => ({
      symbol: s,
      price: "",
    }));

  return (
    <aside aria-label="Cotações ao vivo" className="rc-tickers-rail">
      {items.map((t) => (
        <TickerCard key={t.symbol} symbol={t.symbol} price={t.price} />
      ))}
    </aside>
  );
}
