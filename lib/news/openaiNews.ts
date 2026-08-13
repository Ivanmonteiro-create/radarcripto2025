import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { newsAiBatchSchema, type NewsAiEvent } from "./contracts";

export const NEWS_PROMPT_VERSION = "news-events-v1";
export const NEWS_SYSTEM_PROMPT = `Você é a camada de síntese do módulo Notícias e Eventos do RadarCrypto.
Analise somente eventos e fontes fornecidos pelo servidor.
Não invente fatos, números, fontes, ativos ou contexto ausente.
Uma fonte secundária sem fonte primária deve ser tratada como não confirmada.
Resuma sem reproduzir extensamente o texto da fonte.
Sentimento é uma leitura informativa e não implica direção futura do preço.
Não recomende compra, venda, posição, ordem, robô ou alteração de estratégia.
Não prometa retorno. Destaque incerteza por meio do campo de confiança.
Retorne exatamente uma análise para cada eventId recebido, em português e no schema solicitado.`;

export type NewsAiInput = {
  id: string;
  title: string;
  category: string;
  assets: string[];
  sourceConfidence: string;
  firstPublishedAt: Date;
  sources: Array<{ name: string; confidence: string; title: string; excerpt: string | null; url: string; publishedAt: Date }>;
};

export class NewsAiError extends Error {
  constructor(readonly code: "NEWS_AI_TIMEOUT" | "NEWS_AI_RATE_LIMITED" | "NEWS_AI_INVALID_RESPONSE" | "NEWS_AI_UNAVAILABLE") { super(code); }
}

function status(error: unknown): number | null {
  return typeof error === "object" && error !== null && "status" in error && typeof error.status === "number" ? error.status : null;
}

export async function analyzeNewsBatch(
  events: NewsAiInput[],
  options: { apiKey?: string; model?: string; timeoutMs?: number; client?: OpenAI } = {},
): Promise<{ analyses: NewsAiEvent[]; model: string; usage: { inputTokens: number | null; outputTokens: number | null; totalTokens: number | null } }> {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey && !options.client) throw new NewsAiError("NEWS_AI_UNAVAILABLE");
  const model = options.model ?? process.env.OPENAI_RADAR_MODEL ?? "gpt-5.6";
  const client = options.client ?? new OpenAI({ apiKey });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? Number(process.env.RADAR_AI_TIMEOUT_MS ?? 20_000));
  try {
    const input = events.map((event) => ({
      eventId: event.id,
      title: event.title,
      category: event.category,
      serverDetectedAssets: event.assets,
      sourceConfidence: event.sourceConfidence,
      firstPublishedAt: event.firstPublishedAt.toISOString(),
      sources: event.sources.map((source) => ({ ...source, publishedAt: source.publishedAt.toISOString() })),
    }));
    const response = await client.responses.parse({
      model,
      reasoning: { effort: "low" },
      input: [
        { role: "system", content: NEWS_SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify({ events: input }) },
      ],
      text: { format: zodTextFormat(newsAiBatchSchema, "news_event_analyses") },
      max_output_tokens: 3_000,
    }, { signal: controller.signal });
    if (!response.output_parsed) throw new NewsAiError("NEWS_AI_INVALID_RESPONSE");
    const parsed = newsAiBatchSchema.parse(response.output_parsed);
    const expected = new Set(events.map((event) => event.id));
    if (parsed.analyses.length !== expected.size || parsed.analyses.some((analysis) => !expected.has(analysis.eventId))) {
      throw new NewsAiError("NEWS_AI_INVALID_RESPONSE");
    }
    return {
      analyses: parsed.analyses,
      model,
      usage: { inputTokens: response.usage?.input_tokens ?? null, outputTokens: response.usage?.output_tokens ?? null, totalTokens: response.usage?.total_tokens ?? null },
    };
  } catch (error) {
    if (error instanceof NewsAiError) throw error;
    if (error instanceof Error && (error.name === "AbortError" || error.message.toLowerCase().includes("timed out"))) throw new NewsAiError("NEWS_AI_TIMEOUT");
    if (error instanceof Error && error.name === "ZodError") throw new NewsAiError("NEWS_AI_INVALID_RESPONSE");
    if (status(error) === 429) throw new NewsAiError("NEWS_AI_RATE_LIMITED");
    throw new NewsAiError("NEWS_AI_UNAVAILABLE");
  } finally {
    clearTimeout(timeout);
  }
}
