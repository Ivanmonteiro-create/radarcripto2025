import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse, parseJson } from "@/lib/server/api";
import { requireMutationAuth } from "@/lib/server/auth";
import { executeManualTestnetOrder } from "@/lib/server/manualTestnet";

const schema = z.object({
  confirmation: z.literal("I_AUTHORIZE_BINANCE_SPOT_TESTNET_ORDER"),
  botId: z.string().min(1),
  symbol: z.string().regex(/^[A-Za-z0-9]{2,15}USDT$/i),
  side: z.enum(["BUY", "SELL"]),
  type: z.enum(["MARKET", "LIMIT"]),
  quantity: z.number().positive().optional(),
  quoteOrderQty: z.number().positive().optional(),
  price: z.number().positive().optional(),
}).strict().superRefine((value, context) => {
  if (value.type === "LIMIT" && (!value.quantity || !value.price)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "LIMIT requires quantity and price" });
  }
  if (value.type === "MARKET" && value.side === "BUY" && !value.quantity && !value.quoteOrderQty) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "MARKET BUY requires quantity or quoteOrderQty" });
  }
  if (value.type === "MARKET" && value.side === "SELL" && !value.quantity) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "MARKET SELL requires quantity" });
  }
});

export async function POST(request: Request) {
  const unauthorized = await requireMutationAuth(request); if (unauthorized) return unauthorized;
  try {
    const input = await parseJson(request, schema);
    const order = await executeManualTestnetOrder({ ...input, symbol: input.symbol.toUpperCase() });
    return NextResponse.json({ ok: true, order }, { status: 201 });
  } catch (error) { return apiErrorResponse(error); }
}
