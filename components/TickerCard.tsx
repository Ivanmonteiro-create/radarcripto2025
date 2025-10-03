// components/TickerCard.tsx
"use client";

import React from "react";

type Props = {
  symbol: string;            // ex.: "ADAUSDT"
  price?: number | null;     // preço atual (pode vir undefined/null enquanto carrega)
};

function formatSymbol(symbol: string) {
  // ADAUSDT -> ADA/USDT
  return symbol.toUpperCase().replace("USDT", "/USDT");
}

function formatPrice(price?: number | null) {
  if (price == null) return "—";
  try {
    // Preços pequenos com mais casas; grandes com separador pt-PT
    if (price < 1) return price.toFixed(6);
    return price.toLocaleString("pt-PT", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch {
    return String(price);
  }
}

export default function TickerCard({ symbol, price }: Props) {
  return (
    <div className="ticker-card" role="group" aria-label={formatSymbol(symbol)}>
      <div className="ticker-symbol">{formatSymbol(symbol)}</div>
      <div className="ticker-price">{formatPrice(price)}</div>
    </div>
  );
}
