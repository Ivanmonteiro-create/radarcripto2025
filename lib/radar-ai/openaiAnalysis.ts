import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { aiNarrativeSchema, radarAnalysisResultSchema, type MarketSnapshot } from "./contracts";
import type { Locale } from "@/lib/i18n/config";

export const RADAR_PROMPT_VERSION = "market-radar-v1";
export const DEFAULT_RADAR_MODEL = "gpt-5.6";
export const RADAR_DISCLAIMER = "Leitura informativa baseada apenas nos dados de mercado fornecidos. Não é recomendação de compra ou venda, nem garantia de resultado.";
const disclaimers: Record<Locale, string> = {
  pt: RADAR_DISCLAIMER,
  en: "Informational reading based only on the supplied market data. It is not a recommendation to buy or sell, nor a guarantee of results.",
  es: "Lectura informativa basada únicamente en los datos de mercado facilitados. No es una recomendación de compra o venta ni garantiza resultados.",
};

export const RADAR_SYSTEM_PROMPT = `Você é a camada consultiva Radar IA do RadarCrypto.
Use somente os fatos presentes no pacote de mercado fornecido.
Separe fatos objetivos de interpretação e destaque a incerteza.
Não invente preços, métricas, suportes ou resistências.
As zonas, regime, confiança e adequação de estratégia já foram calculados pelo servidor e não podem ser redefinidos.
Não recomende comprar, vender, abrir, fechar ou dimensionar posição.
Não prometa direção futura, lucro ou precisão.
Não mencione notícias, fundamentos ou eventos externos, pois eles não foram fornecidos.
Responda em português claro, conciso e estritamente no schema solicitado.`;

export type AiUsage = { inputTokens: number | null; outputTokens: number | null; totalTokens: number | null };
export type AiAnalysisOutput = {
  responseId: string | null;
  model: string;
  result: ReturnType<typeof radarAnalysisResultSchema.parse>;
  usage: AiUsage;
};

export class RadarAiError extends Error {
  constructor(readonly code: "AI_TIMEOUT" | "AI_RATE_LIMITED" | "AI_INVALID_RESPONSE" | "AI_UNAVAILABLE") {
    super(code);
  }
}

function compactInput(snapshot: MarketSnapshot) {
  return {
    objectiveDataOnly: true,
    asset: snapshot.symbol,
    source: snapshot.source,
    candleInterval: snapshot.interval,
    observedAt: snapshot.observedAt,
    currentPrice: snapshot.currentPrice,
    change24hPct: snapshot.priceChange24hPct,
    quoteVolume24h: snapshot.quoteVolume24h,
    high24h: snapshot.high24h,
    low24h: snapshot.low24h,
    windows: snapshot.windows,
    indicators: {
      ema20: snapshot.ema20,
      ema50: snapshot.ema50,
      returnVolatilityBps: snapshot.returnVolatilityBps,
      trend48hBps: snapshot.trend48hBps,
    },
    serverClassification: {
      regime: snapshot.regime,
      confidence: snapshot.confidence,
      rangeSuitability: snapshot.rangeSuitability,
      trendSuitability: snapshot.trendSuitability,
    },
    objectiveZones: {
      support: snapshot.supportZones,
      resistance: snapshot.resistanceZones,
      currentRange: snapshot.currentRange,
    },
  };
}

function errorStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("status" in error)) return undefined;
  return typeof error.status === "number" ? error.status : undefined;
}

export function normalizeRadarAiError(error: unknown): RadarAiError {
  if (error instanceof RadarAiError) return error;
  if (error instanceof Error && (error.name === "AbortError" || error.message.toLowerCase().includes("timed out"))) {
    return new RadarAiError("AI_TIMEOUT");
  }
  if (errorStatus(error) === 429) return new RadarAiError("AI_RATE_LIMITED");
  return new RadarAiError("AI_UNAVAILABLE");
}

export async function analyzeMarketWithOpenAi(
  snapshot: MarketSnapshot,
  options: { apiKey?: string; model?: string; timeoutMs?: number; client?: OpenAI; locale?: Locale } = {},
): Promise<AiAnalysisOutput> {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey && !options.client) throw new RadarAiError("AI_UNAVAILABLE");
  const model = options.model ?? process.env.OPENAI_RADAR_MODEL ?? DEFAULT_RADAR_MODEL;
  const client = options.client ?? new OpenAI({ apiKey });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? Number(process.env.RADAR_AI_TIMEOUT_MS ?? 20_000));
  try {
    const locale = options.locale ?? "pt";
    const language = locale === "en" ? "English" : locale === "es" ? "Spanish" : "Portuguese";
    const response = await client.responses.parse({
      model,
      reasoning: { effort: "low" },
      input: [
        { role: "system", content: `${RADAR_SYSTEM_PROMPT}\nReturn all narrative fields in ${language}.` },
        { role: "user", content: JSON.stringify(compactInput(snapshot)) },
      ],
      text: { format: zodTextFormat(aiNarrativeSchema, "radar_market_narrative") },
      max_output_tokens: 1_200,
    }, { signal: controller.signal });
    if (!response.output_parsed) throw new RadarAiError("AI_INVALID_RESPONSE");
    const narrative = aiNarrativeSchema.parse(response.output_parsed);
    const result = radarAnalysisResultSchema.parse({
      asset: snapshot.symbol,
      regime: snapshot.regime,
      confidence: snapshot.confidence,
      supportZones: snapshot.supportZones,
      resistanceZones: snapshot.resistanceZones,
      currentRange: snapshot.currentRange,
      volatility: {
        bps: snapshot.returnVolatilityBps,
        summary: locale === "en" ? `Standard deviation of 15-minute candle returns: ${snapshot.returnVolatilityBps.toFixed(2)} bps.` : locale === "es" ? `Desviación estándar de los retornos de velas de 15 minutos: ${snapshot.returnVolatilityBps.toFixed(2)} bps.` : `Desvio-padrão dos retornos de candles de 15 min: ${snapshot.returnVolatilityBps.toFixed(2)} bps.`,
      },
      marketReading: narrative.interpretation,
      factsSummary: narrative.factsSummary,
      rangeSuitability: snapshot.rangeSuitability,
      trendSuitability: snapshot.trendSuitability,
      risks: narrative.risks,
      observation: narrative.uncertainty,
      disclaimer: disclaimers[locale],
    });
    return {
      responseId: response.id ?? null,
      model,
      result,
      usage: {
        inputTokens: response.usage?.input_tokens ?? null,
        outputTokens: response.usage?.output_tokens ?? null,
        totalTokens: response.usage?.total_tokens ?? null,
      },
    };
  } catch (error) {
    if (error instanceof RadarAiError) throw error;
    if (error instanceof Error && error.name === "ZodError") throw new RadarAiError("AI_INVALID_RESPONSE");
    throw normalizeRadarAiError(error);
  } finally {
    clearTimeout(timeout);
  }
}
