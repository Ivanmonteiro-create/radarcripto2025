import { marketSnapshotSchema, type MarketSnapshot, type RadarSymbol } from "./contracts";

const DEFAULT_BASE_URL = "https://data-api.binance.vision";
const CANDLE_LIMIT = 192;

type FetchLike = typeof fetch;
type Candle = { openTime: number; high: number; low: number; close: number; volume: number };

export class MarketDataError extends Error {
  constructor(readonly code: "MARKET_DATA_TIMEOUT" | "MARKET_DATA_UNAVAILABLE" | "MARKET_DATA_INVALID") {
    super(code);
  }
}

function finite(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new MarketDataError("MARKET_DATA_INVALID");
  return parsed;
}

function parseCandles(payload: unknown): Candle[] {
  if (!Array.isArray(payload) || payload.length < 50) throw new MarketDataError("MARKET_DATA_INVALID");
  return payload.map((row) => {
    if (!Array.isArray(row) || row.length < 6) throw new MarketDataError("MARKET_DATA_INVALID");
    return { openTime: finite(row[0]), high: finite(row[2]), low: finite(row[3]), close: finite(row[4]), volume: finite(row[5]) };
  });
}

function ema(values: number[], period: number): number {
  const multiplier = 2 / (period + 1);
  return values.slice(1).reduce((value, current) => current * multiplier + value * (1 - multiplier), values[0]);
}

function stats(candles: Candle[], count: number, label: string) {
  const sample = candles.slice(-count);
  const high = Math.max(...sample.map((item) => item.high));
  const low = Math.min(...sample.map((item) => item.low));
  const first = sample[0].close;
  const last = sample.at(-1)!.close;
  return {
    label,
    high,
    low,
    changePct: ((last - first) / first) * 100,
    rangeBps: ((high - low) / low) * 10_000,
    volume: sample.reduce((sum, item) => sum + item.volume, 0),
  };
}

function volatilityBps(candles: Candle[]): number {
  const returns = candles.slice(1).map((item, index) => Math.log(item.close / candles[index].close));
  const average = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance = returns.reduce((sum, value) => sum + (value - average) ** 2, 0) / returns.length;
  return Math.sqrt(variance) * 10_000;
}

function zones(candles: Candle[], currentPrice: number, side: "support" | "resistance") {
  const candidates: Array<{ price: number; at: number }> = [];
  for (let index = 2; index < candles.length - 2; index += 1) {
    const sample = candles.slice(index - 2, index + 3);
    const item = candles[index];
    const isSwing = side === "support"
      ? item.low === Math.min(...sample.map((entry) => entry.low)) && item.low < currentPrice
      : item.high === Math.max(...sample.map((entry) => entry.high)) && item.high > currentPrice;
    if (isSwing) candidates.push({ price: side === "support" ? item.low : item.high, at: item.openTime });
  }

  const toleranceBps = 18;
  const clusters: Array<{ prices: number[]; timestamps: number[] }> = [];
  for (const candidate of candidates) {
    const cluster = clusters.find((entry) => {
      const center = entry.prices.reduce((sum, price) => sum + price, 0) / entry.prices.length;
      return Math.abs(candidate.price - center) / center * 10_000 <= toleranceBps;
    });
    if (cluster) {
      cluster.prices.push(candidate.price);
      cluster.timestamps.push(candidate.at);
    } else {
      clusters.push({ prices: [candidate.price], timestamps: [candidate.at] });
    }
  }

  return clusters
    .map((cluster) => {
      const center = cluster.prices.reduce((sum, price) => sum + price, 0) / cluster.prices.length;
      const halfWidth = center * (toleranceBps / 2) / 10_000;
      return {
        low: center - halfWidth,
        high: center + halfWidth,
        touches: cluster.prices.length,
        lastSeenAt: new Date(Math.max(...cluster.timestamps)).toISOString(),
        distance: Math.abs(currentPrice - center),
      };
    })
    .sort((left, right) => right.touches - left.touches || left.distance - right.distance)
    .slice(0, 2)
    .map((zone) => ({ low: zone.low, high: zone.high, touches: zone.touches, lastSeenAt: zone.lastSeenAt }));
}

function classify(input: { current: number; ema20: number; ema50: number; range24h: number; trend48h: number; volatility: number }) {
  const { current, ema20, ema50, range24h, trend48h, volatility } = input;
  const alignedUp = current > ema20 && ema20 > ema50 && trend48h > 80;
  const alignedDown = current < ema20 && ema20 < ema50 && trend48h < -80;
  let regime: MarketSnapshot["regime"] = "INDEFINIDO";
  let confidence: MarketSnapshot["confidence"] = "BAIXA";
  if (range24h >= 500 || volatility >= 45) {
    regime = "VOLATILIDADE ELEVADA";
    confidence = range24h >= 700 ? "ALTA" : "MÉDIA";
  } else if (range24h <= 120 && volatility <= 12) {
    regime = "VOLATILIDADE BAIXA";
    confidence = "ALTA";
  } else if (alignedUp) {
    regime = "TENDÊNCIA DE ALTA";
    confidence = trend48h > 200 ? "ALTA" : "MÉDIA";
  } else if (alignedDown) {
    regime = "TENDÊNCIA DE BAIXA";
    confidence = trend48h < -200 ? "ALTA" : "MÉDIA";
  } else if (Math.abs(trend48h) < 100 && range24h < 350) {
    regime = "LATERAL";
    confidence = "MÉDIA";
  }
  const rangeSuitability: MarketSnapshot["rangeSuitability"] = regime === "LATERAL" ? "ALTA" : regime.includes("TENDÊNCIA") ? "BAIXA" : "MÉDIA";
  const trendSuitability: MarketSnapshot["trendSuitability"] = regime.includes("TENDÊNCIA") ? "ALTA" : regime === "LATERAL" || regime === "VOLATILIDADE BAIXA" ? "BAIXA" : "MÉDIA";
  return { regime, confidence, rangeSuitability, trendSuitability };
}

export async function fetchMarketSnapshot(
  symbol: RadarSymbol,
  options: { fetchImpl?: FetchLike; baseUrl?: string; timeoutMs?: number; now?: () => Date } = {},
): Promise<MarketSnapshot> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const baseUrl = options.baseUrl ?? process.env.RADAR_MARKET_DATA_BASE_URL ?? DEFAULT_BASE_URL;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 8_000);
  try {
    const [tickerResponse, candlesResponse] = await Promise.all([
      fetchImpl(`${baseUrl}/api/v3/ticker/24hr?symbol=${symbol}`, { cache: "no-store", signal: controller.signal }),
      fetchImpl(`${baseUrl}/api/v3/klines?symbol=${symbol}&interval=15m&limit=${CANDLE_LIMIT}`, { cache: "no-store", signal: controller.signal }),
    ]);
    if (!tickerResponse.ok || !candlesResponse.ok) throw new MarketDataError("MARKET_DATA_UNAVAILABLE");
    const [ticker, candlePayload] = await Promise.all([tickerResponse.json(), candlesResponse.json()]);
    const candles = parseCandles(candlePayload);
    const tickerObject = ticker as Record<string, unknown>;
    const currentPrice = finite(tickerObject.lastPrice ?? candles.at(-1)?.close);
    const windows = [stats(candles, 8, "2h"), stats(candles, 24, "6h"), stats(candles, 96, "24h"), stats(candles, 192, "48h")];
    const ema20Value = ema(candles.map((item) => item.close), 20);
    const ema50Value = ema(candles.map((item) => item.close), 50);
    const volatility = volatilityBps(candles.slice(-96));
    const trend48h = ((currentPrice - candles[0].close) / candles[0].close) * 10_000;
    const classification = classify({ current: currentPrice, ema20: ema20Value, ema50: ema50Value, range24h: windows[2].rangeBps, trend48h, volatility });
    const recent = candles.slice(-24);
    return marketSnapshotSchema.parse({
      symbol,
      source: "BINANCE_PUBLIC_MARKET_DATA",
      interval: "15m",
      observedAt: (options.now?.() ?? new Date()).toISOString(),
      currentPrice,
      priceChange24hPct: finite(tickerObject.priceChangePercent),
      quoteVolume24h: finite(tickerObject.quoteVolume),
      high24h: finite(tickerObject.highPrice),
      low24h: finite(tickerObject.lowPrice),
      windows,
      ema20: ema20Value,
      ema50: ema50Value,
      returnVolatilityBps: volatility,
      trend48hBps: trend48h,
      currentRange: { low: Math.min(...recent.map((item) => item.low)), high: Math.max(...recent.map((item) => item.high)) },
      supportZones: zones(candles, currentPrice, "support"),
      resistanceZones: zones(candles, currentPrice, "resistance"),
      ...classification,
      sampleSize: candles.length,
    });
  } catch (error) {
    if (error instanceof MarketDataError) throw error;
    if (error instanceof Error && error.name === "AbortError") throw new MarketDataError("MARKET_DATA_TIMEOUT");
    throw new MarketDataError("MARKET_DATA_UNAVAILABLE");
  } finally {
    clearTimeout(timeout);
  }
}
