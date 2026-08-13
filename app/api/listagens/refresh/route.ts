import { NextResponse } from "next/server";
import { ApiError, apiErrorResponse, parseJson } from "@/lib/server/api";
import { requireMutationAuth } from "@/lib/server/auth";
import { listingRefreshSchema } from "@/lib/listings/contracts";
import { collectListings, ListingsRefreshError } from "@/lib/listings/listingService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const unauthorized = await requireMutationAuth(request); if (unauthorized) return unauthorized;
  try { await parseJson(request, listingRefreshSchema); return NextResponse.json({ ok: true, collection: await collectListings() }); }
  catch (error) { return error instanceof ListingsRefreshError ? apiErrorResponse(new ApiError(429, error.code)) : apiErrorResponse(error); }
}
