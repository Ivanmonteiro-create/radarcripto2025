import { NextResponse } from "next/server";
import { apiErrorResponse, parseJson } from "@/lib/server/api";
import { requireApiAuth, requireMutationAuth } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import { killSwitchSchema } from "@/lib/server/schemas";

export async function GET() {
  const unauthorized = await requireApiAuth(); if (unauthorized) return unauthorized;
  try {
    const control = await prisma.systemControl.upsert({ where: { id: "global" }, create: { id: "global" }, update: {} });
    return NextResponse.json({ ok: true, control });
  } catch (error) { return apiErrorResponse(error); }
}

export async function POST(request: Request) {
  const unauthorized = await requireMutationAuth(request); if (unauthorized) return unauthorized;
  try {
    const input = await parseJson(request, killSwitchSchema);
    const control = await prisma.$transaction(async (tx) => {
      const updated = await tx.systemControl.upsert({
        where: { id: "global" }, create: { id: "global", killSwitchActive: input.active, reason: input.reason },
        update: { killSwitchActive: input.active, reason: input.reason },
      });
      if (input.active) {
        await tx.botConfig.updateMany({ where: { status: "RUNNING" }, data: { status: "PAUSED" } });
        await tx.botRuntime.updateMany({ where: { status: "RUNNING" }, data: { status: "PAUSED" } });
      }
      return updated;
    });
    return NextResponse.json({ ok: true, control });
  } catch (error) { return apiErrorResponse(error); }
}
