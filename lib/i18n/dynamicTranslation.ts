import { createHash } from "node:crypto";
import OpenAI from "openai";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";
import type { Locale } from "./config";

export const TRANSLATION_PROMPT_VERSION = "ui-content-translation-v1";
const MODEL = process.env.OPENAI_TRANSLATION_MODEL ?? "gpt-5.6";
const translatedSchema = z.object({ items: z.array(z.object({ id: z.string(), payload: z.record(z.string()) })) });
export type TranslationEntityType = "NEWS_EVENT" | "LISTING_EVENT";
type SourceItem = { id: string; payload: Record<string, string> };
const hash = (payload: unknown) => createHash("sha256").update(JSON.stringify(payload)).digest("hex");

async function sourceItems(entityType: TranslationEntityType, ids: string[]): Promise<SourceItem[]> {
  if (entityType === "NEWS_EVENT") {
    const events = await prisma.newsEvent.findMany({ where: { id: { in: ids } }, include: { aiAnalysis: true } });
    return events.map((event) => ({ id: event.id, payload: { title: event.canonicalTitle, summary: event.aiAnalysis?.summary ?? event.normalizedSummary ?? "", whyItMatters: event.aiAnalysis?.whyItMatters ?? "", sentiment: event.aiAnalysis?.sentiment ?? "", impact: event.aiAnalysis?.impact ?? "", confidence: event.aiAnalysis?.confidence ?? "", category: event.category, sourceConfidence: event.sourceConfidence } }));
  }
  const events = await prisma.listingEvent.findMany({ where: { id: { in: ids } }, include: { aiAnalysis: true } });
  return events.map((event) => ({ id: event.id, payload: { title: event.title, summary: event.aiAnalysis?.summary ?? "", explanation: event.aiAnalysis?.explanation ?? "", impact: event.aiAnalysis?.impact ?? "", confidence: event.aiAnalysis?.confidence ?? "", type: event.type, status: event.status, confirmation: event.confirmation } }));
}

export async function ensureTranslations(entityType: TranslationEntityType, ids: string[], locale: Locale) {
  const uniqueIds = [...new Set(ids)].slice(0, 20);
  const sources = await sourceItems(entityType, uniqueIds);
  const existing = await prisma.contentTranslation.findMany({ where: { entityType, entityId: { in: uniqueIds }, locale } });
  const existingById = new Map(existing.map((item) => [item.entityId, item]));
  const missing = sources.filter((source) => existingById.get(source.id)?.sourceHash !== hash(source.payload));
  let usage: { inputTokens: number | null; outputTokens: number | null; totalTokens: number | null } | null = null;
  if (missing.length) {
    if (!process.env.OPENAI_API_KEY) throw new Error("TRANSLATION_AI_NOT_CONFIGURED");
    const response = await new OpenAI({ apiKey: process.env.OPENAI_API_KEY }).responses.parse({
      model: MODEL, reasoning: { effort: "low" },
      input: [
        { role: "system", content: `Translate user-facing crypto news/listing text to ${locale === "en" ? "English" : locale === "es" ? "Spanish" : "Portuguese"}. Preserve symbols, exchanges, pairs, numbers, URLs and technical terms. Do not add facts. Return every id and the same payload keys.` },
        { role: "user", content: JSON.stringify({ entityType, items: missing }) },
      ],
      text: { format: zodTextFormat(translatedSchema, "localized_content") }, max_output_tokens: 4_000,
    });
    const parsed = translatedSchema.parse(response.output_parsed);
    usage = { inputTokens: response.usage?.input_tokens ?? null, outputTokens: response.usage?.output_tokens ?? null, totalTokens: response.usage?.total_tokens ?? null };
    for (const [index, item] of parsed.items.entries()) {
      const source = missing.find((candidate) => candidate.id === item.id); if (!source) continue;
      const saved = await prisma.contentTranslation.upsert({ where: { entityType_entityId_locale: { entityType, entityId: item.id, locale } }, create: { entityType, entityId: item.id, locale, payload: item.payload as Prisma.InputJsonValue, sourceHash: hash(source.payload), model: response.model, promptVersion: TRANSLATION_PROMPT_VERSION, inputTokens: index === 0 ? usage.inputTokens : null, outputTokens: index === 0 ? usage.outputTokens : null, totalTokens: index === 0 ? usage.totalTokens : null }, update: { payload: item.payload as Prisma.InputJsonValue, sourceHash: hash(source.payload), model: response.model, promptVersion: TRANSLATION_PROMPT_VERSION, inputTokens: index === 0 ? usage.inputTokens : null, outputTokens: index === 0 ? usage.outputTokens : null, totalTokens: index === 0 ? usage.totalTokens : null } });
      existingById.set(item.id, saved);
    }
  }
  return { translations: Object.fromEntries([...existingById].map(([id, item]) => [id, item.payload])), generated: missing.length, calls: missing.length ? 1 : 0, usage, model: missing.length ? MODEL : null };
}

export async function readTranslations(entityType: TranslationEntityType, ids: string[], locale: Locale) {
  const rows = await prisma.contentTranslation.findMany({ where: { entityType, entityId: { in: ids.slice(0, 100) }, locale } });
  return Object.fromEntries(rows.map((row) => [row.entityId, row.payload]));
}
