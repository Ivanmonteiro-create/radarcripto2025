import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import type OpenAI from "openai";
import { fetchNewsSource, NewsSourceError } from "@/lib/news/feedCollector";
import { analyzeNewsBatch, NewsAiError } from "@/lib/news/openaiNews";
import { newsRefreshSchema } from "@/lib/news/contracts";
import { classifyCategory, createNormalizedItem, extractAssets, isSameEvent, normalizeTitle, sourceConfidence } from "@/lib/news/normalize";
import { evaluateNewsRefresh } from "@/lib/news/refreshPolicy";
import { isSafeNewsUrl, NEWS_SOURCES } from "@/lib/news/sources";

const SOURCE = NEWS_SOURCES[2];

function rss() {
  return `<?xml version="1.0"?><rss><channel><item><guid>btc-1</guid><title>SEC approves a Bitcoin ETF product</title><link>https://www.coindesk.com/markets/2026/08/12/bitcoin-etf/</link><description>Bitcoin ETF receives regulatory approval.</description><pubDate>Wed, 12 Aug 2026 00:10:00 GMT</pubDate></item></channel></rss>`;
}

describe("news collection and normalization", () => {
  it("parses authorized RSS metadata without storing full articles", async () => {
    const fetchImpl = vi.fn(async () => new Response(rss(), { status: 200, headers: { "content-type": "application/rss+xml" } }));
    const items = await fetchNewsSource(SOURCE, { fetchImpl: fetchImpl as typeof fetch, now: () => new Date("2026-08-12T01:00:00Z") });
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ assets: ["BTC"], category: "ETF", sourceKey: "coindesk" });
    expect(items[0].excerpt?.length).toBeLessThanOrEqual(600);
  });

  it("isolates an unavailable source", async () => {
    const fetchImpl = vi.fn(async () => new Response("down", { status: 503 }));
    await expect(fetchNewsSource(SOURCE, { fetchImpl: fetchImpl as typeof fetch })).rejects.toMatchObject({ code: "SOURCE_UNAVAILABLE" } satisfies Partial<NewsSourceError>);
  });

  it("classifies assets and categories deterministically", () => {
    expect(extractAssets("Bitcoin and Ethereum institutional adoption")).toEqual(["BTC", "ETH"]);
    expect(classifyCategory("Protocol suffers hack and security incident")).toBe("SEGURANÇA");
    expect(classifyCategory("Federal Reserve FOMC interest rate decision")).toBe("MACROECONOMIA");
    expect(normalizeTitle("The SEC Approves Bitcoin ETF!")).toBe("sec approve bitcoin etf");
  });

  it("deduplicates similar reports in the same asset/category/time window", () => {
    const item = createNormalizedItem({ source: SOURCE, title: "Company announces purchase of 5,000 Bitcoin", url: "https://www.coindesk.com/a", excerpt: "", publishedAt: new Date("2026-08-12T00:00:00Z") });
    expect(isSameEvent(item, { normalizedTitle: normalizeTitle("Company buys 5,000 Bitcoin in announced purchase"), assets: ["BTC"], category: item.category, lastPublishedAt: new Date("2026-08-12T02:00:00Z") })).toBe(true);
    expect(isSameEvent(item, { normalizedTitle: "solana network upgrade", assets: ["SOL"], category: "REDE", lastPublishedAt: new Date("2026-08-12T02:00:00Z") })).toBe(false);
    expect(sourceConfidence([3])).toBe("NÃO CONFIRMADO");
    expect(sourceConfidence([3, 1])).toBe("OFICIAL");
  });

  it("accepts only HTTPS links from the source allowlist", () => {
    expect(isSafeNewsUrl("https://www.coindesk.com/markets/test", SOURCE.allowedHosts)).toBe(true);
    expect(isSafeNewsUrl("http://www.coindesk.com/markets/test", SOURCE.allowedHosts)).toBe(false);
    expect(isSafeNewsUrl("https://evil.example/redirect", SOURCE.allowedHosts)).toBe(false);
  });
});

describe("news AI batch", () => {
  const events = [{ id: "event-1", title: "Bitcoin ETF update", category: "ETF", assets: ["BTC"], sourceConfidence: "OFICIAL", firstPublishedAt: new Date("2026-08-12T00:00:00Z"), sources: [{ name: "Official", confidence: "OFICIAL", title: "Bitcoin ETF update", excerpt: "Approved filing", url: "https://example.gov/item", publishedAt: new Date("2026-08-12T00:00:00Z") }] }];

  it("validates a structured batch and records aggregate token usage", async () => {
    const client = { responses: { parse: vi.fn(async () => ({ output_parsed: { analyses: [{ eventId: "event-1", summary: "Resumo factual.", whyItMatters: "Altera o contexto regulatório.", affectedAssets: ["BTC"], impact: "ALTO", sentiment: "MISTO", confidence: "ALTA" }] }, usage: { input_tokens: 300, output_tokens: 80, total_tokens: 380 } })) } } as unknown as OpenAI;
    const result = await analyzeNewsBatch(events, { apiKey: "test", client, model: "gpt-test" });
    expect(result.analyses[0].impact).toBe("ALTO");
    expect(result.usage.totalTokens).toBe(380);
  });

  it("rejects missing or invented event ids", async () => {
    const client = { responses: { parse: vi.fn(async () => ({ output_parsed: { analyses: [{ eventId: "invented", summary: "x", whyItMatters: "y", affectedAssets: ["BTC"], impact: "BAIXO", sentiment: "NEUTRO", confidence: "BAIXA" }] } })) } } as unknown as OpenAI;
    await expect(analyzeNewsBatch(events, { apiKey: "test", client })).rejects.toMatchObject({ code: "NEWS_AI_INVALID_RESPONSE" } satisfies Partial<NewsAiError>);
  });

  it("remains available without OpenAI", async () => {
    await expect(analyzeNewsBatch(events, { apiKey: "" })).rejects.toMatchObject({ code: "NEWS_AI_UNAVAILABLE" } satisfies Partial<NewsAiError>);
  });
});

describe("news module safety and UI", () => {
  it("enforces a conservative refresh interval", () => {
    const now = new Date("2026-08-12T01:00:00Z");
    expect(evaluateNewsRefresh({ now, lastFetchedAt: new Date("2026-08-12T00:50:00Z"), refreshMinutes: 30 }).allowed).toBe(false);
    expect(evaluateNewsRefresh({ now, lastFetchedAt: new Date("2026-08-12T00:20:00Z"), refreshMinutes: 30 }).allowed).toBe(true);
  });

  it("requires the RSS refresh flow to explicitly disable AI", () => {
    expect(newsRefreshSchema.parse({ analyzeWithAi: false })).toEqual({ analyzeWithAi: false });
    expect(newsRefreshSchema.parse({})).toEqual({ analyzeWithAi: false });
    expect(newsRefreshSchema.safeParse({ analyzeWithAi: true }).success).toBe(false);
  });

  it("protects routes and imports no trading execution modules", async () => {
    const files = await Promise.all([readFile("app/api/noticias/events/route.ts", "utf8"), readFile("app/api/noticias/refresh/route.ts", "utf8"), readFile("app/api/noticias/analyze/route.ts", "utf8"), readFile("lib/news/newsService.ts", "utf8")]);
    expect(files[0]).toContain("requireApiAuth");
    expect(files[1]).toContain("requireMutationAuth");
    expect(files[1]).not.toMatch(/openai|analyzePendingNewsEvents/i);
    expect(files[2]).toContain("analyzePendingNewsEvents");
    expect(files.join("\n")).not.toMatch(/executionService|manualTestnet|exchangeFactory|placeOrder|cancelOrder/);
  });

  it("provides persistence, filters, history, and responsive desktop/mobile UI", async () => {
    const [schema, client, css] = await Promise.all([readFile("prisma/schema.prisma", "utf8"), readFile("components/news/NewsRadarClient.tsx", "utf8"), readFile("app/globals.css", "utf8")]);
    for (const model of ["NewsSource", "NewsItem", "NewsEvent", "NewsEventSource", "NewsAiAnalysis"]) expect(schema).toContain(`model ${model}`);
    expect(client).toContain("NEWS_CATEGORIES.map");
    expect(client).toContain("JSON.stringify({ analyzeWithAi: false })");
    expect(client).toContain('t("news.analyze")');
    expect(client).toContain('t("news.aiCost")');
    expect(client).toContain('t("status.aiError")');
    expect(client).toContain('t("status.analyzed")');
    expect(client).toContain("target=\"_blank\"");
    expect(css).toContain(".rc-news-analysis");
    expect(css).toContain("@media (max-width: 560px)");
  });
});
