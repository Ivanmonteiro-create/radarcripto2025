import { createHash } from "node:crypto";
import type { ListingAnnouncement, ListingStatus, ListingType } from "./contracts";

const QUOTES = ["USDT", "USDC", "BTC", "ETH", "EUR", "BRL"];
const IGNORE = new Set(["NEW", "LISTING", "DELISTING", "TOKEN", "SPOT", "KUCOIN", "BYBIT", "WILL", "THE", "AND", "USD", "PERPETUAL", "CONTRACT", "TRADFI", "PRE", "IPO"]);

export function normalizeListingTitle(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function classifyListingType(title: string, sourceTypes: string[] = []): ListingType {
  const value = `${title} ${sourceTypes.join(" ")}`.toLowerCase();
  if (/delist|remov/.test(value)) return /pair/.test(value) ? "PAIR_REMOVAL" : "DELISTING";
  if (/pre[- ]?(market|ipo)/.test(value)) return "PRE_MARKET";
  if (/launchpool/.test(value)) return "LAUNCHPOOL";
  if (/launchpad/.test(value)) return "LAUNCHPAD";
  if (/airdrop/.test(value)) return "AIRDROP";
  if (/new trading pair|adds? .* trading pair/.test(value)) return "NEW_TRADING_PAIR";
  if (/new.listing|listed on|gets listed|world premiere|new-listings/.test(value)) return "NEW_LISTING";
  return "OTHER";
}

export function extractPairs(text: string): string[] {
  const pairs = new Set<string>();
  const compact = text.toUpperCase().match(/\b[A-Z0-9]{2,15}(?:USDT|USDC|BTC|ETH|EUR|BRL)\b/g) ?? [];
  for (const pair of compact) pairs.add(pair);
  const separated = text.toUpperCase().match(/\b[A-Z0-9]{2,15}\s*[/_-]\s*(?:USDT|USDC|BTC|ETH|EUR|BRL)\b/g) ?? [];
  for (const pair of separated) pairs.add(pair.replace(/[\s/_-]/g, ""));
  return [...pairs].slice(0, 12);
}

export function extractAsset(title: string, pairs: string[]): string | null {
  if (pairs[0]) return QUOTES.reduce((asset, quote) => asset.endsWith(quote) ? asset.slice(0, -quote.length) : asset, pairs[0]);
  const parenthesized = [...title.toUpperCase().matchAll(/\(([A-Z0-9]{2,15})\)/g)].map((match) => match[1]).find((value) => !IGNORE.has(value));
  if (parenthesized) return parenthesized;
  const beforePair = title.toUpperCase().match(/(?:LISTING|DELISTING)\s+(?:OF\s+)?([A-Z0-9]{2,15})\b/)?.[1];
  return beforePair && !IGNORE.has(beforePair) ? beforePair : null;
}

export function parseTradingStart(text: string): Date | null {
  const match = text.match(/(?:Trading|Spot Trading|trading begins?)[^\d]*(\d{1,2}:\d{2})\s*(?:on\s*)?([A-Za-z]+\s+\d{1,2},?\s+\d{4})\s*\(UTC\)/i)
    ?? text.match(/(?:Trading|Spot Trading)[^\d]*([A-Za-z]+\s+\d{1,2},?\s+\d{4})[^\d]*(\d{1,2}:\d{2})\s*\(UTC\)/i);
  if (!match) return null;
  const dateText = match[1].includes(":") ? `${match[2]} ${match[1]} UTC` : `${match[1]} ${match[2]} UTC`;
  const value = new Date(dateText);
  return Number.isNaN(value.getTime()) ? null : value;
}

export function deriveListingStatus(type: ListingType, tradingStartsAt: Date | null, now = new Date()): ListingStatus {
  if (type === "DELISTING" || type === "PAIR_REMOVAL") return tradingStartsAt && tradingStartsAt <= now ? "DELISTED" : "DELISTING_SCHEDULED";
  if (tradingStartsAt) return tradingStartsAt > now ? "UPCOMING" : "LIVE";
  return "ANNOUNCED";
}

export function listingFingerprint(input: Pick<ListingAnnouncement, "exchange" | "symbol" | "type" | "announcedAt">) {
  return createHash("sha256").update(`${input.exchange}|${input.symbol}|${input.type}|${input.announcedAt.toISOString()}`).digest("hex");
}
