import { prisma } from "@/lib/server/prisma";
import { fetchListingAnnouncements } from "./announcementCollector";
import { deriveListingStatus, normalizeListingTitle } from "./normalize";
import { fetchPublicMarkets } from "./publicMarkets";
import { evaluateListingsRefresh } from "./refreshPolicy";
import { LISTING_SOURCES } from "./sources";

function refreshMinutes() {
  const value = Number(process.env.LISTINGS_REFRESH_MINUTES ?? 30);
  return Number.isInteger(value) && value >= 5 && value <= 1_440 ? value : 30;
}

export class ListingsRefreshError extends Error {
  constructor(readonly code: "LISTINGS_REFRESH_RATE_LIMITED") { super(code); }
}

function similarity(left: string, right: string) {
  const a = new Set(left.split(" ")), b = new Set(right.split(" "));
  const intersection = [...a].filter((word) => b.has(word)).length;
  return intersection / new Set([...a, ...b]).size;
}

export async function collectListings(options: { force?: boolean; fetchImpl?: typeof fetch } = {}) {
  const latest = await prisma.listingSource.findFirst({ where: { lastFetchedAt: { not: null } }, orderBy: { lastFetchedAt: "desc" }, select: { lastFetchedAt: true } });
  if (!options.force && !evaluateListingsRefresh({ now: new Date(), lastFetchedAt: latest?.lastFetchedAt ?? null, refreshMinutes: refreshMinutes() }).allowed) throw new ListingsRefreshError("LISTINGS_REFRESH_RATE_LIMITED");

  const fetchImpl = options.fetchImpl ?? fetch;
  const registered = await Promise.all(LISTING_SOURCES.map(async (definition) => ({ definition, source: await prisma.listingSource.upsert({
    where: { key: definition.key },
    create: { key: definition.key, exchange: definition.exchange, name: definition.name, endpointUrl: definition.endpointUrl, homepageUrl: definition.homepageUrl },
    update: { name: definition.name, endpointUrl: definition.endpointUrl, homepageUrl: definition.homepageUrl, enabled: true },
  }) })));
  const sourceResults: Array<{ key: string; exchange: string; ok: boolean; count: number; error: string | null }> = [];
  const batches = await Promise.all(registered.map(async ({ definition, source }) => {
    try {
      const announcements = await fetchListingAnnouncements(definition, fetchImpl);
      const now = new Date();
      await prisma.listingSource.update({ where: { id: source.id }, data: { lastFetchedAt: now, lastSuccessAt: now, lastError: null } });
      sourceResults.push({ key: definition.key, exchange: definition.exchange, ok: true, count: announcements.length, error: null });
      return announcements.map((announcement) => ({ announcement, sourceId: source.id }));
    } catch (error) {
      const code = error instanceof Error ? error.message.slice(0, 80) : "SOURCE_UNAVAILABLE";
      await prisma.listingSource.update({ where: { id: source.id }, data: { lastFetchedAt: new Date(), lastError: code } });
      sourceResults.push({ key: definition.key, exchange: definition.exchange, ok: false, count: 0, error: code });
      return [];
    }
  }));
  const candidates = batches.flat().sort((a, b) => a.announcement.announcedAt.getTime() - b.announcement.announcedAt.getTime());
  const recent = await prisma.listingEvent.findMany({ where: { announcedAt: { gte: new Date(Date.now() - 35 * 86_400_000) } }, include: { sources: true }, take: 500 });
  let inserted = 0;
  const eventIds = new Set<string>();
  for (const { announcement, sourceId } of candidates) {
    if (recent.some((event) => event.sources.some((reference) => reference.url === announcement.url))) continue;
    const normalizedTitle = normalizeListingTitle(announcement.title);
    const match = recent.find((event) => event.exchange === announcement.exchange && event.symbol === announcement.symbol && event.type === announcement.type && Math.abs(event.announcedAt.getTime() - announcement.announcedAt.getTime()) <= 36 * 60 * 60_000 && similarity(event.normalizedTitle, normalizedTitle) >= .55);
    if (match) continue;
    const event = await prisma.listingEvent.create({ data: {
      exchange: announcement.exchange, asset: announcement.asset, symbol: announcement.symbol, title: announcement.title,
      normalizedTitle, type: announcement.type, status: deriveListingStatus(announcement.type, announcement.tradingStartsAt), confirmation: "OFICIAL",
      announcedAt: announcement.announcedAt, tradingStartsAt: announcement.tradingStartsAt, pairs: announcement.pairs,
      sources: { create: { sourceId, externalId: announcement.externalId, title: announcement.title, url: announcement.url, excerpt: announcement.excerpt, publishedAt: announcement.announcedAt } },
    }, include: { sources: true } });
    recent.push(event); inserted += 1; eventIds.add(event.id);
  }

  const events = await prisma.listingEvent.findMany({ where: { announcedAt: { gte: new Date(Date.now() - 30 * 86_400_000) } }, select: { id: true, asset: true, exchange: true, symbol: true, announcementPrice: true, type: true, tradingStartsAt: true } });
  const publicData = await fetchPublicMarkets([...new Set(events.map((event) => event.asset))], fetchImpl);
  for (const event of events) {
    const markets = publicData.markets.filter((entry) => entry.asset === event.asset);
    const primary = markets.find((entry) => entry.exchange === event.exchange) ?? markets[0];
    await prisma.$transaction([
      ...markets.map((entry) => prisma.listingMarket.upsert({ where: { eventId_exchange_pair: { eventId: event.id, exchange: entry.exchange, pair: entry.pair } }, create: { eventId: event.id, exchange: entry.exchange, pair: entry.pair, price: entry.price, volume24h: entry.volume24h, change24hPercent: entry.change24hPercent }, update: { price: entry.price, volume24h: entry.volume24h, change24hPercent: entry.change24hPercent, observedAt: new Date() } })),
      prisma.listingEvent.update({ where: { id: event.id }, data: {
        status: deriveListingStatus(event.type as never, event.tradingStartsAt), alreadyTradingExchanges: [...new Set(markets.map((entry) => entry.exchange))],
        currentPrice: primary?.price ?? null, volume24h: primary?.volume24h ?? null, change24hPercent: primary?.change24hPercent ?? null,
        changeSinceAnnouncement: event.announcementPrice && primary?.price ? ((primary.price - Number(event.announcementPrice)) / Number(event.announcementPrice)) * 100 : null,
        marketUpdatedAt: primary ? new Date() : null,
      } }),
    ]);
  }
  return { inserted, eventIds: [...eventIds], sources: sourceResults, marketProvidersUnavailable: publicData.failures, refreshMinutes: refreshMinutes() };
}

export async function listListingEvents(filters: { period: "24h" | "7d" | "30d"; exchange?: string; asset?: string; type?: string; status?: string; confirmation?: string }) {
  const duration = filters.period === "24h" ? 86_400_000 : filters.period === "7d" ? 7 * 86_400_000 : 30 * 86_400_000;
  const events = await prisma.listingEvent.findMany({ where: {
    announcedAt: { gte: new Date(Date.now() - duration) },
    ...(filters.exchange ? { exchange: filters.exchange } : {}), ...(filters.asset ? { asset: filters.asset.toUpperCase() } : {}),
    ...(filters.type ? { type: filters.type } : {}), ...(filters.status ? { status: filters.status } : {}), ...(filters.confirmation ? { confirmation: filters.confirmation } : {}),
  }, include: { sources: { include: { source: true } }, markets: true, aiAnalysis: true }, orderBy: { announcedAt: "desc" }, take: 150 });
  const sources = await prisma.listingSource.findMany({ orderBy: { exchange: "asc" } });
  return { events, sources, refreshMinutes: refreshMinutes() };
}
