// lib/priceFeed.ts
// Cliente mínimo de preços em tempo real (Binance trade stream).
// Mantém 1 conexão por símbolo (ex.: "BTCUSDT") e notifica assinantes.

type Listener = (price: number) => void;

class PriceFeed {
  private sockets = new Map<string, WebSocket>();
  private listeners = new Map<string, Set<Listener>>();

  private toStream(symbol: string) {
    // Binance usa minúsculas no stream
    return `${symbol.toLowerCase()}@trade`;
  }

  subscribe(symbol: string, cb: Listener) {
    const key = symbol.toUpperCase();
    if (!this.listeners.has(key)) this.listeners.set(key, new Set());
    this.listeners.get(key)!.add(cb);

    if (!this.sockets.has(key)) {
      const url = `wss://stream.binance.com:9443/ws/${this.toStream(key)}`;
      const ws = new WebSocket(url);

      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          // preço negociado (trade)
          const p = Number(data?.p ?? data?.price);
          if (!p || isNaN(p)) return;
          this.listeners.get(key)?.forEach((fn) => fn(p));
        } catch {}
      };

      ws.onclose = () => {
        // tentativa simples de reconexão
        this.sockets.delete(key);
        if (this.listeners.get(key)?.size) {
          setTimeout(() => this.subscribe(key, () => {}), 1000);
        }
      };

      this.sockets.set(key, ws);
    }

    // função de unsubscribe
    return () => {
      const set = this.listeners.get(key);
      if (!set) return;
      set.delete(cb);
      if (set.size === 0) {
        this.listeners.delete(key);
        const ws = this.sockets.get(key);
        if (ws) {
          try { ws.close(); } catch {}
          this.sockets.delete(key);
        }
      }
    };
  }
}

export const priceFeed = new PriceFeed();
