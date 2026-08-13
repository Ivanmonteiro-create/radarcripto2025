import { NextResponse } from "next/server";
import { ApiError, apiErrorResponse } from "@/lib/server/api";
import { requireApiAuth } from "@/lib/server/auth";
import { listingConfirmationSchema, listingExchangeSchema, listingPeriodSchema, listingStatusSchema, listingTypeSchema } from "@/lib/listings/contracts";
import { listListingEvents } from "@/lib/listings/listingService";
import { normalizeLocale } from "@/lib/i18n/config";
import { readTranslations } from "@/lib/i18n/dynamicTranslation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const unauthorized = await requireApiAuth(); if (unauthorized) return unauthorized;
  try {
    const params = new URL(request.url).searchParams;
    const period = listingPeriodSchema.safeParse(params.get("period") ?? "30d");
    const exchange = params.get("exchange"), type = params.get("type"), status = params.get("status"), confirmation = params.get("confirmation"), asset = params.get("asset");
    if (!period.success || (exchange && !listingExchangeSchema.safeParse(exchange).success) || (type && !listingTypeSchema.safeParse(type).success) || (status && !listingStatusSchema.safeParse(status).success) || (confirmation && !listingConfirmationSchema.safeParse(confirmation).success) || (asset && !/^[A-Z0-9]{2,15}$/i.test(asset))) throw new ApiError(400, "INVALID_LISTING_FILTER");
    const data = await listListingEvents({ period: period.data, exchange: exchange || undefined, asset: asset || undefined, type: type || undefined, status: status || undefined, confirmation: confirmation || undefined });
    const locale = normalizeLocale(params.get("locale"));
    const translations = await readTranslations("LISTING_EVENT", data.events.map((event) => event.id), locale);
    return NextResponse.json({ ok: true, ...data, locale, translations, aiConfigured: Boolean(process.env.OPENAI_API_KEY) });
  } catch (error) { return apiErrorResponse(error); }
}
