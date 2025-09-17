// components/LiveTickers.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import TickerCard from "@/components/TickerCard";

type PriceMap = Record<string, string>;

const SYMBOLS = [
  "ADAUSDT",
  "BTCUSDT",
  "ETHUSDT",
  "SOLUSDT",
  "LINKUSDT",
  "BNBUSDT",
  "XRPUSDT",
  "DOGEUSDT",
];

const nf = new Intl.NumberFormat("pt-PT", {
  style: "decimal",
  maximumFractionDigits: 6,
});

async function fetchPrice(symbol: string): Promise<number> {
  const res = await fetch(
    `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Erro ao buscar ${symbol}`);
  const data = (await res.json()) as { symbol: string; price: string };
  return Number(data.price);
}

export default function LiveTickers() {
  const [prices, setPrices] = useState<PriceMap>({});
  const [loading, setLoading] = useState(true);

  const pairs = useMemo(
    () =>
      SYMBOLS.map((s) => ({
        // exibe como ADA/USDT
        label: `${s.replace("USDT", "")}/USDT`,
        key: s,
      })),
    []
  );

  useEffect(() => {
    let mounted = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    const load = async () => {
      try {
        const results = await Promise.all(
          SYMBOLS.map((s) =>
            fetchPrice(s)
              .then((p) => [s, p] as const)
              .catch(() => [s, NaN] as const)
          )
        );
        if (!mounted) return;
        const next: PriceMap = {};
        for (const [sym, val] of results) {
          next[sym] = isNaN(val) ? "—" : nf.format(val);
        }
        setPrices(next);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    // atualiza a cada 10s
    timer = setInterval(load, 10_000);

    return () => {
      mounted = false;
      if (timer) clearInterval(timer);
    };
  }, []);

  return (
    <div className="tickers">
      {pairs.map((p) => (
        <TickerCard
          key={p.key}
          symbol={p.label}
          price={prices[p.key] ?? (loading ? "…" : "—")}
        />
      ))}
    </div>
  );
}
