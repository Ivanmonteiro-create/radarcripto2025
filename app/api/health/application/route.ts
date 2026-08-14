import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/server/auth";
import { applicationHealth } from "@/lib/server/health";

export async function GET() {
  const unauthorized = await requireApiAuth(); if (unauthorized) return unauthorized;
  return NextResponse.json({ ok: true, health: await applicationHealth() });
}
