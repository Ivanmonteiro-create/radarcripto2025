import type { SymbolInfo } from "@/lib/trading/domain";
import { normalizeSymbol } from "@/lib/trading/domain";

const TESTNET_EXCHANGE_INFO = "https://testnet.binance.vision/api/v3/exchangeInfo";
const CACHE_MS = 15 * 60_000;
type RawFilter = { filterType: string; minPrice?: string; maxPrice?: string; tickSize?: string; minQty?: string; maxQty?: string; stepSize?: string; minNotional?: string };
type RawSymbol = { symbol: string; status: string; baseAsset: string; quoteAsset: string; isSpotTradingAllowed: boolean; filters: RawFilter[] };
let cache: { expiresAt: number; symbols: SymbolInfo[] } | null = null;

function mapSymbol(item: RawSymbol): SymbolInfo | null {
  const price = item.filters.find((filter) => filter.filterType === "PRICE_FILTER");
  const lot = item.filters.find((filter) => filter.filterType === "LOT_SIZE");
  const notional = item.filters.find((filter) => filter.filterType === "MIN_NOTIONAL" || filter.filterType === "NOTIONAL");
  if (!price || !lot || !notional) return null;
  return {
    symbol: item.symbol,
    status: item.status,
    baseAsset: item.baseAsset,
    quoteAsset: item.quoteAsset,
    spotAllowed: item.isSpotTradingAllowed,
    filter: {
      minPrice: Number(price.minPrice), maxPrice: Number(price.maxPrice), tickSize: Number(price.tickSize),
      minQuantity: Number(lot.minQty), maxQuantity: Number(lot.maxQty), stepSize: Number(lot.stepSize),
      minNotional: Number(notional.minNotional),
    },
  };
}

export async function getTestnetSpotSymbols(): Promise<SymbolInfo[]> {
  if (cache && cache.expiresAt > Date.now()) return cache.symbols;
  const response = await fetch(TESTNET_EXCHANGE_INFO, { cache: "no-store", signal: AbortSignal.timeout(8_000) });
  if (!response.ok) throw new Error(`BINANCE_TESTNET_EXCHANGE_INFO_${response.status}`);
  const payload = await response.json() as { symbols: RawSymbol[] };
  const symbols = payload.symbols.map(mapSymbol).filter((item): item is SymbolInfo => Boolean(item));
  cache = { expiresAt: Date.now() + CACHE_MS, symbols };
  return symbols;
}

export async function findTestnetSpotSymbol(symbol: string): Promise<SymbolInfo | null> {
  const normalized = normalizeSymbol(symbol);
  return (await getTestnetSpotSymbols()).find((item) => item.symbol === normalized) ?? null;
}

export async function searchTestnetSpotSymbols(query: string, limit = 25): Promise<SymbolInfo[]> {
  const normalized = normalizeSymbol(query);
  return (await getTestnetSpotSymbols())
    .filter((item) => item.quoteAsset === "USDT" && item.spotAllowed && item.status === "TRADING" && (!normalized || item.symbol.includes(normalized) || item.baseAsset.includes(normalized)))
    .slice(0, Math.min(Math.max(limit, 1), 50));
}
