import { z } from "zod";

export const LISTING_EXCHANGES = ["BINANCE", "OKX", "BYBIT", "KUCOIN", "GATEIO", "MEXC"] as const;
export const LISTING_TYPES = ["NEW_LISTING", "DELISTING", "NEW_TRADING_PAIR", "PAIR_REMOVAL", "PRE_MARKET", "LAUNCHPOOL", "LAUNCHPAD", "AIRDROP", "OTHER"] as const;
export const LISTING_STATUSES = ["ANNOUNCED", "UPCOMING", "LIVE", "COMPLETED", "DELISTING_SCHEDULED", "DELISTED", "UNCONFIRMED"] as const;
export const LISTING_CONFIRMATIONS = ["OFICIAL", "CONFIRMADO POR MÚLTIPLAS FONTES", "SECUNDÁRIO", "RUMOR / NÃO CONFIRMADO"] as const;

export const listingRefreshSchema = z.object({ analyzeWithAi: z.literal(false).default(false) });
export const listingPeriodSchema = z.enum(["24h", "7d", "30d"]).default("30d");
export const listingExchangeSchema = z.enum(LISTING_EXCHANGES);
export const listingTypeSchema = z.enum(LISTING_TYPES);
export const listingStatusSchema = z.enum(LISTING_STATUSES);
export const listingConfirmationSchema = z.enum(LISTING_CONFIRMATIONS);

export const listingAiEventSchema = z.object({
  eventId: z.string().min(1),
  summary: z.string().min(1).max(700),
  explanation: z.string().min(1).max(700),
  impact: z.enum(["BAIXO", "MÉDIO", "ALTO", "CRÍTICO"]),
  confidence: z.enum(["BAIXA", "MÉDIA", "ALTA"]),
});
export const listingAiBatchSchema = z.object({ analyses: z.array(listingAiEventSchema).max(10) });

export type ListingType = typeof LISTING_TYPES[number];
export type ListingStatus = typeof LISTING_STATUSES[number];
export type ListingAnnouncement = {
  sourceKey: string;
  exchange: "BYBIT" | "KUCOIN";
  externalId: string | null;
  title: string;
  excerpt: string | null;
  url: string;
  announcedAt: Date;
  tradingStartsAt: Date | null;
  asset: string;
  symbol: string;
  pairs: string[];
  type: ListingType;
};

export type PublicMarket = { exchange: string; pair: string; asset: string; price: number | null; volume24h: number | null; change24hPercent: number | null };
