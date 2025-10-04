// lib/useLivePrice.ts
"use client";

import { useEffect, useRef, useState } from "react";

type PriceState = { price: number | null; ts: number };

const WS_BASE = "wss://stream.binance.com:9443/ws";
const REST_URL = "https://api.binance.com/api/v3/ticker/price";

function streamName(pair: string) {
  return `${pair.toLowerCase()}@miniTicker`;
}

/**
 * Mostra preço imediatamente:
 * 1) faz um fetch REST *na hora* do mount (sem esperar WS)
 * 2) abre WebSocket (rápido), com reconexão
 * 3) mantém polling leve como fallback
 */
export function useLivePrice(pair: string, opts?: { pollMs?: number }) {
  const pollMs = opts?.pollMs ?? 15000;
  const [state, setState] = useState<PriceState>({ price: null, ts: 0 });

  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<number | null>(null);
  const retriesRef = useRef(0);

  useEffect(() => {
    let stopped = false;

    // 1) Primeiro, REST imediato (remove “barras”/vazio inicial)
    (async () => {
      try {
        const r = await fetch(`${REST_URL}?symbol=${pair}`, { cache: "no-store" });
        const j = (await r.json()) as { price?: string };
        const px = j?.price ? Number(j.price) : NaN;
        if (!Number.isNaN(px)) setState({ price: px, ts: Date.now() });
      } catch {
        /* ignora */
      }
    })();

    // 2) WebSocket (rápido + reconexão)
    const connect = () => {
      const ws = new WebSocket(`${WS_BASE}/${streamName(pair)}`);
      wsRef.current = ws;

      ws.onopen = () => (retriesRef.current = 0);

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          const px = msg?.c ? Number(msg.c) : Number(msg?.p ?? msg?.lastPrice);
          if (!Number.isNaN(px)) setState({ price: px, ts: Date.now() });
        } catch {}
      };

      ws.onerror = () => {
        if (wsRef.current === ws) wsRef.current = null;
        ws.close();
      };
      ws.onclose = () => {
        if (stopped) return;
        retriesRef.current += 1;
        const wait = Math.min(30000, 500 * 2 ** retriesRef.current);
        window.setTimeout(connect, wait);
      };
    };
    connect();

    // 3) Fallback (polling leve)
    const poll = async () => {
      try {
        const r = await fetch(`${REST_URL}?symbol=${pair}`, { cache: "no-store" });
        const j = (await r.json()) as { price?: string };
        const px = j?.price ? Number(j.price) : NaN;
        if (!Number.isNaN(px)) setState({ price: px, ts: Date.now() });
      } catch {}
      timerRef.current = window.setTimeout(poll, pollMs) as unknown as number;
    };
    timerRef.current = window.setTimeout(poll, pollMs) as unknown as number;

    return () => {
      stopped = true;
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = null;
      if (wsRef.current) {
        try { wsRef.current.close(); } catch {}
        wsRef.current = null;
      }
    };
  }, [pair, pollMs]);

  return state;
}
