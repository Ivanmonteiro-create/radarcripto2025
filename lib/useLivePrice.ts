// lib/useLivePrice.ts
"use client";

import { useEffect, useRef, useState } from "react";

type PriceState = { price: number | null; ts: number };

const WS_BASE = "wss://stream.binance.com:9443/ws";

// Transforma "ADAUSDT" -> "adausdt@miniTicker"
function streamName(pair: string) {
  return `${pair.toLowerCase()}@miniTicker`;
}

/**
 * Hook de preço ao vivo (WebSocket com reconexão + fallback a polling).
 * Ex.: const { price } = useLivePrice("BTCUSDT")
 */
export function useLivePrice(pair: string, opts?: { pollMs?: number }) {
  const pollMs = opts?.pollMs ?? 12000; // usado só se o WS falhar
  const [state, setState] = useState<PriceState>({ price: null, ts: 0 });
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<number | null>(null);
  const retriesRef = useRef(0);

  useEffect(() => {
    let stopped = false;

    const connect = () => {
      const url = `${WS_BASE}/${streamName(pair)}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        retriesRef.current = 0;
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          // miniTicker usa o campo "c" (close) como string
          const px = msg?.c ? Number(msg.c) : Number(msg?.p ?? msg?.lastPrice);
          if (!Number.isNaN(px)) {
            setState({ price: px, ts: Date.now() });
          }
        } catch {
          /* ignora */
        }
      };

      ws.onerror = () => {
        if (wsRef.current === ws) wsRef.current = null;
        ws.close();
      };

      ws.onclose = () => {
        if (stopped) return;
        // backoff exponencial simples
        retriesRef.current += 1;
        const wait = Math.min(30000, 500 * 2 ** retriesRef.current);
        window.setTimeout(connect, wait);
      };
    };

    connect();

    // Fallback: se nada chegar por muito tempo, faz um fetch ocasional
    const poll = async () => {
      try {
        const r = await fetch(
          `https://api.binance.com/api/v3/ticker/price?symbol=${pair}`
        );
        const j = (await r.json()) as { price?: string };
        const px = j?.price ? Number(j.price) : NaN;
        if (!Number.isNaN(px)) setState({ price: px, ts: Date.now() });
      } catch {
        /* ignora */
      }
      timerRef.current = window.setTimeout(poll, pollMs) as unknown as number;
    };
    timerRef.current = window.setTimeout(poll, pollMs) as unknown as number;

    return () => {
      stopped = true;
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = null;
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {}
        wsRef.current = null;
      }
    };
  }, [pair, pollMs]);

  return state; // {price, ts}
}
