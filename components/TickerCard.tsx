// components/TickerCard.tsx
import React from "react";

type Props = {
  symbol: string; // ex: "ADA/USDT"
  price: string | number; // já formatado ou número cru
};

export default function TickerCard({ symbol, price }: Props) {
  return (
    <div className="rc-ticker-card">
      <span className="rc-ticker-symbol">{symbol}</span>
      <span className="rc-ticker-price">
        {typeof price === "number" ? price.toLocaleString("pt-PT") : price}
      </span>
    </div>
  );
}
