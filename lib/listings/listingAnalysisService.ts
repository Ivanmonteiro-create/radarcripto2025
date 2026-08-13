import { prisma } from "@/lib/server/prisma";
import { analyzeListingBatch, ListingAiError, LISTINGS_PROMPT_VERSION } from "./openaiListings";

function batchSize() {
  const value = Number(process.env.LISTINGS_AI_BATCH_SIZE ?? 8);
  return Number.isInteger(value) && value >= 1 && value <= 10 ? value : 8;
}

export async function analyzePendingListingEvents() {
  if (!process.env.OPENAI_API_KEY) return { configured: false, analyzed: 0, calls: 0, usage: null };
  const events = await prisma.listingEvent.findMany({ where: { aiStatus: { in: ["PENDING", "ERROR"] } }, include: { sources: { include: { source: true } } }, orderBy: { announcedAt: "desc" }, take: batchSize() });
  if (!events.length) return { configured: true, analyzed: 0, calls: 0, usage: null };
  try {
    const output = await analyzeListingBatch(events.map((event) => ({ id: event.id, exchange: event.exchange, asset: event.asset, symbol: event.symbol, title: event.title, type: event.type, confirmation: event.confirmation, announcedAt: event.announcedAt, tradingStartsAt: event.tradingStartsAt, pairs: event.pairs, sources: event.sources.map((entry) => ({ name: entry.source.name, url: entry.url, excerpt: entry.excerpt })) })));
    for (const [index, analysis] of output.analyses.entries()) {
      await prisma.listingAiAnalysis.upsert({ where: { eventId: analysis.eventId }, create: { eventId: analysis.eventId, summary: analysis.summary, explanation: analysis.explanation, impact: analysis.impact, confidence: analysis.confidence, model: output.model, promptVersion: LISTINGS_PROMPT_VERSION, inputTokens: index === 0 ? output.usage.inputTokens : null, outputTokens: index === 0 ? output.usage.outputTokens : null, totalTokens: index === 0 ? output.usage.totalTokens : null }, update: { summary: analysis.summary, explanation: analysis.explanation, impact: analysis.impact, confidence: analysis.confidence, model: output.model, promptVersion: LISTINGS_PROMPT_VERSION, inputTokens: index === 0 ? output.usage.inputTokens : null, outputTokens: index === 0 ? output.usage.outputTokens : null, totalTokens: index === 0 ? output.usage.totalTokens : null } });
      await prisma.listingEvent.update({ where: { id: analysis.eventId }, data: { aiStatus: "ANALYZED", aiErrorCode: null } });
    }
    return { configured: true, analyzed: output.analyses.length, calls: 1, usage: output.usage, model: output.model };
  } catch (error) {
    const code = error instanceof ListingAiError ? error.code : "LISTINGS_AI_UNAVAILABLE";
    await prisma.listingEvent.updateMany({ where: { id: { in: events.map((event) => event.id) } }, data: { aiStatus: "ERROR", aiErrorCode: code } });
    return { configured: true, analyzed: 0, calls: 1, usage: null, error: code };
  }
}
