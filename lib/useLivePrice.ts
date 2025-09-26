import { useEffect, useState } from 'react';

export function useLivePrice(symbol: string) {
  const [price, setPrice] = useState<number | null>(null);

  useEffect(() => {
    if (!symbol) return;
    const stream = `${symbol.toLowerCase()}@ticker`;
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${stream}`);

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data && typeof data.c === 'string') {
          setPrice(parseFloat(data.c));
        }
      } catch {}
    };

    return () => ws.close(1000);
  }, [symbol]);

  return price;
}
