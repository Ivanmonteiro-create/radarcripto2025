import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse, parseJson } from "@/lib/server/api";
import { createSessionValue, requireCsrf, SESSION_COOKIE, verifyInternalToken } from "@/lib/server/auth";

const schema = z.object({ token: z.string().min(1).max(512) }).strict();

export async function POST(request: Request) {
  const csrfFailure = requireCsrf(request); if (csrfFailure) return csrfFailure;
  try {
    const { token } = await parseJson(request, schema);
    if (!verifyInternalToken(token)) return NextResponse.json({ ok: false, error: "INVALID_CREDENTIALS" }, { status: 401 });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, createSessionValue(), {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 8 * 60 * 60,
    });
    return response;
  } catch (error) {
    return apiErrorResponse(error);
  }
}
