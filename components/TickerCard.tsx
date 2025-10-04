// components/TickerCard.tsx
"use client";

import React from "react";

type TickerCardProps = {
  /** Ex.: "ADAUSDT" */
  symbol: string;
  /** Preço atual (pode vir null/undefined enquanto carrega) */
  price?: number | null;
};

/** ADAUSDT -> ADA/USDT */
function formatSymbol(symbol: string) {
  const upper = (symbol || "").toUpperCase();
  return upper.endsWith("USDT") ? upper.replace("USDT", "/USDT") : upper;
}

/** formatação amigável (números pequenos com mais casas) */
function formatPrice(price?: number | null) {
  if (price == null || Number.isNaN(price)) return "—";
  try {
    if (price < 1) return price.toFixed(6);
    return price.toLocaleString("pt-PT", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch {
    return String(price);
  }
}

export default function TickerCard({ symbol, price }: TickerCardProps) {
  return (
    /**
     * Classes casam com o CSS do globals:
     * .ticker-card  (container)
     * .ticker-symbol (linha de cima)
     * .ticker-price  (linha de baixo)
     *
     * O wrapper de cada card é um elemento simples; o layout (coluna/altura)
     * é controlado via CSS no globals.css, então aqui mantemos sem grid/inline styles.
     */
    <div className="ticker-card" role="group" aria-label={formatSymbol(symbol)}>
      <div className="ticker-symbol">{formatSymbol(symbol)}</div>
      <div className="ticker-price">{formatPrice(price)}</div>
    </div>
  );
}
