import { NextResponse } from "next/server";
import { requireMutationAuth, SESSION_COOKIE } from "@/lib/server/auth";

export async function POST(request: Request) {
  const unauthorized = await requireMutationAuth(request); if (unauthorized) return unauthorized;
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", expires: new Date(0), path: "/",
  });
  return response;
}
