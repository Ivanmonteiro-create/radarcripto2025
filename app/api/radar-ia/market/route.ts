import { NextResponse } from "next/server";
import { ApiError, apiErrorResponse } from "@/lib/server/api";
import { requireApiAuth } from "@/lib/server/auth";
import { getRadarAiConfig } from "@/lib/radar-ai/config";
import { radarSymbolSchema } from "@/lib/radar-ai/contracts";
import { fetchMarketSnapshot, MarketDataError } from "@/lib/radar-ai/marketData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const unauthorized = await requireApiAuth();
  if (unauthorized) return unauthorized;
  try {
    const symbol = radarSymbolSchema.safeParse(new URL(request.url).searchParams.get("symbol"));
    if (!symbol.success) throw new ApiError(400, "INVALID_SYMBOL");
    const snapshot = await fetchMarketSnapshot(symbol.data);
    return NextResponse.json({ ok: true, snapshot, aiConfigured: getRadarAiConfig().configured });
  } catch (error) {
    if (error instanceof MarketDataError) return NextResponse.json({ ok: false, error: error.code }, { status: 502 });
    return apiErrorResponse(error);
  }
}
