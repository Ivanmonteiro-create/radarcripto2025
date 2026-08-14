import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse, parseJson } from "@/lib/server/api";
import { requireCsrf } from "@/lib/server/auth";
import { LOCALE_COOKIE } from "@/lib/i18n/config";

const schema = z.object({ locale: z.enum(["pt", "en", "es"]) }).strict();
export async function PUT(request: Request) {
  const csrf = requireCsrf(request); if (csrf) return csrf;
  try {
    const { locale } = await parseJson(request, schema);
    const response = NextResponse.json({ ok: true, locale });
    response.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 365 * 24 * 60 * 60, sameSite: "lax", secure: process.env.NODE_ENV === "production", httpOnly: true });
    return response;
  } catch (error) { return apiErrorResponse(error); }
}
