import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import { aiNarrativeSchema, marketSnapshotSchema, radarAnalysisResultSchema, radarSymbolSchema } from "@/lib/radar-ai/contracts";
import { fetchMarketSnapshot, MarketDataError } from "@/lib/radar-ai/marketData";
import { analyzeMarketWithOpenAi, RadarAiError } from "@/lib/radar-ai/openaiAnalysis";
import { evaluateRadarUsage } from "@/lib/radar-ai/usagePolicy";
import type OpenAI from "openai";

function candleRows(count = 192) {
  const start = Date.UTC(2026, 7, 10);
  return Array.from({ length: count }, (_, index) => {
    const center = 60_000 + index * 3 + Math.sin(index / 5) * 90;
    return [start + index * 900_000, String(center - 15), String(center + 80), String(center - 80), String(center + 15), String(10 + index / 10)];
  });
}

function fetchOk() {
  return vi.fn(async (input: string | URL | Request) => {
    const url = String(input);
    if (url.includes("ticker/24hr")) {
      return new Response(JSON.stringify({ lastPrice: "60600", priceChangePercent: "1.25", quoteVolume: "900000", highPrice: "61000", lowPrice: "59500" }), { status: 200 });
    }
    return new Response(JSON.stringify(candleRows()), { status: 200 });
  });
}

async function snapshot() {
  return fetchMarketSnapshot("BTCUSDT", { fetchImpl: fetchOk() as typeof fetch, now: () => new Date("2026-08-11T12:00:00.000Z") });
}

describe("Radar IA market package", () => {
  it("accepts only the five configured assets", () => {
    expect(radarSymbolSchema.safeParse("BTCUSDT").success).toBe(true);
    expect(radarSymbolSchema.safeParse("BNBUSDT").success).toBe(false);
  });

  it("loads and preprocesses compact Binance Testnet market data", async () => {
    const result = await snapshot();
    expect(result.source).toBe("BINANCE_PUBLIC_MARKET_DATA");
    expect(result.sampleSize).toBe(192);
    expect(result.windows.map((window) => window.label)).toEqual(["2h", "6h", "24h", "48h"]);
    expect(result.supportZones.length).toBeLessThanOrEqual(2);
    expect(result.resistanceZones.length).toBeLessThanOrEqual(2);
    expect(marketSnapshotSchema.safeParse(result).success).toBe(true);
  });

  it("fails closed when Binance is unavailable", async () => {
    const fetchImpl = vi.fn(async () => new Response("blocked", { status: 451 }));
    await expect(fetchMarketSnapshot("BTCUSDT", { fetchImpl: fetchImpl as typeof fetch })).rejects.toMatchObject({ code: "MARKET_DATA_UNAVAILABLE" } satisfies Partial<MarketDataError>);
  });
});

describe("Radar IA structured OpenAI response", () => {
  it("combines validated prose with server-owned objective fields", async () => {
    const market = await snapshot();
    const client = { responses: { parse: vi.fn(async () => ({
      id: "resp_test",
      output_parsed: { factsSummary: "Preço e volume observados.", interpretation: "O cenário permanece misto.", risks: ["A amostra não prevê o futuro."], uncertainty: "A classificação pode mudar com novos candles." },
      usage: { input_tokens: 410, output_tokens: 90, total_tokens: 500 },
    })) } } as unknown as OpenAI;
    const output = await analyzeMarketWithOpenAi(market, { apiKey: "test-only", client, model: "gpt-test" });
    expect(output.result.supportZones).toEqual(market.supportZones);
    expect(output.result.regime).toBe(market.regime);
    expect(output.usage.totalTokens).toBe(500);
    expect(radarAnalysisResultSchema.safeParse(output.result).success).toBe(true);
  });

  it("rejects invalid model output", async () => {
    const client = { responses: { parse: vi.fn(async () => ({ id: "resp_bad", output_parsed: { recommendation: "BUY" } })) } } as unknown as OpenAI;
    await expect(analyzeMarketWithOpenAi(await snapshot(), { apiKey: "test-only", client })).rejects.toMatchObject({ code: "AI_INVALID_RESPONSE" } satisfies Partial<RadarAiError>);
    expect(aiNarrativeSchema.safeParse({ recommendation: "BUY" }).success).toBe(false);
  });

  it("maps an aborted request to a safe timeout", async () => {
    const timeout = Object.assign(new Error("request timed out"), { name: "AbortError" });
    const client = { responses: { parse: vi.fn(async () => { throw timeout; }) } } as unknown as OpenAI;
    await expect(analyzeMarketWithOpenAi(await snapshot(), { apiKey: "test-only", client })).rejects.toMatchObject({ code: "AI_TIMEOUT" } satisfies Partial<RadarAiError>);
  });

  it("fails without a server-side API key", async () => {
    await expect(analyzeMarketWithOpenAi(await snapshot(), { apiKey: "" })).rejects.toMatchObject({ code: "AI_UNAVAILABLE" } satisfies Partial<RadarAiError>);
  });
});

describe("Radar IA usage and route safety", () => {
  it("blocks bursts and supports a disabled or configured daily limit", () => {
    const now = new Date("2026-08-11T12:00:00Z");
    expect(evaluateRadarUsage({ now, latestCreatedAt: new Date(now.getTime() - 10_000), usedToday: 1, rateLimitSeconds: 60, dailyLimit: 0 })).toEqual({ allowed: false, code: "RADAR_AI_RATE_LIMITED" });
    expect(evaluateRadarUsage({ now, latestCreatedAt: null, usedToday: 20, rateLimitSeconds: 60, dailyLimit: 20 })).toEqual({ allowed: false, code: "RADAR_AI_DAILY_LIMIT_REACHED" });
    expect(evaluateRadarUsage({ now, latestCreatedAt: null, usedToday: 999, rateLimitSeconds: 60, dailyLimit: 0 })).toEqual({ allowed: true });
  });

  it("protects reads and mutations and exposes no trading imports", async () => {
    const marketRoute = await readFile("app/api/radar-ia/market/route.ts", "utf8");
    const analysisRoute = await readFile("app/api/radar-ia/analyses/route.ts", "utf8");
    expect(marketRoute).toContain("requireApiAuth");
    expect(analysisRoute).toContain("requireMutationAuth");
    expect(`${marketRoute}\n${analysisRoute}`).not.toMatch(/executionService|manualTestnet|exchangeFactory|\.order\(|BUY|SELL/);
  });

  it("keeps responsive desktop/mobile rules and interactive selector in the dedicated route", async () => {
    const [page, client, css] = await Promise.all([
      readFile("app/radar-ia/page.tsx", "utf8"),
      readFile("components/radar-ai/RadarAiClient.tsx", "utf8"),
      readFile("app/globals.css", "utf8"),
    ]);
    expect(page).toContain("RadarAiClient");
    expect(client).toContain("RADAR_SYMBOLS.map");
    expect(client).toContain("setSymbol(asset)");
    expect(css).toContain("@media (max-width: 560px)");
    expect(css).toContain(".rc-radar-report-grid");
  });
});
