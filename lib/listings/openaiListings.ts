import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { listingAiBatchSchema } from "./contracts";

export const LISTINGS_PROMPT_VERSION = "listing-events-v1";
const SYSTEM = `Você resume eventos oficiais de listagem para o RadarCrypto.
Use somente os dados fornecidos. Não invente datas, pares, preços ou confirmação.
Não recomende compra, venda ou qualquer ação de trading. Movimento de preço não é lucro.
Retorne uma análise curta em português para cada eventId recebido.`;

export class ListingAiError extends Error {
  constructor(readonly code: "LISTINGS_AI_UNAVAILABLE" | "LISTINGS_AI_INVALID_RESPONSE" | "LISTINGS_AI_TIMEOUT" | "LISTINGS_AI_RATE_LIMITED") { super(code); }
}

export async function analyzeListingBatch(events: Array<Record<string, unknown>>, options: { apiKey?: string; model?: string; client?: OpenAI; timeoutMs?: number } = {}) {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey && !options.client) throw new ListingAiError("LISTINGS_AI_UNAVAILABLE");
  const model = options.model ?? process.env.OPENAI_RADAR_MODEL ?? "gpt-5.6";
  const client = options.client ?? new OpenAI({ apiKey });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 20_000);
  try {
    const response = await client.responses.parse({ model, reasoning: { effort: "low" }, input: [{ role: "system", content: SYSTEM }, { role: "user", content: JSON.stringify({ events }) }], text: { format: zodTextFormat(listingAiBatchSchema, "listing_event_analyses") }, max_output_tokens: 3_000 }, { signal: controller.signal });
    if (!response.output_parsed) throw new ListingAiError("LISTINGS_AI_INVALID_RESPONSE");
    const parsed = listingAiBatchSchema.parse(response.output_parsed);
    const expected = new Set(events.map((event) => String(event.id)));
    if (parsed.analyses.length !== expected.size || parsed.analyses.some((analysis) => !expected.has(analysis.eventId))) throw new ListingAiError("LISTINGS_AI_INVALID_RESPONSE");
    return { analyses: parsed.analyses, model, usage: { inputTokens: response.usage?.input_tokens ?? null, outputTokens: response.usage?.output_tokens ?? null, totalTokens: response.usage?.total_tokens ?? null } };
  } catch (error) {
    if (error instanceof ListingAiError) throw error;
    if (error instanceof Error && (error.name === "AbortError" || error.message.toLowerCase().includes("timed out"))) throw new ListingAiError("LISTINGS_AI_TIMEOUT");
    if (typeof error === "object" && error && "status" in error && error.status === 429) throw new ListingAiError("LISTINGS_AI_RATE_LIMITED");
    throw new ListingAiError("LISTINGS_AI_UNAVAILABLE");
  } finally { clearTimeout(timer); }
}
