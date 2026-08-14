import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/server/api";
import { requireMutationAuth } from "@/lib/server/auth";
import { analyzePendingNewsEvents } from "@/lib/news/newsAnalysisService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const unauthorized = await requireMutationAuth(request);
  if (unauthorized) return unauthorized;
  try {
    const ai = await analyzePendingNewsEvents();
    return NextResponse.json({ ok: true, ai });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
