import { NextResponse } from "next/server";
import { ApiError, apiErrorResponse } from "@/lib/server/api";
import { requireApiAuth } from "@/lib/server/auth";
import { newsAssetSchema, newsCategorySchema, newsImpactSchema, newsPeriodSchema } from "@/lib/news/contracts";
import { listNewsEvents } from "@/lib/news/newsService";
import { normalizeLocale } from "@/lib/i18n/config";
import { readTranslations } from "@/lib/i18n/dynamicTranslation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const unauthorized = await requireApiAuth();
  if (unauthorized) return unauthorized;
  try {
    const params = new URL(request.url).searchParams;
    const period = newsPeriodSchema.safeParse(params.get("period") ?? "24h");
    const asset = params.get("asset");
    const impact = params.get("impact");
    const category = params.get("category");
    if (!period.success || (asset && !newsAssetSchema.safeParse(asset).success) || (impact && !newsImpactSchema.safeParse(impact).success) || (category && !newsCategorySchema.safeParse(category).success)) {
      throw new ApiError(400, "INVALID_NEWS_FILTER");
    }
    const data = await listNewsEvents({ period: period.data, asset: asset || undefined, impact: impact || undefined, category: category || undefined });
    const locale = normalizeLocale(params.get("locale"));
    const translations = await readTranslations("NEWS_EVENT", data.events.map((event) => event.id), locale);
    return NextResponse.json({ ok: true, ...data, locale, translations, aiConfigured: Boolean(process.env.OPENAI_API_KEY) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
