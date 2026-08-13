import { NextResponse } from "next/server";
import { ApiError, apiErrorResponse, parseJson } from "@/lib/server/api";
import { requireMutationAuth } from "@/lib/server/auth";
import { rangeStrategyConfigSchema } from "@/lib/server/schemas";
import { findTestnetSpotSymbol } from "@/lib/server/spotSymbolCatalog";
import { validateRangeConfiguration } from "@/lib/trading/rangeCycle";

type Context = { params: Promise<{ id: string }> };
export async function POST(request: Request, context: Context) {
  const unauthorized = await requireMutationAuth(request);
  if (unauthorized) return unauthorized;
  try {
    await context.params;
    const input = await parseJson(request, rangeStrategyConfigSchema);
    const symbol = await findTestnetSpotSymbol(input.symbol);
    if (!symbol) throw new ApiError(400, "SYMBOL_NOT_FOUND_ON_BINANCE_SPOT_TESTNET");
    return NextResponse.json({ ok: true, symbol, validation: validateRangeConfiguration(input, symbol) });
  } catch (error) { return apiErrorResponse(error); }
}
