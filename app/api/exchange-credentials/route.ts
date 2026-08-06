import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, apiErrorResponse, parseJson } from "@/lib/server/api";
import { requireApiAuth, requireMutationAuth } from "@/lib/server/auth";
import {
  deleteTestnetCredentials,
  getTestnetCredentialSummary,
  saveAndValidateTestnetCredentials,
  validateCredentialFormat,
  validateStoredTestnetCredentials,
} from "@/lib/server/exchangeCredentials";

const credentialSchema = z.object({
  apiKey: z.string().refine(validateCredentialFormat, "Invalid Testnet API key format"),
  apiSecret: z.string().refine(validateCredentialFormat, "Invalid Testnet API secret format"),
  symbol: z.string().regex(/^[A-Za-z0-9]{2,15}USDT$/i).default("BTCUSDT"),
}).strict();
const validationSchema = z.object({ symbol: z.string().regex(/^[A-Za-z0-9]{2,15}USDT$/i).default("BTCUSDT") }).strict();

export async function GET() {
  const unauthorized = await requireApiAuth(); if (unauthorized) return unauthorized;
  try {
    return NextResponse.json({ ok: true, credentials: await getTestnetCredentialSummary() });
  } catch (error) { return apiErrorResponse(error); }
}

export async function PUT(request: Request) {
  const unauthorized = await requireMutationAuth(request); if (unauthorized) return unauthorized;
  try {
    const input = await parseJson(request, credentialSchema);
    const result = await saveAndValidateTestnetCredentials(input.apiKey, input.apiSecret, input.symbol?.toUpperCase() ?? "BTCUSDT");
    return NextResponse.json({ ok: true, credentials: result });
  } catch (error) {
    if (error instanceof Error && /Binance Testnet|fetch|timeout/i.test(error.message)) {
      return apiErrorResponse(new ApiError(422, "TESTNET_CREDENTIAL_VALIDATION_FAILED"));
    }
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireMutationAuth(request); if (unauthorized) return unauthorized;
  try {
    const input = await parseJson(request, validationSchema);
    const validation = await validateStoredTestnetCredentials(input.symbol?.toUpperCase() ?? "BTCUSDT");
    return NextResponse.json({ ok: true, validation });
  } catch { return apiErrorResponse(new ApiError(422, "TESTNET_READ_ONLY_VALIDATION_FAILED")); }
}

export async function DELETE(request: Request) {
  const unauthorized = await requireMutationAuth(request); if (unauthorized) return unauthorized;
  try {
    return NextResponse.json({ ok: true, deleted: await deleteTestnetCredentials() });
  } catch (error) { return apiErrorResponse(error); }
}
