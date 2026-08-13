import { prisma } from "@/lib/server/prisma";
import type { NewsItem } from "@prisma/client";
import { fetchNewsSource } from "./feedCollector";
import { isSameEvent, sourceConfidence } from "./normalize";
import { NEWS_SOURCES } from "./sources";
import { evaluateNewsRefresh } from "./refreshPolicy";

function refreshMinutes(): number {
  const value = Number(process.env.NEWS_REFRESH_MINUTES ?? 30);
  return Number.isInteger(value) && value >= 5 && value <= 1_440 ? value : 30;
}

export class NewsRefreshError extends Error {
  constructor(readonly code: "NEWS_REFRESH_RATE_LIMITED") { super(code); }
}

type EventCache = Awaited<ReturnType<typeof loadEventCache>>;

function loadEventCache() {
  return prisma.newsEvent.findMany({
    where: { lastPublishedAt: { gte: new Date(Date.now() - 32 * 86_400_000) } },
    include: { sources: { include: { item: { include: { source: { select: { id: true, tier: true } } } } } } },
    orderBy: { lastPublishedAt: "desc" },
    take: 500,
  });
}

async function ingestItem(sourceId: string, item: Awaited<ReturnType<typeof fetchNewsSource>>[number], events: EventCache, existingItem?: NewsItem) {
  const wasInserted = !existingItem;
  const newsItem = existingItem ?? await prisma.newsItem.create({
    data: {
      sourceId,
      externalId: item.externalId,
      title: item.title,
      normalizedTitle: item.normalizedTitle,
      url: item.url,
      excerpt: item.excerpt,
      publishedAt: item.publishedAt,
      assets: item.assets,
      category: item.category,
      contentHash: item.contentHash,
    },
  });
  const match = events.find((event) => isSameEvent(item, event));
  if (!match) {
    const event = await prisma.newsEvent.create({
      data: {
        canonicalTitle: item.title,
        normalizedTitle: item.normalizedTitle,
        category: item.category,
        assets: item.assets,
        firstPublishedAt: item.publishedAt,
        lastPublishedAt: item.publishedAt,
        sourceConfidence: sourceConfidence([item.sourceTier]),
        normalizedSummary: item.excerpt,
        sources: { create: { itemId: newsItem.id } },
      },
    });
    events.unshift({ ...event, sources: [{ id: `pending-${newsItem.id}`, eventId: event.id, itemId: newsItem.id, createdAt: new Date(), item: { ...newsItem, source: { id: sourceId, tier: item.sourceTier } } }] });
    return { inserted: wasInserted, eventId: event.id };
  }
  const tiers = [...match.sources.map((entry) => entry.item.source.tier), item.sourceTier];
  const distinctSourceIds = new Set(match.sources.map((entry) => entry.item.source.id));
  distinctSourceIds.add(sourceId);
  const assets = [...new Set([...match.assets, ...item.assets])];
  await prisma.newsEvent.update({
    where: { id: match.id },
    data: {
      assets,
      sourceCount: distinctSourceIds.size,
      sourceConfidence: sourceConfidence(tiers),
      firstPublishedAt: item.publishedAt < match.firstPublishedAt ? item.publishedAt : match.firstPublishedAt,
      lastPublishedAt: item.publishedAt > match.lastPublishedAt ? item.publishedAt : match.lastPublishedAt,
      aiStatus: "PENDING",
      aiErrorCode: null,
      sources: { create: { itemId: newsItem.id } },
    },
  });
  match.assets = assets;
  match.sourceCount = distinctSourceIds.size;
  match.sourceConfidence = sourceConfidence(tiers);
  match.firstPublishedAt = item.publishedAt < match.firstPublishedAt ? item.publishedAt : match.firstPublishedAt;
  match.lastPublishedAt = item.publishedAt > match.lastPublishedAt ? item.publishedAt : match.lastPublishedAt;
  match.sources.push({ id: `pending-${newsItem.id}`, eventId: match.id, itemId: newsItem.id, createdAt: new Date(), item: { ...newsItem, source: { id: sourceId, tier: item.sourceTier } } });
  return { inserted: wasInserted, eventId: match.id };
}

export async function collectNews(options: { force?: boolean; fetchImpl?: typeof fetch } = {}) {
  const latest = await prisma.newsSource.findFirst({ where: { lastFetchedAt: { not: null } }, orderBy: { lastFetchedAt: "desc" }, select: { lastFetchedAt: true } });
  const refresh = evaluateNewsRefresh({ now: new Date(), lastFetchedAt: latest?.lastFetchedAt ?? null, refreshMinutes: refreshMinutes() });
  if (!options.force && !refresh.allowed) throw new NewsRefreshError("NEWS_REFRESH_RATE_LIMITED");

  const sourceResults: Array<{ key: string; ok: boolean; count: number; error: string | null }> = [];
  const eventIds = new Set<string>();
  let inserted = 0;
  const registered = await Promise.all(NEWS_SOURCES.map(async (definition) => ({
    definition,
    source: await prisma.newsSource.upsert({
      where: { key: definition.key },
      create: { key: definition.key, name: definition.name, feedUrl: definition.feedUrl, homepageUrl: definition.homepageUrl, tier: definition.tier, confidence: definition.confidence },
      update: { name: definition.name, feedUrl: definition.feedUrl, homepageUrl: definition.homepageUrl, tier: definition.tier, confidence: definition.confidence, enabled: true },
    }),
  })));
  const batches = await Promise.all(registered.map(async ({ definition, source }) => {
    try {
      const items = await fetchNewsSource(definition, { fetchImpl: options.fetchImpl });
      await prisma.newsSource.update({ where: { id: source.id }, data: { lastFetchedAt: new Date(), lastSuccessAt: new Date(), lastError: null } });
      sourceResults.push({ key: definition.key, ok: true, count: items.length, error: null });
      return items.map((item) => ({ sourceId: source.id, item }));
    } catch (error) {
      const code = error instanceof Error ? error.message.slice(0, 80) : "SOURCE_UNAVAILABLE";
      await prisma.newsSource.update({ where: { id: source.id }, data: { lastFetchedAt: new Date(), lastError: code } });
      sourceResults.push({ key: definition.key, ok: false, count: 0, error: code });
      return [];
    }
  }));
  const candidates = batches.flat().sort((left, right) => left.item.publishedAt.getTime() - right.item.publishedAt.getTime());
  const existing = new Map((await prisma.newsItem.findMany({ where: { url: { in: candidates.map(({ item }) => item.url) } }, include: { eventLink: { select: { id: true } } } })).map((item) => [item.url, item]));
  const events = await loadEventCache();
  for (const candidate of candidates) {
    const known = existing.get(candidate.item.url);
    if (known?.eventLink) continue;
    const result = await ingestItem(known?.sourceId ?? candidate.sourceId, candidate.item, events, known);
    if (result.inserted) inserted += 1;
    if (result.eventId) eventIds.add(result.eventId);
  }
  return { inserted, eventIds: [...eventIds], sources: sourceResults, refreshMinutes: refreshMinutes() };
}

export async function listNewsEvents(filters: { period: "24h" | "7d" | "30d"; asset?: string; impact?: string; category?: string }) {
  const periodMs = filters.period === "24h" ? 86_400_000 : filters.period === "7d" ? 7 * 86_400_000 : 30 * 86_400_000;
  const events = await prisma.newsEvent.findMany({
    where: {
      lastPublishedAt: { gte: new Date(Date.now() - periodMs) },
      ...(filters.asset ? { assets: { has: filters.asset } } : {}),
      ...(filters.category ? { category: filters.category } : {}),
      ...(filters.impact ? { aiAnalysis: { is: { impact: filters.impact } } } : {}),
    },
    include: { aiAnalysis: true, sources: { include: { item: { include: { source: true } } }, orderBy: { item: { publishedAt: "desc" } } } },
    orderBy: { lastPublishedAt: "desc" },
    take: 100,
  });
  const sources = await prisma.newsSource.findMany({ orderBy: { tier: "asc" } });
  return { events, sources, refreshMinutes: refreshMinutes() };
}
