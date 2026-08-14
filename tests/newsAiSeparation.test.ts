import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  eventUpdate: vi.fn(),
  eventUpdateMany: vi.fn(),
  analysisUpsert: vi.fn(),
  analyzeBatch: vi.fn(),
}));

vi.mock("@/lib/server/prisma", () => ({
  prisma: {
    newsEvent: { findMany: mocks.findMany, update: mocks.eventUpdate, updateMany: mocks.eventUpdateMany },
    newsAiAnalysis: { upsert: mocks.analysisUpsert },
  },
}));

vi.mock("@/lib/news/openaiNews", () => ({
  NEWS_PROMPT_VERSION: "news-events-test",
  NewsAiError: class NewsAiError extends Error {
    constructor(readonly code: string) { super(code); }
  },
  analyzeNewsBatch: mocks.analyzeBatch,
}));

import { analyzePendingNewsEvents } from "@/lib/news/newsAnalysisService";

const event = {
  id: "event-pending",
  canonicalTitle: "Evento pendente",
  category: "ETF",
  assets: ["BTC"],
  sourceConfidence: "OFICIAL",
  firstPublishedAt: new Date("2026-08-12T00:00:00Z"),
  lastPublishedAt: new Date("2026-08-12T00:00:00Z"),
  sources: [{ item: { title: "Evento pendente", excerpt: "Resumo permitido", url: "https://example.gov/event", publishedAt: new Date("2026-08-12T00:00:00Z"), source: { name: "Official", confidence: "OFICIAL" } } }],
};

describe("separate on-demand news AI analysis", () => {
  const previousKey = process.env.OPENAI_API_KEY;
  const previousBatch = process.env.NEWS_AI_BATCH_SIZE;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-key";
    process.env.NEWS_AI_BATCH_SIZE = "8";
  });

  afterEach(() => {
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = previousKey;
    if (previousBatch === undefined) delete process.env.NEWS_AI_BATCH_SIZE; else process.env.NEWS_AI_BATCH_SIZE = previousBatch;
  });

  it("selects only pending/retryable events and respects the configured batch size", async () => {
    process.env.NEWS_AI_BATCH_SIZE = "3";
    mocks.findMany.mockResolvedValue([]);

    const result = await analyzePendingNewsEvents();

    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { aiStatus: { in: ["PENDING", "ERROR"] } },
      take: 3,
    }));
    expect(mocks.analyzeBatch).not.toHaveBeenCalled();
    expect(result).toMatchObject({ analyzed: 0, calls: 0 });
  });

  it("persists token usage and does not re-send analyzed events", async () => {
    mocks.findMany.mockResolvedValueOnce([event]).mockResolvedValueOnce([]);
    mocks.analyzeBatch.mockResolvedValue({
      analyses: [{ eventId: event.id, summary: "Resumo", whyItMatters: "Contexto", affectedAssets: ["BTC"], impact: "MÉDIO", sentiment: "NEUTRO", confidence: "ALTA" }],
      model: "gpt-test",
      usage: { inputTokens: 300, outputTokens: 80, totalTokens: 380 },
    });

    const first = await analyzePendingNewsEvents();
    const second = await analyzePendingNewsEvents();

    expect(first).toMatchObject({ analyzed: 1, calls: 1, model: "gpt-test", usage: { totalTokens: 380 } });
    expect(second).toMatchObject({ analyzed: 0, calls: 0 });
    expect(mocks.analyzeBatch).toHaveBeenCalledTimes(1);
    expect(mocks.analysisUpsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ inputTokens: 300, outputTokens: 80, totalTokens: 380, model: "gpt-test" }),
    }));
    expect(mocks.eventUpdate).toHaveBeenCalledWith({ where: { id: event.id }, data: { aiStatus: "ANALYZED", aiErrorCode: null } });
  });

  it("keeps news available and retryable when OpenAI fails", async () => {
    mocks.findMany.mockResolvedValue([event]);
    mocks.analyzeBatch.mockRejectedValue(new Error("provider unavailable"));

    const result = await analyzePendingNewsEvents();

    expect(result).toMatchObject({ analyzed: 0, calls: 1, error: "NEWS_AI_UNAVAILABLE" });
    expect(mocks.eventUpdateMany).toHaveBeenCalledWith({
      where: { id: { in: [event.id] } },
      data: { aiStatus: "ERROR", aiErrorCode: "NEWS_AI_UNAVAILABLE" },
    });
  });
});
