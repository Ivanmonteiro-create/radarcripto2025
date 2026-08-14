import type { ListingAnnouncement } from "./contracts";
import { classifyListingType, extractAsset, extractPairs, parseTradingStart } from "./normalize";
import { isSafeListingUrl, type ListingSourceDefinition } from "./sources";

export class ListingSourceError extends Error {
  constructor(readonly code: "SOURCE_UNAVAILABLE" | "SOURCE_INVALID_RESPONSE") { super(code); }
}

async function json(url: string, fetchImpl: typeof fetch) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetchImpl(url, { signal: controller.signal, headers: { accept: "application/json", "user-agent": "RadarCrypto-Listings/1.0" } });
    if (!response.ok) throw new ListingSourceError("SOURCE_UNAVAILABLE");
    const text = await response.text();
    if (text.length > 2_000_000) throw new ListingSourceError("SOURCE_INVALID_RESPONSE");
    return JSON.parse(text) as Record<string, unknown>;
  } catch (error) {
    if (error instanceof ListingSourceError) throw error;
    throw new ListingSourceError("SOURCE_UNAVAILABLE");
  } finally { clearTimeout(timer); }
}

function finish(input: Omit<ListingAnnouncement, "asset" | "symbol" | "pairs" | "type" | "tradingStartsAt"> & { sourceTypes: string[] }): ListingAnnouncement | null {
  const body = `${input.title} ${input.excerpt ?? ""}`;
  const type = classifyListingType(input.title, input.sourceTypes);
  if (type === "OTHER") return null;
  const pairs = extractPairs(body);
  const asset = extractAsset(input.title, pairs);
  if (!asset) return null;
  return { ...input, asset, symbol: pairs[0] ?? asset, pairs, type, tradingStartsAt: parseTradingStart(body) };
}

export async function fetchListingAnnouncements(source: ListingSourceDefinition, fetchImpl: typeof fetch = fetch): Promise<ListingAnnouncement[]> {
  const payload = await json(source.endpointUrl, fetchImpl);
  if (source.key === "kucoin-announcements") {
    const data = payload.data as { items?: Array<Record<string, unknown>> } | undefined;
    if (!Array.isArray(data?.items)) throw new ListingSourceError("SOURCE_INVALID_RESPONSE");
    return data.items.flatMap((raw) => {
      const title = String(raw.annTitle ?? "").slice(0, 500), url = String(raw.annUrl ?? "");
      if (!title || !isSafeListingUrl(url, source.allowedHosts)) return [];
      const announcedAt = new Date(Number(raw.cTime));
      if (Number.isNaN(announcedAt.getTime())) return [];
      const item = finish({ sourceKey: source.key, exchange: source.exchange, externalId: String(raw.annId ?? "") || null, title, excerpt: String(raw.annDesc ?? "").slice(0, 700) || null, url, announcedAt, sourceTypes: Array.isArray(raw.annType) ? raw.annType.map(String) : [] });
      return item ? [item] : [];
    });
  }
  const result = payload.result as { list?: Array<Record<string, unknown>> } | undefined;
  if (!Array.isArray(result?.list)) throw new ListingSourceError("SOURCE_INVALID_RESPONSE");
  return result.list.flatMap((raw) => {
    const title = String(raw.title ?? "").slice(0, 500), url = String(raw.url ?? "");
    if (!title || !isSafeListingUrl(url, source.allowedHosts)) return [];
    const announcedAt = new Date(Number(raw.publishTime ?? raw.dateTimestamp));
    if (Number.isNaN(announcedAt.getTime())) return [];
    const typeObject = raw.type as { key?: unknown; title?: unknown } | undefined;
    const item = finish({ sourceKey: source.key, exchange: source.exchange, externalId: null, title, excerpt: String(raw.description ?? "").slice(0, 700) || null, url, announcedAt, sourceTypes: [String(typeObject?.key ?? ""), String(typeObject?.title ?? ""), ...(Array.isArray(raw.tags) ? raw.tags.map(String) : [])] });
    return item ? [item] : [];
  });
}
