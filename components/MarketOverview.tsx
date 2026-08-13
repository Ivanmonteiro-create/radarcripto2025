"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n/LocaleProvider";

const SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "ADAUSDT", "LINKUSDT"] as const;
const TESTNET_TICKERS_URL = "https://testnet.binance.vision/api/v3/ticker/price";

type PriceMap = Partial<Record<(typeof SYMBOLS)[number], number>>;

export default function MarketOverview() {
  const { locale } = useI18n();
  const localeTag = locale === "pt" ? "pt-PT" : locale === "es" ? "es-ES" : "en-GB";
  const [prices, setPrices] = useState<PriceMap>({});
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);

  useEffect(() => {
    let stopped = false;
    let controller: AbortController | null = null;

    async function refresh() {
      controller?.abort();
      controller = new AbortController();
      try {
        const response = await fetch(TESTNET_TICKERS_URL, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) return;
        const payload = await response.json() as Array<{ symbol?: string; price?: string }>;
        const next: PriceMap = {};
        for (const ticker of payload) {
          if (!SYMBOLS.includes(ticker.symbol as (typeof SYMBOLS)[number])) continue;
          const price = Number(ticker.price);
          if (Number.isFinite(price) && price > 0) next[ticker.symbol as (typeof SYMBOLS)[number]] = price;
        }
        if (!stopped) {
          setPrices(next);
          setUpdatedAt(Date.now());
        }
      } catch {
        // Mantém o último valor conhecido; não existe fallback para Binance Live.
      }
    }

    void refresh();
    const timer = window.setInterval(() => void refresh(), 15_000);
    return () => {
      stopped = true;
      controller?.abort();
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="rc-market-panel">
      <div className="rc-market-toolbar">
        <span><i aria-hidden /> Binance Spot Testnet · {locale === "en" ? "read only" : locale === "es" ? "solo lectura" : "somente leitura"}</span>
        <small>{updatedAt ? `${locale === "en" ? "Updated" : locale === "es" ? "Actualizado" : "Atualizado"} ${new Date(updatedAt).toLocaleTimeString(localeTag)}` : locale === "en" ? "Loading prices…" : locale === "es" ? "Cargando precios…" : "A carregar cotações…"}</small>
      </div>
      <div className="rc-market-grid">
        {SYMBOLS.map((symbol) => (
          <article key={symbol} className="rc-market-asset">
            <span>{symbol.replace("USDT", "")}</span>
            <strong>{prices[symbol]?.toLocaleString(localeTag, { maximumFractionDigits: 8 }) ?? "—"}</strong>
            <small>USDT</small>
          </article>
        ))}
      </div>
    </div>
  );
}
