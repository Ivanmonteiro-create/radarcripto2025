import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const SESSION_COOKIE = "rc_internal_session";
export const CSRF_HEADER = "x-radarcrypto-csrf";
const SESSION_DURATION_SECONDS = 8 * 60 * 60;

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error("AUTH_SECRET must contain at least 32 characters");
  return value;
}

function signature(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function verifyInternalToken(candidate: string): boolean {
  const expected = process.env.INTERNAL_API_TOKEN;
  return Boolean(expected && safeEqual(candidate, expected));
}

export function createSessionValue(now = Date.now()): string {
  const expiresAt = Math.floor(now / 1000) + SESSION_DURATION_SECONDS;
  const payload = `internal:${expiresAt}`;
  return `${payload}.${signature(payload)}`;
}

export function verifySessionValue(value?: string): boolean {
  if (!value) return false;
  const parts = value.split(".");
  if (parts.length !== 2) return false;
  const [payload, suppliedSignature] = parts;
  const [subject, expiresRaw] = payload.split(":");
  if (subject !== "internal" || Number(expiresRaw) <= Math.floor(Date.now() / 1000)) return false;
  return safeEqual(signature(payload), suppliedSignature);
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifySessionValue(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function requireApiAuth(): Promise<NextResponse | null> {
  if (await isAuthenticated()) return null;
  return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
}

export function requireCsrf(request: Request): NextResponse | null {
  if (request.headers.get(CSRF_HEADER) !== "1") {
    return NextResponse.json({ ok: false, error: "CSRF_CHECK_FAILED" }, { status: 403 });
  }
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    return NextResponse.json({ ok: false, error: "CSRF_CHECK_FAILED" }, { status: 403 });
  }
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ ok: false, error: "CSRF_CHECK_FAILED" }, { status: 403 });
  }
  return null;
}

export async function requireMutationAuth(request: Request): Promise<NextResponse | null> {
  return (await requireApiAuth()) ?? requireCsrf(request);
}
