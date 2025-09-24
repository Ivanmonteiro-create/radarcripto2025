// lib/priceFeed.ts
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

      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          const p = Number(data?.p ?? data?.price);
          if (!p || isNaN(p)) return;
          this.listeners.get(key)?.forEach((fn) => fn(p));
        } catch {}
      };

      ws.onclose = () => {
        // se ainda há ouvintes, tenta reconectar
        this.sockets.delete(key);
        if (this.listeners.get(key)?.size) {
          setTimeout(() => this.open(key), 1000);
        }
      };

      (ws as any)._symbolKey = key;
      this.sockets.set(key, ws);
    }

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

  private open(key: string) {
    if (this.sockets.has(key)) return;
    const url = `wss://stream.binance.com:9443/ws/${this.stream(key)}`;
    const ws = new WebSocket(url);
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        const p = Number(data?.p ?? data?.price);
        if (!p || isNaN(p)) return;
        this.listeners.get(key)?.forEach((fn) => fn(p));
      } catch {}
    };
    ws.onclose = () => {
      this.sockets.delete(key);
      if (this.listeners.get(key)?.size) {
        setTimeout(() => this.open(key), 1000);
      }
    };
    this.sockets.set(key, ws);
  }
}

export const priceFeed = new PriceFeed();
