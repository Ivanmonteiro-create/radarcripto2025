import { z } from "zod";

export const RADAR_SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "ADAUSDT", "LINKUSDT"] as const;
export const radarSymbolSchema = z.enum(RADAR_SYMBOLS);
export type RadarSymbol = z.infer<typeof radarSymbolSchema>;

export const marketRegimeSchema = z.enum([
  "LATERAL",
  "TENDÊNCIA DE ALTA",
  "TENDÊNCIA DE BAIXA",
  "VOLATILIDADE ELEVADA",
  "VOLATILIDADE BAIXA",
  "INDEFINIDO",
]);
export const confidenceSchema = z.enum(["BAIXA", "MÉDIA", "ALTA"]);
export const suitabilitySchema = z.enum(["BAIXA", "MÉDIA", "ALTA"]);

export const priceZoneSchema = z.object({
  low: z.number().positive(),
  high: z.number().positive(),
  touches: z.number().int().positive(),
  lastSeenAt: z.string().datetime(),
});

export const windowStatsSchema = z.object({
  label: z.string(),
  high: z.number().positive(),
  low: z.number().positive(),
  changePct: z.number(),
  rangeBps: z.number().nonnegative(),
  volume: z.number().nonnegative(),
});

export const marketSnapshotSchema = z.object({
  symbol: radarSymbolSchema,
  source: z.literal("BINANCE_PUBLIC_MARKET_DATA"),
  interval: z.literal("15m"),
  observedAt: z.string().datetime(),
  currentPrice: z.number().positive(),
  priceChange24hPct: z.number(),
  quoteVolume24h: z.number().nonnegative(),
  high24h: z.number().positive(),
  low24h: z.number().positive(),
  windows: z.array(windowStatsSchema),
  ema20: z.number().positive(),
  ema50: z.number().positive(),
  returnVolatilityBps: z.number().nonnegative(),
  trend48hBps: z.number(),
  currentRange: z.object({ low: z.number().positive(), high: z.number().positive() }),
  supportZones: z.array(priceZoneSchema).max(2),
  resistanceZones: z.array(priceZoneSchema).max(2),
  regime: marketRegimeSchema,
  confidence: confidenceSchema,
  rangeSuitability: suitabilitySchema,
  trendSuitability: suitabilitySchema,
  sampleSize: z.number().int().positive(),
});
export type MarketSnapshot = z.infer<typeof marketSnapshotSchema>;

export const aiNarrativeSchema = z.object({
  factsSummary: z.string().min(1).max(700),
  interpretation: z.string().min(1).max(1_200),
  risks: z.array(z.string().min(1).max(300)).min(1).max(5),
  uncertainty: z.string().min(1).max(500),
});
export type AiNarrative = z.infer<typeof aiNarrativeSchema>;

export const radarAnalysisResultSchema = z.object({
  asset: radarSymbolSchema,
  regime: marketRegimeSchema,
  confidence: confidenceSchema,
  supportZones: z.array(priceZoneSchema).max(2),
  resistanceZones: z.array(priceZoneSchema).max(2),
  currentRange: z.object({ low: z.number().positive(), high: z.number().positive() }),
  volatility: z.object({ bps: z.number().nonnegative(), summary: z.string() }),
  marketReading: z.string(),
  factsSummary: z.string(),
  rangeSuitability: suitabilitySchema,
  trendSuitability: suitabilitySchema,
  risks: z.array(z.string()),
  observation: z.string(),
  disclaimer: z.string(),
});
export type RadarAnalysisResult = z.infer<typeof radarAnalysisResultSchema>;

export const createRadarAnalysisSchema = z.object({ symbol: radarSymbolSchema });

export type RadarAnalysisRecord = {
  id: string;
  symbol: string;
  status: string;
  price: number | string | { toString(): string };
  marketDataSource: string;
  marketSnapshot: unknown;
  result: unknown;
  promptVersion: string;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  estimatedCostUsd: number | string | { toString(): string } | null;
  errorCode: string | null;
  createdAt: Date;
};

export function serializeAnalysis(record: RadarAnalysisRecord) {
  return {
    ...record,
    price: Number(record.price),
    estimatedCostUsd: record.estimatedCostUsd == null ? null : Number(record.estimatedCostUsd),
    createdAt: record.createdAt.toISOString(),
  };
}
