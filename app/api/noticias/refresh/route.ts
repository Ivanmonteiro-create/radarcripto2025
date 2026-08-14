import { NextResponse } from "next/server";
import { ApiError, apiErrorResponse, parseJson } from "@/lib/server/api";
import { requireMutationAuth } from "@/lib/server/auth";
import { newsRefreshSchema } from "@/lib/news/contracts";
import { collectNews, NewsRefreshError } from "@/lib/news/newsService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const unauthorized = await requireMutationAuth(request);
  if (unauthorized) return unauthorized;
  try {
    await parseJson(request, newsRefreshSchema);
    const collection = await collectNews();
    return NextResponse.json({ ok: true, collection });
  } catch (error) {
    if (error instanceof NewsRefreshError) return apiErrorResponse(new ApiError(429, error.code));
    return apiErrorResponse(error);
  }
}
