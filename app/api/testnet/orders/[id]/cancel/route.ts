import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse, parseJson } from "@/lib/server/api";
import { requireMutationAuth } from "@/lib/server/auth";
import { cancelManualTestnetOrder } from "@/lib/server/manualTestnet";

type Context = { params: Promise<{ id: string }> };
const schema = z.object({ confirmation: z.literal("I_AUTHORIZE_BINANCE_SPOT_TESTNET_CANCEL") }).strict();

export async function POST(request: Request, context: Context) {
  const unauthorized = await requireMutationAuth(request); if (unauthorized) return unauthorized;
  try {
    await parseJson(request, schema);
    const { id } = await context.params;
    return NextResponse.json({ ok: true, order: await cancelManualTestnetOrder(id) });
  } catch (error) { return apiErrorResponse(error); }
}
