"use client";

import { useEffect, useState } from "react";

type PriceState = { price: number | null; ts: number };
const TESTNET_REST_URL = "https://testnet.binance.vision/api/v3/ticker/price";

export function useLivePrice(pair: string, opts?: { pollMs?: number }) {
  const pollMs = Math.max(5_000, opts?.pollMs ?? 15_000);
  const [state, setState] = useState<PriceState>({ price: null, ts: 0 });

  useEffect(() => {
    let stopped = false;
    let controller: AbortController | null = null;

    async function refresh() {
      controller?.abort();
      controller = new AbortController();
      try {
        const response = await fetch(`${TESTNET_REST_URL}?symbol=${encodeURIComponent(pair)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) return;
        const payload = await response.json() as { price?: string };
        const price = Number(payload.price);
        if (!stopped && Number.isFinite(price) && price > 0) setState({ price, ts: Date.now() });
      } catch {
        // A cotação indisponível permanece visível como desatualizada; nunca há fallback para Binance Live.
      }
    }

    void refresh();
    const timer = window.setInterval(() => void refresh(), pollMs);
    return () => {
      stopped = true;
      controller?.abort();
      window.clearInterval(timer);
    };
  }, [pair, pollMs]);

  return state;
}
