import { prisma } from "@/lib/server/prisma";
import { analyzeNewsBatch, NEWS_PROMPT_VERSION, NewsAiError } from "./openaiNews";

function batchSize(): number {
  const value = Number(process.env.NEWS_AI_BATCH_SIZE ?? 8);
  return Number.isInteger(value) && value >= 1 && value <= 10 ? value : 8;
}

export async function analyzePendingNewsEvents(eventIds?: string[]) {
  if (!process.env.OPENAI_API_KEY) return { configured: false, analyzed: 0, calls: 0, usage: null };
  const events = await prisma.newsEvent.findMany({
    where: { aiStatus: { in: ["PENDING", "ERROR"] }, ...(eventIds?.length ? { id: { in: eventIds } } : {}) },
    include: { sources: { include: { item: { include: { source: true } } } } },
    orderBy: { lastPublishedAt: "desc" },
    take: batchSize(),
  });
  if (!events.length) return { configured: true, analyzed: 0, calls: 0, usage: null };
  try {
    const output = await analyzeNewsBatch(events.map((event) => ({
      id: event.id,
      title: event.canonicalTitle,
      category: event.category,
      assets: event.assets,
      sourceConfidence: event.sourceConfidence,
      firstPublishedAt: event.firstPublishedAt,
      sources: event.sources.map(({ item }) => ({ name: item.source.name, confidence: item.source.confidence, title: item.title, excerpt: item.excerpt, url: item.url, publishedAt: item.publishedAt })),
    })));
    for (const [index, analysis] of output.analyses.entries()) {
      await prisma.newsAiAnalysis.upsert({
        where: { eventId: analysis.eventId },
        create: {
          eventId: analysis.eventId,
          summary: analysis.summary,
          whyItMatters: analysis.whyItMatters,
          affectedAssets: analysis.affectedAssets,
          impact: analysis.impact,
          sentiment: analysis.sentiment,
          confidence: analysis.confidence,
          model: output.model,
          promptVersion: NEWS_PROMPT_VERSION,
          inputTokens: index === 0 ? output.usage.inputTokens : null,
          outputTokens: index === 0 ? output.usage.outputTokens : null,
          totalTokens: index === 0 ? output.usage.totalTokens : null,
        },
        update: {
          summary: analysis.summary,
          whyItMatters: analysis.whyItMatters,
          affectedAssets: analysis.affectedAssets,
          impact: analysis.impact,
          sentiment: analysis.sentiment,
          confidence: analysis.confidence,
          model: output.model,
          promptVersion: NEWS_PROMPT_VERSION,
          inputTokens: index === 0 ? output.usage.inputTokens : null,
          outputTokens: index === 0 ? output.usage.outputTokens : null,
          totalTokens: index === 0 ? output.usage.totalTokens : null,
        },
      });
      await prisma.newsEvent.update({ where: { id: analysis.eventId }, data: { aiStatus: "ANALYZED", aiErrorCode: null } });
    }
    return { configured: true, analyzed: output.analyses.length, calls: 1, usage: output.usage, model: output.model };
  } catch (error) {
    const code = error instanceof NewsAiError ? error.code : "NEWS_AI_UNAVAILABLE";
    await prisma.newsEvent.updateMany({ where: { id: { in: events.map((event) => event.id) } }, data: { aiStatus: "ERROR", aiErrorCode: code } });
    return { configured: true, analyzed: 0, calls: 1, usage: null, error: code };
  }
}
