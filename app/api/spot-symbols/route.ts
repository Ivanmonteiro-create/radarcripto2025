import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/server/api";
import { requireApiAuth } from "@/lib/server/auth";
import { searchTestnetSpotSymbols } from "@/lib/server/spotSymbolCatalog";

export async function GET(request: Request) {
  const unauthorized = await requireApiAuth();
  if (unauthorized) return unauthorized;
  try {
    const query = new URL(request.url).searchParams.get("q") ?? "";
    const symbols = await searchTestnetSpotSymbols(query);
    return NextResponse.json({ ok: true, environment: "BINANCE_SPOT_TESTNET", cacheMinutes: 15, symbols });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
