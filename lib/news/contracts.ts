import { z } from "zod";

export const NEWS_ASSETS = ["BTC", "ETH", "SOL", "ADA", "LINK", "MERCADO"] as const;
export const NEWS_CATEGORIES = [
  "REGULAÇÃO", "INSTITUCIONAL", "ETF", "EXCHANGE", "SEGURANÇA", "MACROECONOMIA",
  "REDE", "TOKEN_UNLOCK", "PARCERIA", "STABLECOINS", "LISTAGEM", "JUDICIAL", "OUTRO",
] as const;
export const newsAssetSchema = z.enum(NEWS_ASSETS);
export const newsCategorySchema = z.enum(NEWS_CATEGORIES);
export const newsImpactSchema = z.enum(["BAIXO", "MÉDIO", "ALTO", "CRÍTICO"]);
export const newsSentimentSchema = z.enum(["POSITIVO", "NEGATIVO", "NEUTRO", "MISTO"]);
export const newsConfidenceSchema = z.enum(["BAIXA", "MÉDIA", "ALTA"]);

export const newsAiEventSchema = z.object({
  eventId: z.string().min(1),
  summary: z.string().min(1).max(700),
  whyItMatters: z.string().min(1).max(700),
  affectedAssets: z.array(newsAssetSchema).min(1).max(6),
  impact: newsImpactSchema,
  sentiment: newsSentimentSchema,
  confidence: newsConfidenceSchema,
});
export const newsAiBatchSchema = z.object({ analyses: z.array(newsAiEventSchema).max(10) });
export type NewsAiEvent = z.infer<typeof newsAiEventSchema>;

export const newsRefreshSchema = z.object({ analyzeWithAi: z.literal(false).default(false) });
export const newsPeriodSchema = z.enum(["24h", "7d", "30d"]).default("24h");

export type NormalizedNewsItem = {
  sourceKey: string;
  sourceName: string;
  sourceTier: number;
  sourceConfidence: string;
  externalId: string | null;
  title: string;
  normalizedTitle: string;
  url: string;
  excerpt: string | null;
  publishedAt: Date;
  assets: string[];
  category: string;
  contentHash: string;
};
