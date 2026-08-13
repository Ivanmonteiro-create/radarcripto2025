import { XMLParser } from "fast-xml-parser";
import { createNormalizedItem, shouldInclude } from "./normalize";
import { isSafeNewsUrl, type NewsSourceDefinition } from "./sources";
import type { NormalizedNewsItem } from "./contracts";

type FetchLike = typeof fetch;
type FeedRecord = Record<string, unknown>;

export class NewsSourceError extends Error {
  constructor(readonly code: "SOURCE_TIMEOUT" | "SOURCE_UNAVAILABLE" | "SOURCE_INVALID") {
    super(code);
  }
}

function list(value: unknown): FeedRecord[] {
  if (Array.isArray(value)) return value.filter((item): item is FeedRecord => typeof item === "object" && item !== null);
  return typeof value === "object" && value !== null ? [value as FeedRecord] : [];
}

function text(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "object" && value !== null) {
    const record = value as FeedRecord;
    return text(record["#text"] ?? record._ ?? record.href ?? record["@_href"] ?? "");
  }
  return "";
}

function link(record: FeedRecord): string {
  const value = record.link;
  if (Array.isArray(value)) {
    const alternate = value.find((entry) => typeof entry === "object" && entry !== null && ((entry as FeedRecord)["@_rel"] === "alternate" || !(entry as FeedRecord)["@_rel"]));
    return text(alternate ?? value[0]);
  }
  return text(value);
}

function date(record: FeedRecord): Date | null {
  const raw = text(record.pubDate ?? record.published ?? record.updated ?? record.date);
  const parsed = new Date(raw);
  return raw && Number.isFinite(parsed.getTime()) ? parsed : null;
}

function extractRecords(parsed: FeedRecord): FeedRecord[] {
  const rss = parsed.rss as FeedRecord | undefined;
  const channel = rss?.channel as FeedRecord | undefined;
  if (channel?.item) return list(channel.item);
  const feed = parsed.feed as FeedRecord | undefined;
  if (feed?.entry) return list(feed.entry);
  throw new NewsSourceError("SOURCE_INVALID");
}

export async function fetchNewsSource(
  source: NewsSourceDefinition,
  options: { fetchImpl?: FetchLike; timeoutMs?: number; now?: () => Date } = {},
): Promise<NormalizedNewsItem[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 10_000);
  try {
    const response = await (options.fetchImpl ?? fetch)(source.feedUrl, {
      cache: "no-store",
      signal: controller.signal,
      headers: { accept: "application/rss+xml, application/atom+xml, application/xml, text/xml", "user-agent": "RadarCrypto-News/1.0 (+https://radarcripto.space)" },
    });
    if (!response.ok) throw new NewsSourceError("SOURCE_UNAVAILABLE");
    const declaredLength = Number(response.headers.get("content-length") ?? 0);
    if (declaredLength > 2_000_000) throw new NewsSourceError("SOURCE_INVALID");
    const xml = await response.text();
    if (xml.length > 2_000_000) throw new NewsSourceError("SOURCE_INVALID");
    const parsed = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true, processEntities: false, trimValues: true }).parse(xml) as FeedRecord;
    const cutoff = (options.now?.() ?? new Date()).getTime() - 31 * 24 * 60 * 60 * 1_000;
    return extractRecords(parsed)
      .map((record) => {
        const title = text(record.title);
        const url = link(record);
        const publishedAt = date(record);
        const excerpt = text(record.description ?? record.summary ?? record.content);
        if (!title || !url || !publishedAt || publishedAt.getTime() < cutoff || !isSafeNewsUrl(url, source.allowedHosts)) return null;
        if (!shouldInclude(source, title, excerpt)) return null;
        return createNormalizedItem({ source, externalId: text(record.guid ?? record.id) || null, title, url, excerpt, publishedAt });
      })
      .filter((item): item is NormalizedNewsItem => item !== null)
      .slice(0, 40);
  } catch (error) {
    if (error instanceof NewsSourceError) throw error;
    if (error instanceof Error && error.name === "AbortError") throw new NewsSourceError("SOURCE_TIMEOUT");
    throw new NewsSourceError("SOURCE_INVALID");
  } finally {
    clearTimeout(timeout);
  }
}
