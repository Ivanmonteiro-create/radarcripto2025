import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse, parseJson } from "@/lib/server/api";
import { requireMutationAuth } from "@/lib/server/auth";
import { ensureTranslations } from "@/lib/i18n/dynamicTranslation";
const schema = z.object({ entityType: z.enum(["NEWS_EVENT", "LISTING_EVENT"]), ids: z.array(z.string().cuid()).min(1).max(20), locale: z.enum(["pt", "en", "es"]) }).strict();
export async function POST(request: Request) { const unauthorized = await requireMutationAuth(request); if (unauthorized) return unauthorized; try { const input = await parseJson(request, schema); return NextResponse.json({ ok: true, ...(await ensureTranslations(input.entityType, input.ids, input.locale)) }); } catch (error) { return apiErrorResponse(error); } }
