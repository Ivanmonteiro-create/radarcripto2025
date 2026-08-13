import { Prisma } from "@prisma/client";
import { z } from "zod";
import { NextResponse } from "next/server";
import { ApiError, apiErrorResponse } from "@/lib/server/api";
import { requireApiAuth, requireMutationAuth } from "@/lib/server/auth";
import { getRadarAiConfig } from "@/lib/radar-ai/config";
import { createRadarAnalysisSchema, radarSymbolSchema, serializeAnalysis } from "@/lib/radar-ai/contracts";
import { normalizeLocale } from "@/lib/i18n/config";
import { fetchMarketSnapshot, MarketDataError } from "@/lib/radar-ai/marketData";
import { analyzeMarketWithOpenAi, RADAR_PROMPT_VERSION, RadarAiError } from "@/lib/radar-ai/openaiAnalysis";
import { evaluateRadarUsage } from "@/lib/radar-ai/usagePolicy";
import { prisma } from "@/lib/server/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const unauthorized = await requireApiAuth();
  if (unauthorized) return unauthorized;
  try {
    const params = new URL(request.url).searchParams;
    const rawSymbol = params.get("symbol");
    const locale = normalizeLocale(params.get("locale"));
    const symbol = rawSymbol ? radarSymbolSchema.safeParse(rawSymbol) : null;
    if (symbol && !symbol.success) throw new ApiError(400, "INVALID_SYMBOL");
    const analyses = await prisma.marketAiAnalysis.findMany({
      where: { ...(symbol?.success ? { symbol: symbol.data } : {}), locale },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return NextResponse.json({ ok: true, analyses: analyses.map(serializeAnalysis) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

function startOfUtcDay(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function aiErrorStatus(error: RadarAiError): number {
  if (error.code === "AI_TIMEOUT") return 504;
  if (error.code === "AI_RATE_LIMITED") return 429;
  if (error.code === "AI_INVALID_RESPONSE") return 502;
  return 503;
}

export async function POST(request: Request) {
  const unauthorized = await requireMutationAuth(request);
  if (unauthorized) return unauthorized;
  let snapshot: Awaited<ReturnType<typeof fetchMarketSnapshot>> | null = null;
  let requestedLocale = normalizeLocale(null);
  const config = getRadarAiConfig();
  try {
    if (!config.configured) throw new ApiError(503, "RADAR_AI_NOT_CONFIGURED");
    const body = await request.json() as unknown;
    const parsed = createRadarAnalysisSchema.extend({ locale: z.enum(["pt", "en", "es"]).optional() }).safeParse(body);
    if (!parsed.success) throw new ApiError(400, "INVALID_PAYLOAD", parsed.error.flatten());
    const { symbol } = parsed.data;
    const locale = normalizeLocale(parsed.data.locale);
    requestedLocale = locale;
    const now = new Date();
    const latest = await prisma.marketAiAnalysis.findFirst({ where: { symbol }, orderBy: { createdAt: "desc" }, select: { createdAt: true } });
    const usedToday = config.dailyLimit > 0
      ? await prisma.marketAiAnalysis.count({ where: { createdAt: { gte: startOfUtcDay(now) } } })
      : 0;
    const usage = evaluateRadarUsage({ now, latestCreatedAt: latest?.createdAt ?? null, usedToday, rateLimitSeconds: config.rateLimitSeconds, dailyLimit: config.dailyLimit });
    if (!usage.allowed) throw new ApiError(429, usage.code, usage.code === "RADAR_AI_RATE_LIMITED" ? { retryAfterSeconds: config.rateLimitSeconds } : undefined);

    snapshot = await fetchMarketSnapshot(symbol);
    const analysis = await analyzeMarketWithOpenAi(snapshot, { model: config.model, timeoutMs: config.timeoutMs, locale });
    const record = await prisma.marketAiAnalysis.create({
      data: {
        symbol,
        status: "SUCCESS",
        price: new Prisma.Decimal(snapshot.currentPrice),
        marketDataSource: snapshot.source,
        marketSnapshot: snapshot as Prisma.InputJsonValue,
        result: analysis.result as Prisma.InputJsonValue,
        promptVersion: RADAR_PROMPT_VERSION,
        model: analysis.model,
        openAiResponseId: analysis.responseId,
        inputTokens: analysis.usage.inputTokens,
        outputTokens: analysis.usage.outputTokens,
        totalTokens: analysis.usage.totalTokens,
        locale,
      },
    });
    return NextResponse.json({ ok: true, analysis: serializeAnalysis(record) }, { status: 201 });
  } catch (error) {
    if (error instanceof MarketDataError) return NextResponse.json({ ok: false, error: error.code }, { status: 502 });
    if (error instanceof RadarAiError) {
      if (snapshot) {
        await prisma.marketAiAnalysis.create({
          data: {
            symbol: snapshot.symbol,
            status: "ERROR",
            price: new Prisma.Decimal(snapshot.currentPrice),
            marketDataSource: snapshot.source,
            marketSnapshot: snapshot as Prisma.InputJsonValue,
            promptVersion: RADAR_PROMPT_VERSION,
            model: config.model,
            errorCode: error.code,
            locale: requestedLocale,
          },
        }).catch(() => undefined);
      }
      return NextResponse.json({ ok: false, error: error.code }, { status: aiErrorStatus(error) });
    }
    return apiErrorResponse(error);
  }
}
