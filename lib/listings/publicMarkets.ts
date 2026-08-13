import type { PublicMarket } from "./contracts";

type Provider = { exchange: string; url: string; parse: (payload: unknown) => PublicMarket[] };

const number = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const market = (exchange: string, pair: string, price: unknown, volume: unknown, change: unknown): PublicMarket | null => {
  const compact = pair.replace(/[-_]/g, "").toUpperCase();
  const quote = ["USDT", "USDC", "BTC", "ETH", "EUR", "BRL"].find((candidate) => compact.endsWith(candidate));
  if (!quote) return null;
  return { exchange, pair: compact, asset: compact.slice(0, -quote.length), price: number(price), volume24h: number(volume), change24hPercent: number(change) };
};

export const PUBLIC_MARKET_PROVIDERS: readonly Provider[] = [
  { exchange: "BINANCE", url: "https://data-api.binance.vision/api/v3/ticker/24hr", parse: (p) => (Array.isArray(p) ? p : []).flatMap((r: Record<string, unknown>) => { const m = market("BINANCE", String(r.symbol), r.lastPrice, r.quoteVolume, r.priceChangePercent); return m ? [m] : []; }) },
  { exchange: "OKX", url: "https://www.okx.com/api/v5/market/tickers?instType=SPOT", parse: (p) => { const rows = (p as { data?: Array<Record<string, unknown>> })?.data; return (Array.isArray(rows) ? rows : []).flatMap((r) => { const open = number(r.open24h), last = number(r.last); const change = open && last ? ((last - open) / open) * 100 : null; const m = market("OKX", String(r.instId), last, r.volCcy24h, change); return m ? [m] : []; }); } },
  { exchange: "BYBIT", url: "https://api.bybit.com/v5/market/tickers?category=spot", parse: (p) => { const rows = (p as { result?: { list?: Array<Record<string, unknown>> } })?.result?.list; return (Array.isArray(rows) ? rows : []).flatMap((r) => { const m = market("BYBIT", String(r.symbol), r.lastPrice, r.turnover24h, number(r.price24hPcnt) === null ? null : Number(r.price24hPcnt) * 100); return m ? [m] : []; }); } },
  { exchange: "KUCOIN", url: "https://api.kucoin.com/api/v1/market/allTickers", parse: (p) => { const rows = (p as { data?: { ticker?: Array<Record<string, unknown>> } })?.data?.ticker; return (Array.isArray(rows) ? rows : []).flatMap((r) => { const m = market("KUCOIN", String(r.symbol), r.last, r.volValue, number(r.changeRate) === null ? null : Number(r.changeRate) * 100); return m ? [m] : []; }); } },
  { exchange: "GATEIO", url: "https://api.gateio.ws/api/v4/spot/tickers", parse: (p) => (Array.isArray(p) ? p : []).flatMap((r: Record<string, unknown>) => { const m = market("GATEIO", String(r.currency_pair), r.last, r.quote_volume, r.change_percentage); return m ? [m] : []; }) },
  { exchange: "MEXC", url: "https://api.mexc.com/api/v3/ticker/24hr", parse: (p) => (Array.isArray(p) ? p : []).flatMap((r: Record<string, unknown>) => { const m = market("MEXC", String(r.symbol), r.lastPrice, r.quoteVolume, r.priceChangePercent); return m ? [m] : []; }) },
] as const;

export async function fetchPublicMarkets(assets: string[], fetchImpl: typeof fetch = fetch) {
  const wanted = new Set(assets);
  const failures: string[] = [];
  const batches = await Promise.all(PUBLIC_MARKET_PROVIDERS.map(async (provider) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12_000);
    try {
      const response = await fetchImpl(provider.url, { signal: controller.signal, headers: { accept: "application/json", "user-agent": "RadarCrypto-Listings/1.0" } });
      if (!response.ok) throw new Error("MARKET_UNAVAILABLE");
      const text = await response.text();
      if (text.length > 12_000_000) throw new Error("MARKET_RESPONSE_TOO_LARGE");
      return provider.parse(JSON.parse(text)).filter((entry) => wanted.has(entry.asset) && entry.pair.endsWith("USDT"));
    } catch {
      failures.push(provider.exchange);
      return [];
    } finally { clearTimeout(timer); }
  }));
  return { markets: batches.flat(), failures };
}
