import { createHash } from "node:crypto";
import type { NormalizedNewsItem } from "./contracts";
import type { NewsSourceDefinition } from "./sources";

const STOP_WORDS = new Set(["a", "an", "and", "as", "at", "by", "for", "from", "in", "is", "of", "on", "the", "to", "with", "de", "da", "do", "e", "em", "para"]);
const TOKEN_EQUIVALENTS: Record<string, string> = {
  announced: "announce", announces: "announce", announcement: "announce",
  bought: "buy", buys: "buy", purchase: "buy", purchases: "buy", purchased: "buy", acquire: "buy", acquires: "buy", acquired: "buy",
  approved: "approve", approves: "approve", approval: "approve",
  sold: "sell", sells: "sell", sale: "sell",
};
const RELEVANT_TERMS = /\b(bitcoin|btc|ethereum|ether|eth|solana|sol|cardano|ada|chainlink|link|crypto|cryptocurrency|digital asset|blockchain|stablecoin|token|etf|fomc|interest rate|inflation|monetary policy|central bank)\b/i;

export function stripMarkup(value: string, maxLength = 600): string {
  return value
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function normalizeTitle(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token))
    .map((token) => TOKEN_EQUIVALENTS[token] ?? token)
    .join(" ");
}

export function extractAssets(text: string): string[] {
  const value = text.toLowerCase();
  const assets: string[] = [];
  if (/\b(bitcoin|btc)\b/.test(value)) assets.push("BTC");
  if (/\b(ethereum|ether|eth)\b/.test(value)) assets.push("ETH");
  if (/\b(solana|sol)\b/.test(value)) assets.push("SOL");
  if (/\b(cardano|ada)\b/.test(value)) assets.push("ADA");
  if (/\b(chainlink|link)\b/.test(value)) assets.push("LINK");
  return assets.length ? assets : ["MERCADO"];
}

export function classifyCategory(text: string): string {
  const value = text.toLowerCase();
  if (/hack|exploit|breach|attack|stolen|security incident/.test(value)) return "SEGURANÇA";
  if (/etf|exchange.traded fund/.test(value)) return "ETF";
  if (/sec |regulat|legislat|lawmakers|compliance|rulemaking/.test(value)) return "REGULAÇÃO";
  if (/court|judge|lawsuit|judicial|ruling/.test(value)) return "JUDICIAL";
  if (/fomc|interest rate|inflation|monetary policy|central bank|federal reserve/.test(value)) return "MACROECONOMIA";
  if (/stablecoin|usdt|usdc/.test(value)) return "STABLECOINS";
  if (/hard fork|upgrade|mainnet|testnet|network update|protocol upgrade/.test(value)) return "REDE";
  if (/token unlock|unlock schedule/.test(value)) return "TOKEN_UNLOCK";
  if (/list(?:ing|ed)|delist/.test(value)) return "LISTAGEM";
  if (/exchange|binance|coinbase|kraken/.test(value)) return "EXCHANGE";
  if (/institution|treasury|company buys|company sells|acquisition/.test(value)) return "INSTITUCIONAL";
  if (/partnership|partner|adoption/.test(value)) return "PARCERIA";
  return "OUTRO";
}

export function shouldInclude(source: NewsSourceDefinition, title: string, excerpt: string): boolean {
  return source.includeAll || RELEVANT_TERMS.test(`${title} ${excerpt}`);
}

export function createNormalizedItem(input: {
  source: NewsSourceDefinition;
  externalId?: string | null;
  title: string;
  url: string;
  excerpt?: string | null;
  publishedAt: Date;
}): NormalizedNewsItem {
  const title = stripMarkup(input.title, 300);
  const excerpt = input.excerpt ? stripMarkup(input.excerpt) : null;
  const normalizedTitle = normalizeTitle(title);
  const combined = `${title} ${excerpt ?? ""}`;
  return {
    sourceKey: input.source.key,
    sourceName: input.source.name,
    sourceTier: input.source.tier,
    sourceConfidence: input.source.confidence,
    externalId: input.externalId ?? null,
    title,
    normalizedTitle,
    url: input.url,
    excerpt,
    publishedAt: input.publishedAt,
    assets: extractAssets(combined),
    category: classifyCategory(combined),
    contentHash: createHash("sha256").update(`${normalizedTitle}|${excerpt ?? ""}`).digest("hex"),
  };
}

export function titleSimilarity(left: string, right: string): number {
  const a = new Set(left.split(" ").filter(Boolean));
  const b = new Set(right.split(" ").filter(Boolean));
  if (!a.size || !b.size) return 0;
  const intersection = [...a].filter((token) => b.has(token)).length;
  return intersection / (a.size + b.size - intersection);
}

export function isSameEvent(candidate: Pick<NormalizedNewsItem, "normalizedTitle" | "assets" | "category" | "publishedAt">, event: { normalizedTitle: string; assets: string[]; category: string; lastPublishedAt: Date }): boolean {
  const hours = Math.abs(candidate.publishedAt.getTime() - event.lastPublishedAt.getTime()) / 3_600_000;
  if (hours > 36) return false;
  const sharedAssets = candidate.assets.includes("MERCADO") || event.assets.includes("MERCADO") || candidate.assets.some((asset) => event.assets.includes(asset));
  const sameSubject = candidate.category === event.category || candidate.category === "OUTRO" || event.category === "OUTRO";
  return sharedAssets && sameSubject && titleSimilarity(candidate.normalizedTitle, event.normalizedTitle) >= 0.58;
}

export function sourceConfidence(tiers: number[]): string {
  if (tiers.includes(1)) return "OFICIAL";
  if (tiers.includes(2)) return "ALTA CONFIANÇA";
  return tiers.length > 1 ? "MÍDIA ESPECIALIZADA" : "NÃO CONFIRMADO";
}
