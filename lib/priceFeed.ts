// /lib/priceFeed.ts
import { useEffect, useState } from 'react';

type Listener = (price: number) => void;

class PriceFeed {
  private sockets = new Map<string, WebSocket>();
  private listeners = new Map<string, Set<Listener>>();

  private stream(symbol: string) {
    return `${symbol.toLowerCase()}@trade`;
  }

  subscribe(symbol: string, cb: Listener) {
    const key = symbol.toUpperCase();
    if (!this.listeners.has(key)) this.listeners.set(key, new Set());
    this.listeners.get(key)!.add(cb);

    if (!this.sockets.has(key)) {
      const url = `wss://stream.binance.com:9443/ws/${this.stream(key)}`;
      const ws = new WebSocket(url);
      this.sockets.set(key, ws);

      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data as string);
          // no trade stream da Binance o preço vem em data.p (string)
          const p = Number(data.p);
          if (!isNaN(p)) {
            const set = this.listeners.get(key);
            set?.forEach((fn) => fn(p));
          }
        } catch {
          /* ignora pacotes inválidos */
        }
      };

      ws.onclose = () => {
        this.sockets.delete(key);
      };
      ws.onerror = () => {
        try { ws.close(); } catch {}
      };
    }

    return () => this.unsubscribe(symbol, cb);
  }

  unsubscribe(symbol: string, cb: Listener) {
    const key = symbol.toUpperCase();
    const set = this.listeners.get(key);
    if (set) {
      set.delete(cb);
      if (set.size === 0) {
        this.listeners.delete(key);
        const ws = this.sockets.get(key);
        if (ws && ws.readyState === WebSocket.OPEN) ws.close();
        this.sockets.delete(key);
      }
    }
  }
}

// singleton
export const priceFeed = new PriceFeed();

/** Hook simples para obter o último preço ao vivo de um símbolo */
export function useLivePrice(symbol: string) {
  const [price, setPrice] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!symbol) return;
    let mounted = true;
    const off = priceFeed.subscribe(symbol, (p) => {
      if (mounted) setPrice(p);
    });
    return () => { mounted = false; off(); };
  }, [symbol]);

  return price;
}
