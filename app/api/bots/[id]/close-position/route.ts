import { NextResponse } from "next/server";
import { apiErrorResponse, parseJson } from "@/lib/server/api";
import { requireMutationAuth } from "@/lib/server/auth";
import { ExecutionService } from "@/lib/server/executionService";
import { prisma } from "@/lib/server/prisma";
import { botActionSchema } from "@/lib/server/schemas";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const unauthorized = await requireMutationAuth(request); if (unauthorized) return unauthorized;
  try {
    await parseJson(request, botActionSchema);
    const { id } = await context.params;
    await prisma.$transaction([
      prisma.botConfig.update({ where: { id }, data: { status: "PAUSED" } }),
      prisma.botRuntime.update({ where: { botId: id }, data: { status: "PAUSED" } }),
    ]);
    await new ExecutionService().closePosition(id);
    return NextResponse.json({ ok: true });
  } catch (error) { return apiErrorResponse(error); }
}
